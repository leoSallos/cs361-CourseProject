const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function insertValidTimeslot(start, end, row, day){
    // check for conflict
    for (var i = 0; i < 3; i++){
        if (userSettings.timeslots[i].length > 0){ 
            if (userSettings.timeslots[i][day].length > 0){
                for (var j = 0; j < userSettings.timeslots[i][day].length; j++){
                    const dataStart = userSettings.timeslots[i][day][j].start;
                    const dataEnd = userSettings.timeslots[i][day][j].end;
                    if ((dataStart == null && dataEnd >= start) ||
                        (dataEnd == null && dataStart <= end) ||
                        (dataStart <= start && dataEnd >= start) ||
                        (dataEnd >= end && dataStart <= end)){
                        return false;
                    }
                }
            }
        } 
    }

    // insert into row
    if (userSettings.timeslots[row].length == 0){
        var newArr = [];
        newArr[day] = [{start: start, end: end}];
        userSettings.timeslots[row] = newArr;
    } else if (userSettings.timeslots[row][day].length == 0){
        userSettings.timeslots[row][day] = [{start: start, end: end}];
    } else {
        var prevBack = false;
        for (var i = 0; i < userSettings.timeslots[row][day].length; i++){
            const dataStart = userSettings.timeslots[row][day][i].start;
            const dataEnd = userSettings.timeslots[row][day][i].end;
            if (prevBack){
                if (dataStart > end){
                    userSettings.timeslots[row][day][i].splice(i, 0, {start: start, end: end});
                } else {
                    prevBack == false;
                }
            } else {
                if (dataEnd < start) prevBack = true;
            }
        }

        userSettings.timeslots[row][day].push({start: start, end: end});
    }
    
    return true;
}

function submitTimeslot(row, day, addButton, submitButton, startInput, endInput){
    // check for proper input
    if (startInput.value == "" && endInput.value == ""){
        alert("At least one input must have a value.");
        return;
    }

    // get input values
    if (startInput.value == ""){
        var startTime = null;
    } else {
        var startData = startInput.value.split(':');
        var startTime = startData[0] * 60;
        startTime += startData[1] * 1;
    }

    if (endInput.value == ""){
        var endTime = null;
    } else {
        var endData = endInput.value.split(':');
        var endTime = endData[0] * 60;
        endTime += endData[1] * 1;
    }

    // insert new timeslot
    if (!insertValidTimeslot(startTime, endTime, row, day)){
        alert("Timeslot has overlap.");
        return;
    }
    
    // submit new timslot
    postUserSettings();

    // remove temp inputs
    addButton.classList.remove("hidden");
    submitButton.parentNode.removeChild(startInput);
    submitButton.parentNode.removeChild(endInput);
    submitButton.parentNode.removeChild(submitButton);

    // refresh timeslot data
    clearTimeslots();
    insertTimeslots();
}

function addTimeslot(row, day){
    // get button and container
    var button = document.querySelector("#r" + (row + 1) + "-" + days[day] + " .add-timeslot-button");
    button.classList.add("hidden");

    // make time inputs
    var startInput = document.createElement("input");
    startInput.id = "timeslot-start-input";
    startInput.type = "time";
    var endInput = document.createElement("input");
    endInput.id = "timeslot-end-input";
    endInput.type = "time";

    // make submit button
    var submitButton = document.createElement("button");
    submitButton.classList.add("add-timeslot-button");
    submitButton.textContent = "Submit";
    submitButton.addEventListener("click", function(){submitTimeslot(row, day, button, submitButton, startInput, endInput)});

    button.parentNode.insertBefore(startInput, button);
    button.parentNode.insertBefore(endInput, button);
    button.parentNode.insertBefore(submitButton, button);
}

function removeTimeslot(row, day, idx){
}

function clearTags(){
    var tagSelect = document.getElementById("settings-tag-select");
    while (tagSelect.hasChildNodes()) tagSelect.removeChild(tagSelect.firstChild);
}

function insertTags(){
    var tagSelect = document.getElementById("settings-tag-select");
    for (var i = 0; i < userSettings.tags.length; i++){
        var newOption = document.createElement("option");
        newOption.value = userSettings.tags[i];
        newOption.textContent = userSettings.tags[i];
        tagSelect.appendChild(newOption);
    }
}

function clearTimeslots(){
    var timeslotDays = document.getElementsByClassName("timeslot-day-container");

    for (var i = 0; i < timeslotDays.length; i++){
        while(timeslotDays[i].firstElementChild.classList.contains("timeslot-button")){
            timeslotDays[i].removeChild(timeslotDays[i].firstChild);
        }
    }
}

function convertToTime(totalMins){
    // get hours
    var hrs = Math.floor(totalMins / 60);
    if (userSettings.clock == "12hr"){
        if (hrs == 0){
            hrs = "12";
            var tod = "a";
        } else if (hrs > 12) {
            hrs %= 12;
            var tod = "p";
        } else {
            var tod = "a";
        }
    } else {
        var tod = "";
    }

    // get minutes
    var mins = totalMins % 60;
    if (mins < 10) mins = "0" + mins;

    return hrs + ":" + mins + tod;
}

function insertTimeslots(){
    var timeslotDays = document.getElementsByClassName("timeslot-day-container");

    var row = 0;
    for (var i = 0; i < timeslotDays.length; i++){
        if (i != 0 && i % 7 == 0) row++;
        
        if (userSettings.timeslots[row].length > i % 7){
            if (userSettings.timeslots[row][i%7] == null) userSettings.timeslots[row][i%7] = [];
            for (var j = 0; j < userSettings.timeslots[row][i%7].length; j++){
                var newTimeslot = document.createElement("button");
                newTimeslot.classList.add("timeslot-button");

                // get time to display
                const start = userSettings.timeslots[row][i%7][j].start;
                if (start == null){
                    var startString = "-";
                } else {
                    var startString = convertToTime(start);
                }
                const end = userSettings.timeslots[row][i%7][j].end;
                if (end == null){
                    var endString = "-";
                } else {
                    var endString = convertToTime(end);
                }
                newTimeslot.textContent = startString + " " + endString;

                newTimeslot.addEventListener("click", function(){removeTimeslot(row, i%7, j)});

                timeslotDays[i].insertBefore(newTimeslot, timeslotDays[i].querySelector(".add-timeslot-button"));
            }
        }
    }
}

function insertUserData(){
    clearTags();
    insertTags();
    clearTimeslots();
    insertTimeslots();

    // insert clock mode
    var clock = document.getElementById("clock-settings-select");
    clock.value = userSettings.clock;

    // insert theme
    var theme = document.getElementById("theme-select");
    theme.value = userSettings.theme;
}

async function init(){
    await getUserSettings();
    insertUserData();
}

init();

// event listeners
var clockSelect = document.getElementById("clock-settings-select");
var themeSelect = document.getElementById("theme-select");
var addTagButton = document.getElementById("add-tag-button");
var removeTagsButton = document.getElementById("remove-tags-button");

clockSelect.addEventListener("change", async function(){
    userSettings.clock = clockSelect.value;
    await postUserSettings();
});
themeSelect.addEventListener("change", async function(){
    userSettings.theme = themeSelect.value;
    await postUserSettings();
});
addTagButton.addEventListener("click", async function(){
    var newTagInput = document.getElementById("new-tag-input");
    var newTag = newTagInput.value;
    if (!newTag || newTag == ""){
        alert("Please enter a name for the new tag.");
    } else if (userSettings.tags.includes(newTag)){
        alert("Tag already exists.");
    } else {
        userSettings.tags.push(newTag);
        await postUserSettings();
        newTagInput.value = "";
        insertUserData();
    }
});
removeTagsButton.addEventListener("click", async function(){
    if (!confirm("Are you sure you want to delete these tags?")) return;
    var tagOptions = document.querySelectorAll("#settings-tag-select option");
    var offset = 0;
    for (var i = 0; i < tagOptions.length; i++){
        if(tagOptions[i].selected){
            userSettings.tags.splice(i - offset, 1);
            offset++;
        }
    }
    await postUserSettings();
    insertUserData();
});
