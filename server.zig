const std = @import("std");
const log = std.log;
const net = std.net;
const fs = std.fs;
const mem = std.mem;

const IP = "127.0.0.1";
const PORT: u16 = 8000;
const RECV_BUFF_SIZE: u16 = 4096;

const RequestError = error {
    HeaderMalformed,
    UnsupportedMethod,
    UnsupportedProtocol,
    NoPath,
};

const HeaderNames = enum {
    Host,
    @"User-Agent",
    Connection,
};

const HTTPHeader = struct {
    requestLine: []const u8,
    host: []const u8,
    userAgent: []const u8,
    connection: []const u8,
};

const contentTypes = .{
    .{".html", "text/html"},
    .{".css", "text/css"},
    .{".js", "text/javascript"},
    .{".json", "application/json"},
    .{".webp", "image/webp"},
    .{".weba", "audio/webm"},
    .{".txt", "text/plain"},
};

pub fn main() !void {
    // start server
    log.info("Starting server", .{});
    const addr = try net.Address.resolveIp(IP, PORT);
    var listener = try addr.listen(.{.reuse_address = true });

    // begin run loop
    while (listener.accept()) |conn| {
        // accept and recv header
        log.info("Accepted connection", .{});
        defer log.info("Connection Closed\n", .{});
        var recvBuff: [RECV_BUFF_SIZE]u8 = undefined;
        var readWrap = conn.stream.reader(&recvBuff);
        const reader: *std.Io.Reader = readWrap.interface();

        // parse data
        const header: HTTPHeader = parseHeader(reader) catch {
            log.err("HTTP header", .{});
            continue;
        };
        const method, const path = parseRequestLine(header.requestLine) catch |err| {
            switch (err){
                error.UnsupportedProtocol => log.err("Unsupported Protocol", .{}),
                error.UnsupportedMethod => log.err("Unsupported Method", .{}),
                error.NoPath => log.err("No Path", .{}),
                else => log.err("Header parsing: {s}", .{header.requestLine}),
            }
            continue;
        };
        log.info("Request Line: {s}", .{header.requestLine});

        // continue if connection is to close
        if (mem.eql(u8, header.connection, "close")) continue;

        // setup for response
        var writeBuffer: [RECV_BUFF_SIZE]u8 = undefined;
        var httpWriter = conn.stream.writer(&writeBuffer);
        const writer: *std.Io.Writer = &httpWriter.interface;

        // make response
        if (mem.eql(u8, "GET", method)){
            respondGet(writer, path) catch |err| switch (err){
                error.FileNotFound => {},
                else => {
                    log.err("Response failed", .{});
                    continue;
                },
            };

        } else if (mem.eql(u8, "POST", method)){
            // TODO, add catch statement
            try handlePost(reader, writer, path);
            log.err("No database to post to", .{});
        }

    } else |err| {
        log.err("Accept failed", .{});
        return err;
    }
}

/// Parses a header into an HTTPHeader struct
fn parseHeader(reader: *std.Io.Reader) RequestError!HTTPHeader {
    var header = HTTPHeader{
        .requestLine = undefined,
        .host = undefined,
        .userAgent = undefined,
        .connection = undefined,
    };

    // get request line
    const rawRequestLine = reader.takeDelimiterExclusive('\n') catch return RequestError.HeaderMalformed; 
    header.requestLine = rawRequestLine[0..rawRequestLine.len-1];
    while (reader.takeDelimiterExclusive('\n'))|readLine| {
        if (mem.eql(u8, "\r", readLine)) break;
        const line = readLine[0..readLine.len-1];

        const nameSlice = mem.sliceTo(line, ':');
        if (nameSlice.len == line.len) return RequestError.HeaderMalformed;
        const headerName = std.meta.stringToEnum(HeaderNames, nameSlice) orelse continue;
        const headerValue = mem.trimLeft(u8, line[nameSlice.len + 1 ..], " ");
        switch (headerName){
            .Host => header.host = headerValue,
            .@"User-Agent" => header.userAgent = headerValue,
            .Connection => header.connection = headerValue,
        }
    } else |err| {
        switch (err){
            error.EndOfStream => {},
            else => return RequestError.HeaderMalformed,
        }
    }

    return header;
}

/// Parses request line for a data path
fn parseRequestLine(requestLine: []const u8) RequestError!struct {[]const u8, []const u8} {
    var requestLineItr = mem.tokenizeScalar(u8, requestLine, ' ');

    // get method
    const method = requestLineItr.next().?;
    if (!mem.eql(u8, method, "GET") and !mem.eql(u8, method, "POST")){
        return RequestError.UnsupportedMethod;
    }

    // get path
    var path = requestLineItr.next().?;
    if (path.len <= 0) return RequestError.NoPath;
    if (mem.eql(u8, path, "/")) path = "/index.html";

    // get protocol
    const protocol = requestLineItr.next().?;
    if (!mem.eql(u8, protocol, "HTTP/1.1")) return RequestError.UnsupportedProtocol;

    return .{method, path};
}

/// Responds to GET request
fn respondGet(writer: *std.Io.Writer, path: []const u8) !void {
    // get data to respond
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    const contentType = getContentType(path);
    var filePath: []u8 = undefined;
    if (mem.eql(u8, contentType, "text/html")){
        filePath = try mem.concat(allocator, u8, &[_][]const u8{"/pages", path});
    } else {
        filePath = try mem.concat(allocator, u8, &[_][]const u8{path});
    }
    defer allocator.free(filePath);
    const data = readFile(filePath, allocator) catch |err| {
        if (err == error.FileNotFound){
            if (mem.eql(u8, contentType, "application/json")){
                try writer.writeAll(get204());
            } else {
                try writer.writeAll(get404());
            }
            try writer.flush();
            return err;
        } else {
            log.err("File read error", .{});
            return err;
        }
    };
    defer allocator.free(data);

    // send response
    const httpHead = 
        "HTTP/1.1 200 OK \r\n" ++
        "Connection: close\r\n" ++
        "Content-Type: {s}\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n"
        ;
    try writer.print(httpHead, .{contentType, data.len});
    try writer.writeAll(data);
    try writer.flush();
}

/// Handles and responds to POST request
fn handlePost(reader: *std.Io.Reader, writer: *std.Io.Writer, path: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();

    // retrieve data
    const data = try reader.allocRemaining(allocator, std.Io.Limit.limited(std.math.maxInt(usize)));
    defer allocator.free(data);

    // write data to file
    const halfDataPath = try mem.concat(allocator, u8, &[_][]const u8{"/data", path});
    const dataPath = try mem.concat(allocator, u8, &[_][]const u8{halfDataPath, });
    writeFile(dataPath, data) catch |err| switch (err){
        error.FileNotFound => {
            try writer.writeAll(get404());
            try writer.flush();
            return err;
        },
        else => return err,
    };

    // send response
    const httpHead = 
        "HTTP/1.1 200 OK \r\n" ++
        "Connection: close\r\n" ++
        "\r\n"
        ;
    try writer.writeAll(httpHead);
    try writer.flush();
}

/// Reads file and returns contents of that file
/// - Returned string allocated on the heap with GPA
fn readFile(path: []const u8, allocator: mem.Allocator) ![]u8 {
    const localPath = path[1..];
    const file = fs.cwd().openFile(localPath, .{}) catch |err| switch (err){
        error.FileNotFound => {
            log.err("File not found: {s}", .{localPath});
            return err;
        },
        else => return err,
    };
    defer file.close();

    const maxSize = std.math.maxInt(usize);
    return try file.readToEndAlloc(allocator, maxSize);
}

/// Writes and trunkates string to file
fn writeFile(path: []const u8, data: []const u8) !void {
    const localPath = path[1..];
    const file = fs.cwd().openFile(localPath, .{}) catch |err| switch (err){
        error.FileNotFound => {
            log.err("File not found: {s}", .{localPath});
            return err;
        },
        else => return err,
    };
    defer file.close();

    try file.writeAll(data);
}

/// Gets the content type of the requested file
fn getContentType(path: []const u8) []const u8 {
    const extention = fs.path.extension(path);
    inline for (contentTypes) |ct| {
        if (mem.eql(u8, extention, ct[0])){
            return ct[1];
        }
    }

    return "text/plain";
}

/// Returns the 404 response
fn get404() []const u8 {
    return "HTTP/1.1 404 NOT FOUND \r\n" ++
        "Connection: close\r\n" ++
        "Content-Type: text/html\r\n" ++
        "Content-Length: 23\r\n" ++
        "\r\n" ++
        "<h1>Page Not Found</h1>"
        ;
}

/// Returns the 204 no content response
fn get204() []const u8 {
    return "HTTP/1.1 204 NO CONTENT\r\n" ++
        "Connection: close\r\n" ++
        "\r\n"
        ;
}
