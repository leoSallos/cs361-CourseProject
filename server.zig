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
};

const HTTPHeader = struct {
    requestLine: []const u8,
    host: []const u8,
    userAgent: []const u8,
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
        var recvLen: usize = 0;
        while (conn.stream.read(recvBuff[recvLen..])) |readLen|{
            if (readLen == 0) break;
            recvLen += readLen;
            if (mem.containsAtLeast(u8, recvBuff[0..recvLen], 1, "\r\n\r\n")) break;
        } else |_| {
            log.err("Improper request format", .{});
            continue;
        }
        
        // check for empty header
        const recvData = recvBuff[0..recvLen];
        if (recvData.len == 0){
            log.err("No header recieved.", .{});
            continue;
        }
        log.debug("{s}", .{recvData});

        // parse data
        const header: HTTPHeader = parseHeader(recvData) catch {
            log.err("HTTP header", .{});
            continue;
        };
        const path = parsePath(header.requestLine) catch {
            log.err("Header parsing", .{});
            continue;
        };

        // setup for response
        var gpa = std.heap.GeneralPurposeAllocator(.{}){};
        const allocator = gpa.allocator();
        var writeBuffer: [RECV_BUFF_SIZE]u8 = undefined;
        var httpWriter = conn.stream.writer(&writeBuffer);
        const writer: *std.Io.Writer = &httpWriter.interface;

        // get data to respond
        const contentType = getContentType(path);
        const data = readFile(path, allocator) catch |err| {
            if (err == error.FileNotFound){
                try writer.writeAll(get404());
                try writer.flush();
                continue;
            } else {
                log.err("File read error", .{});
                continue;
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

    } else |err| {
        log.err("Accept failed", .{});
        return err;
    }
}

/// Parses a header into an HTTPHeader struct
fn parseHeader(data: []const u8) RequestError!HTTPHeader {
    var header = HTTPHeader{
        .requestLine = undefined,
        .host = undefined,
        .userAgent = undefined,
    };
    
    var headerItr = mem.tokenizeSequence(u8, data, "\r\n");

    // get request line
    header.requestLine = headerItr.next() orelse return RequestError.HeaderMalformed;
    while (headerItr.next()) |line| {
        const nameSlice = mem.sliceTo(line, ':');
        if (nameSlice.len == line.len) return RequestError.HeaderMalformed;
        const headerName = std.meta.stringToEnum(HeaderNames, nameSlice) orelse continue;
        const headerValue = mem.trimLeft(u8, line[nameSlice.len + 1 ..], " ");
        switch (headerName){
            .Host => header.host = headerValue,
            .@"User-Agent" => header.userAgent = headerValue,
        }
    }

    return header;
}

/// Parses request line for a data path
fn parsePath(requestLine: []const u8) RequestError![]const u8 {
    var requestLineItr = mem.tokenizeScalar(u8, requestLine, ' ');

    // get method
    const method = requestLineItr.next().?;
    if (!mem.eql(u8, method, "GET")) return RequestError.UnsupportedMethod;

    // get path
    var path = requestLineItr.next().?;
    if (path.len <= 0) return RequestError.NoPath;
    if (mem.eql(u8, path, "/")) path = "/index.html";

    // get protocol
    const protocol = requestLineItr.next().?;
    if (!mem.eql(u8, protocol, "HTTP/1.1")) return RequestError.UnsupportedProtocol;

    return path;
}

/// Reads file and returns contents of that file
/// - Returned string allocated on the heap with GPA
fn readFile(path: []const u8, allocator: mem.Allocator) ![]u8 {
    const localPath = path[1..];
    const file = fs.cwd().openFile(localPath, .{}) catch |err| switch (err){
        error.FileNotFound => {
            log.err("File not found: {s}\n", .{localPath});
            return err;
        },
        else => return err,
    };
    defer file.close();

    const maxSize = std.math.maxInt(usize);
    return try file.readToEndAlloc(allocator, maxSize);
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
