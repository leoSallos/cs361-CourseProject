// date global data
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var dayList = [];
var today = new Date();
const absToday = new Date();
var popupSelectedIdx = undefined;

// user data
var prevMonthData = [];
var currMonthData = [];
var nextMonthData = [];

function convertToTime(totalMins){
    // get hours
    var hrs = Math.floor(totalMins / 60);
    if (userSettings.clock == "12hr"){
        if (hrs == 0){
            hrs = "12";
            var tod = "am";
        } else if (hrs > 12) {
            hrs %= 12;
            var tod = "pm";
        } else {
            var tod = "am";
        }
    } else {
        var tod = "";
    }

    // get minutes
    var mins = totalMins % 60;
    if (mins < 10) mins = "0" + mins;

    return hrs + ":" + mins + tod;
}

function makeTimeContainer(data){
    // make elements
    var timeContainer = document.createElement("div");
    timeContainer.classList.add("task-time-container");
    var timeText = document.createElement("p");

    // get start time
    var startTime = convertToTime(data.start);

    // get end time
    var endTime = convertToTime(data.end);

    // write text content
    timeText.textContent = startTime + " - " + endTime;
    timeContainer.appendChild(timeText);

    return timeContainer;
}

function makeTaskIndicator(data){
    // type indicator circle
    var circleContainer = document.createElement("svg");
    circleContainer.setAttribute("height", "10");
    circleContainer.setAttribute("width", "10");
    circleContainer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    circleContainer.setAttribute("xmlns:xlink", "http://www.w3.org/2000/svg");
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttributeNS(null, 'r', 3);

    // type indicator text
    var indicatorText = document.createElement("p");
    switch (data.status){
        case "event":
            circle.setAttributeNS(null, "style", "fill: black;");
            indicatorText.textContent = "Event";
            break;
        case "task":
        case "complete":
            switch (data.priority){
                case 0:
                    circle.setAttributeNS(null, "style", "fill: green;");
                    indicatorText.textContent = "Low Priority";
                    break;
                case 1:
                    circle.setAttributeNS(null, "style", "fill: yellow;");
                    indicatorText.textContent = "Medium Priority";
                    break;
                case 2:
                    circle.setAttributeNS(null, "style", "fill: red;");
                    indicatorText.textContent = "High Priority";
                    break;
                default:
                    circle.setAttributeNS(null, "style", "fill: black;");
                    indicatorText.textContent = "Unknown Priority";
            }
            break;
        default:
            circle.setAttributeNS(null, "style", "fill: black;");
            indicatorText.textContent = "Unknown";
    };

    // task length
    var taskLengthTotalMins = data.end - data.start;
    var taskLengthHr = Math.floor(taskLengthTotalMins / 60);
    var taskLengthMin = taskLengthTotalMins % 60;
    var taskLength = "";
    if (taskLengthHr > 0){
        taskLength = taskLengthHr + "hr";
        if (taskLengthMin > 0) taskLength = taskLength + " ";
    }
    if (taskLengthMin > 0){
        taskLength = taskLength + taskLengthMin + "min";
    }
    indicatorText.textContent = indicatorText.textContent + " (" + taskLength + ")";

    circleContainer.appendChild(circle);
    
    return [circleContainer, indicatorText];
}

function makeLocationOrDueText(data){
    var locationOrDueText = document.createElement("p");
    if (data.status == "event"){
        locationOrDueText.textContent = " | " + data.location;
    } else {
        var dueDate = " | Due ";
        var topOfToday = new Date(absToday.getFullYear(), absToday.getMonth(), absToday.getDate());
        var dueDateDate = new Date(data.due.year, data.due.month, data.due.date);
        var timeDiffMS = dueDateDate.getTime() - topOfToday.getTime();
        var timeDiff = Math.floor(timeDiffMS / 1000 / 60 / 60 / 24);
        if (timeDiff < 8 && timeDiff > 1){
            dueDate = dueDate + weekdays[topOfToday.getDay() + timeDiff % 7];
        } else if (timeDiff == 1){
            dueDate = dueDate + "Tomorrow";
        } else if (timeDiff == 0){
            dueDate = dueDate + "Today";
        } else if (timeDiff == -1){
            dueDate = dueDate + "Yesterday";
        } else {
            if (data.due.year == absToday.getFullYear()){
                dueDate = dueDate + months[data.due.month] + " " + data.due.date;
            } else {
                dueDate = dueDate + months[data.due.month] + " " + data.due.date + ", " + data.due.year;
            }
        }
        locationOrDueText.textContent = dueDate;
    }

    return locationOrDueText;
}

async function toggleTaskCompletion(data){
    // toggle value
    switch (data.status){
        case "task":
            data.status = "complete";
            break;
        case "complete":
            data.status = "task";
            break;
        default:
    }

    // post changes
    const userID = localStorage.getItem("userID");
    if (data.date.month == today.getMonth()){
        var monthData = currMonthData;
    } else if ((data.date.year == today.getFullYear() && data.date.month < today.getMonth()) || data.date.year < today.getFullYear()){
        var monthData = prevMonthData;
    } else {
        var monthData = nextMonthData;
    }
    await fetch("/data/" + userID + "/" + data.date.month + "-" + data.date.year + ".json", {
        method: "POST",
        body: JSON.stringify({ date: monthData}) + "\n",
        headers: {"Content-Type": "application/json"}
    }).then(function(res){
        if (res.status != 200){
            alert("Error: could not submit data");
            return;
        }
    });

    // reload elements
    closePopup();
    clearCalendar();
    clearTaskList();
    buildCalendar(today);
    buildTaskList(today);
}

function makeTaskListElement(data, dateIdx, taskIdx){
    var bigContainer = document.createElement("div");
    bigContainer.classList.add("task-list-container");

    // make button
    var container = document.createElement("button");
    container.classList.add("task-list-button");

    // make title text
    var titleText = document.createElement("p");
    titleText.textContent = data.name;
    container.appendChild(titleText);

    // make the time box
    container.appendChild(makeTimeContainer(data));

    // tags
    if (data.tags.length > 0){
        var tagText = document.createElement("p");
        while(!userSettings.tags.includes(data.tags[0])){ 
            data.tags.splice(0, 1);
            if (data.tags.length == 0) break;
        }
        if (data.tags.length > 0){
            tagText.textContent = data.tags[0];
            var toRemove = [];
            for (var i = 1; i < data.tags.length; i++){
                if (userSettings.tags.includes(data.tags[i])){
                    tagText.textContent = tagText.textContent + ", " + data.tags[i];
                } else {
                    toRemove.push(i);
                }
            }
            tagText.textContent = tagText.textContent + " |";
            container.appendChild(tagText);
            for (var i = toRemove.length - 1; i >= 0; i--){
                data.tags.splice(toRemove[i], 1);
            }
        }
    }

    // make task indicator
    var indicator = makeTaskIndicator(data);
    container.appendChild(indicator[0]);
    container.appendChild(indicator[1]);

    // location/due date text
    container.appendChild(makeLocationOrDueText(data));

    // append button to div
    bigContainer.appendChild(container);

    // task button
    if (data.status != "event"){
        container.addEventListener("click", function(){openPopup("edit-task", data, dateIdx, taskIdx)});
        var taskButton = document.createElement("button");
        taskButton.classList.add("task-completion-button");
        taskButton.addEventListener("click", function(){toggleTaskCompletion(data)});

        if (data.status == "task"){
            taskButton.textContent = "Finish Task";
        } else {
            taskButton.textContent = "Reopen Task";
        }
        bigContainer.appendChild(taskButton);
    } else {
        container.addEventListener("click", function(){openPopup("edit-event", data, dateIdx, taskIdx)});
    }

    return bigContainer;
}

function buildTaskList(date){
    // set header text
    var header = document.getElementById("task-list-header");
    var currDay = weekdays[date.getDay()];
    var currDate = date.getDate();
    var headerContent = "";
    switch (currDate){
        case 1: 
        case 21:
        case 31:
            headerContent = currDay + ", " + currDate + "st";
            break;
        case 2: 
        case 22:
            headerContent = currDay + ", " + currDate + "nd";
            break;
        case 3: 
        case 23:
            headerContent = currDay + ", " + currDate + "rd";
            break;
        default:
            headerContent = currDay + ", " + currDate + "th";
    };
    header.textContent = headerContent;

    // make task list
    var container = document.getElementsByClassName("day-list-container")[0];
    var tasksToAdd = [];
    if (currMonthData[currDate - 1]){
        tasksToAdd = currMonthData[currDate - 1];
    }
    for (var i = 0; i < tasksToAdd.length; i++){
        container.appendChild(makeTaskListElement(tasksToAdd[i], currDate - 1, i));
    }
}

function clearTaskList(){
    var container = document.getElementsByClassName("day-list-container")[0];

    while (container.hasChildNodes()){
        container.removeChild(container.firstChild);
    }
}

function refreshSelectedDay(){
    clearTaskList();
    buildTaskList(today);
}

function selectDay(day){
    // unselect other days
    var selected = document.querySelectorAll("*");
    selected.forEach((element) => {
        element.classList.remove("selected");
    });

    // select day
    var dayID = "day-" + day;
    var toSelect = document.getElementById(dayID);
    toSelect.classList.add("selected");

    // change date
    var newDate = dayList[day];
    if (newDate.month < today.getMonth()){
        if (newDate.year == today.getFullYear()){
            movePrevMonth(newDate.date);
        } else {
            moveNextMonth(newDate.date);
        }
    } else if (newDate.month > today.getMonth()){
        if (newDate.year == today.getFullYear()){
            moveNextMonth(newDate.date);
        } else {
            movePrevMonth(newDate.date);
        }
    } else {
        today = new Date(newDate.year, newDate.month, newDate.date);
        refreshSelectedDay();
    }
}

function makeNewCalendarTaskElement(data, relMonth, date, taskIdx){
    // make button
    var container = document.createElement("button");
    container.classList.add("task-button");

    // make the time text
    var timeText = document.createElement("p");
    if (data.status != "event"){
        container.addEventListener("click", function(){openPopup("edit-task", data, date, taskIdx, relMonth)});
        switch (data.priority){
            case 0: 
                timeText.style.color = "green";
                break;
            case 1: 
                timeText.style.color = "yellow";
                break;
            case 2:
                timeText.style.color = "red";
                break;
            default:
                timeText.style.color = "black";
        }
    } else {
        container.addEventListener("click", function(){openPopup("edit-event", data, date, taskIdx, relMonth)});
    }
    timeText.textContent = convertToTime(data.start);
    timeText.style.display = "inline";
    container.appendChild(timeText);

    // make title text
    var titleText = document.createElement("p");
    titleText.style.display = "inline";
    titleText.style.textOverflow = "ellipsis";
    titleText.textContent = " | " + data.name;
    container.appendChild(titleText);

    return container;
}

function createEventDivs(idxDate, currMonth, dayID){
    const idxDateNum = idxDate.getDate() - 1;
    var tasksToAdd = [];
    var taskElements = [];
    var taskMonth = '';
    if (currMonth == idxDate.getMonth()){
        // curr month data
        taskMonth = 'c';
        if (currMonthData[idxDateNum]){
            for (var j = 0; j < currMonthData[idxDateNum].length; j++){
                if (currMonthData[idxDateNum][j].status != "complete"){
                    tasksToAdd.push(currMonthData[idxDateNum][j]);
                }
            }
        }
    } else if (idxDate.getTime() < firstOfCurrMonth.getTime()){
        // prev month data
        taskMonth = 'p';
        if (prevMonthData[idxDateNum]){
            for (var j = 0; j < prevMonthData[idxDateNum].length; j++){
                if (prevMonthData[idxDateNum][j].status != "complete"){
                    tasksToAdd.push(prevMonthData[idxDateNum][j]);
                }
            }
        }
    } else {
        // next month data
        taskMonth = 'n';
        if (nextMonthData[idxDateNum]){
            for (var j = 0; j < nextMonthData[idxDateNum].length; j++){
                if (nextMonthData[idxDateNum][j].status != "complete"){
                    tasksToAdd.push(nextMonthData[idxDateNum][j]);
                }
            }
        }
    }
    if (tasksToAdd.length > 0){
        for (var j = 0; j < 3 && j < tasksToAdd.length; j++){
            taskElements[j] = makeNewCalendarTaskElement(tasksToAdd[j], taskMonth, idxDateNum, j);
        }
        if (tasksToAdd.length > 4){
            // add "show more" element
            var showMore = document.createElement("button");
            showMore.classList.add("task-button");
            showMore.textContent = (tasksToAdd.length - 3) + " More...";
            showMore.addEventListener("click", function(){selectDay(dayID);});
            taskElements[3] = showMore;
        } else if (tasksToAdd.length == 4){
            taskElements[3] = makeNewCalendarTaskElement(tasksToAdd[3], taskMonth, idxDateNum, 3);
        }
    }

    return taskElements;
}

function buildCalendarGrid(date){
    const dayInMs = 1000 * 60 * 60 * 24;

    // get container
    var container = document.getElementById("page-calendar");

    // get start of month
    var currMonth = date.getMonth();
    var currDate = date.getDate();
    firstOfCurrMonth = new Date(date.getFullYear(), currMonth, 1);
    var firstDay = firstOfCurrMonth.getDay();
    var currTime = firstOfCurrMonth.getTime();
    var offsetMS = dayInMs * firstDay;
    var idxDate = new Date(currTime - offsetMS);

    // create days
    dayList = [];
    for (var i = 0; i < 42; i++){
        // create day num
        var dayNum = document.createElement('button');
        var idxMon = idxDate.getMonth();
        if (idxMon == currMonth){
            dayNum.id = "day-num-" + idxDate.getDate();
        } else {
            dayNum.id = "day-num-m" + idxMon + "-" + idxDate.getDate();
            dayNum.classList.add("day-other-month");
        }
        dayNum.classList.add("day-num");
        dayNum.textContent = idxDate.getDate();
        const dayID = i;
        dayNum.addEventListener("click", function(){selectDay(dayID);});

        // create event divs
        var taskElements = createEventDivs(idxDate, currMonth, dayID);

        // create day div 
        var day = document.createElement('div');
        day.classList.add("day-container");
        if (currMonth == absToday.getMonth() && idxDate.getFullYear() == absToday.getFullYear()){
            if (idxDate.getDate() == currDate && idxMon == currMonth){
                day.classList.add("selected")
            }
            if (idxDate.getDate() == absToday.getDate() && idxMon == currMonth){
                day.classList.add("current-day")
            }
        } else {
            if (idxDate.getDate() == currDate && idxMon == currMonth){
                day.classList.add("selected")
            }
        }
        day.id = "day-" + i;

        // append new elements
        day.appendChild(dayNum);
        for (var j = 0; j < taskElements.length; j++){
            day.appendChild(taskElements[j]);
        }
        container.appendChild(day);

        // add to day list
        const dayInfo = {
            year: idxDate.getFullYear(), 
            month: idxDate.getMonth(),
            date: idxDate.getDate(),
        };
        dayList.push(dayInfo);

        // increment day
        var idxTime = idxDate.getTime();
        idxDate = new Date(idxTime + dayInMs);

        // account for daylight saving ending
        const idxHours = idxDate.getHours();
        idxTime = idxDate.getTime();
        if (idxHours == 23){
            idxDate = new Date(idxTime + (dayInMs / 24));
        } else if (idxHours == 1){
            idxDate = new Date(idxTime - (dayInMs / 24));
        }
    }
}

function buildCalendar(date){
    buildCalendarGrid(date);

    // get month lable
    var monthLabel = document.getElementById("month-label");
    monthLabel.textContent = months[date.getMonth()] + " " + date.getFullYear();
}

function clearCalendar(){
    var container = document.getElementById("page-calendar");

    while (container.hasChildNodes()){
        if (container.lastChild.localName == "p") break;
        container.removeChild(container.lastChild);
    }
}

async function movePrevMonth(date){
    if (isNaN(date)){
        var newDate = 1;
    } else {
        var newDate = date;
    }

    // get prev month
    var prevMonth = today.getMonth() - 1;
    if (prevMonth < 0){
        prevMonth = 11;
        var year = today.getFullYear() - 1;
        var prevMonthDate = new Date(year, prevMonth, newDate);
    } else {
        var prevMonthDate = new Date(today.getFullYear(), prevMonth, newDate);
    }

    // get month data
    nextMonthData = currMonthData;
    currMonthData = prevMonthData;
    prevMonthData = await getMonthData(localStorage.getItem("userID"), prevMonthDate.getFullYear(), prevMonthDate.getMonth() - 1);

    // rebuildCalendar
    clearCalendar();
    buildCalendar(prevMonthDate);
    today = prevMonthDate;
    refreshSelectedDay();
}

async function moveNextMonth(date){
    if (isNaN(date)){
        var newDate = 1;
    } else {
        var newDate = date;
    }

    // get prev month
    var nextMonth = today.getMonth() + 1;
    if (nextMonth >= 12){
        nextMonth = 0;
        var year = today.getFullYear() + 1;
        var nextMonthDate = new Date(year, nextMonth, newDate);
    } else {
        var nextMonthDate = new Date(today.getFullYear(), nextMonth, newDate);
    }

    // get month data
    prevMonthData = currMonthData;
    currMonthData = nextMonthData;
    nextMonthData = await getMonthData(localStorage.getItem("userID"), nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1);

    // rebuildCalendar
    clearCalendar();
    buildCalendar(nextMonthDate);
    today = nextMonthDate;
    refreshSelectedDay();
}

function removeErrorTexts(){
    var errorTexts = document.getElementsByClassName("popup-error-text");
    while (errorTexts.length > 0){
        errorTexts[0].remove();
    }
}

function closePopup(){
    // hide all popups
    var wrappers = document.getElementsByClassName("popup-container-wrapper");
    for (var i = 0; i < wrappers.length; i++){
        wrappers[i].classList.add("hidden");
    }

    // clear all inputs
    var inputs = document.querySelectorAll(".popup-input-container input");
    for (var i = 0; i < inputs.length; i++){
        inputs[i].value = "";
    }

    // clear all selectors
    var selectors = document.querySelectorAll(".popup-input-container select");
    for (var i = 0; i < selectors.length; i++){
        selectors[i].value = "";
    }

    // remove task buttons
    var buttons = document.querySelectorAll(".popup-task-completion-button");
    for (var i = 0; i < buttons.length; i++){
        buttons[i].parentNode.removeChild(buttons[i]);
    }
    
    // remove error texts
    removeErrorTexts();
}

function fillEventData(data){
    // name
    var name = document.getElementById("edit-event-name");
    name.value = data.name;

    // date
    var date = document.getElementById("edit-event-date");
    if (data.date.month + 1 < 10){
        var monthNum = "0" + (data.date.month + 1);
    } else {
        var monthNum = (data.date.month + 1);
    }
    if (data.date.date + 1 < 10){
        var dateNum = "0" + (data.date.date + 1);
    } else {
        var dateNum = (data.date.date + 1);
    }
    date.value = data.date.year + "-" + monthNum + "-" + dateNum;

    // start
    var startHr = Math.floor(data.start / 60);
    if (startHr < 10) startHr = "0" + startHr;
    var startMin = data.start % 60;
    if (startMin < 10) startMin = "0" + startMin;
    var start = document.getElementById("edit-event-time-start");
    start.value = startHr + ":" + startMin;

    // end
    var endHr = Math.floor(data.end / 60);
    if (endHr < 10) endHr = "0" + endHr;
    var endMin = data.end % 60;
    if (endMin < 10) endMin = "0" + endMin;
    var end = document.getElementById("edit-event-time-end");
    end.value = endHr + ":" + endMin;

    // tags
    var tags = document.querySelectorAll("#edit-event-tags option");
    for (var i = 0; i < tags.length; i++){
        if (data.tags.includes(tags[i].value)){
            tags[i].selected = true;
        }
    }

    // location
    var location = document.getElementById("edit-event-location");
    location.value = data.location;
}

function fillTaskData(data){
    // name
    var name = document.getElementById("edit-task-name");
    name.value = data.name;

    // date
    var date = document.getElementById("edit-task-date");
    if (data.date.month + 1 < 10){
        var monthNum = "0" + (data.date.month + 1);
    } else {
        var monthNum = (data.date.month + 1);
    }
    if (data.date.date + 1 < 10){
        var dateNum = "0" + (data.date.date + 1);
    } else {
        var dateNum = (data.date.date + 1);
    }
    date.value = data.date.year + "-" + monthNum + "-" + dateNum;

    // start
    var startHr = Math.floor(data.start / 60);
    if (startHr < 10) startHr = "0" + startHr;
    var startMin = data.start % 60;
    if (startMin < 10) startMin = "0" + startMin;
    var start = document.getElementById("edit-task-time-start");
    start.value = startHr + ":" + startMin;

    // end
    var endHr = Math.floor(data.end / 60);
    if (endHr < 10) endHr = "0" + endHr;
    var endMin = data.end % 60;
    if (endMin < 10) endMin = "0" + endMin;
    var end = document.getElementById("edit-task-time-end");
    end.value = endHr + ":" + endMin;

    // due date
    var dueDate = document.getElementById("edit-task-due-date");
    if (data.due.month + 1 < 10){
        var dueMonthNum = "0" + (data.due.month + 1);
    } else {
        var dueMonthNum = (data.due.month + 1);
    }
    if (data.due.date + 1 < 10){
        var dueDateNum = "0" + (data.due.date + 1);
    } else {
        var dueDateNum = (data.due.date + 1);
    }
    dueDate.value = data.due.year + "-" + dueMonthNum + "-" + dueDateNum;


    // tags
    var tags = document.querySelectorAll("#edit-task-tags option");
    for (var i = 0; i < tags.length; i++){
        if (data.tags.includes(tags[i].value)){
            tags[i].selected = true;
        }
    }

    // priority
    var priority = document.getElementById("edit-task-priority");
    priority.children[data.priority].selected = true;
}

function openPopup(popupName, data, date, idx, relMonth){
    // make popup visable
    var container = document.getElementById(popupName + "-popup-container");
    container.classList.remove("hidden");

    var inputContainer = container.querySelector(".popup-input-container");
    var taskButton = document.createElement("button");
    taskButton.classList.add("popup-task-completion-button");
    taskButton.addEventListener("click", function(){toggleTaskCompletion(data)});

    popupSelectedIdx = {date: date, idx: idx, month: relMonth};

    // fill with data
    if (data){
        switch (data.status){
            case "event":
                fillEventData(data);
                break;
            case "task":
                fillTaskData(data);
                taskButton.textContent = "Finish Task";
                inputContainer.appendChild(taskButton);
                break;
            case "complete":
                fillTaskData(data);
                taskButton.textContent = "Reopen Task";
                inputContainer.appendChild(taskButton);
                break;
            default:
        }
    }
}

function makeErrorMessage(element, message){
    const errorMessage = document.createElement("p");
    errorMessage.classList.add("popup-error-text");
    errorMessage.textContent = message;
    element.parentNode.insertBefore(errorMessage, element);
}

function getEventPopupData(containerAction){
    var failed = false;
    var data = {
        name: "",
        status: "event",
        date: {
            year: "",
            month: "",
            date: "",
        },
        start: "",
        end: "",
        tags: [],
        location: "",
    };

    // name
    var nameElement = document.getElementById(containerAction + "-event-name");
    data.name = nameElement.value;
    if (!data.name || data.name == ""){
        makeErrorMessage(nameElement, "Must add a name");
        failed = true;
    }

    // date
    var dateElement = document.getElementById(containerAction + "-event-date");
    var dateString = dateElement.value;
    if (!dateString || dateString == ""){
        makeErrorMessage(dateElement, "Must add a date.");
        failed = true;
    } else {
        var dateData = dateString.split('-');
        data.date.year = dateData[0];
        data.date.month = dateData[1] - 1;
        data.date.date = dateData[2] - 1;
    }

    // start
    var startElement = document.getElementById(containerAction + "-event-time-start");
    var startString = startElement.value;
    if (!startString || startString == ""){
        makeErrorMessage(startElement, "Must enter a start time.");
        failed = true;
    } else {
        var startData = startString.split(':');
        data.start = startData[0] * 60;
        data.start += startData[1] * 1;
    }

    // end
    var endElement = document.getElementById(containerAction + "-event-time-end");
    var endString = endElement.value;
    if (!endString || endString == ""){
        makeErrorMessage(startElement, "Must enter an end time.");
        failed = true;
    } else {
        var endData = endString.split(':');
        data.end = endData[0] * 60;
        data.end += endData[1] * 1;
    }

    // start-end error checking
    if (data.end < data.start){
        makeErrorMessage(startElement, "End time must be after the start time.");
        failed = true;
    }

    // tags
    var tagElement = document.getElementById(containerAction + "-event-tags");
    for (var i = 0; i < tagElement.selectedOptions.length; i++){
        data.tags.push(tagElement.selectedOptions[i].value);
    }

    // location
    var locationElement = document.getElementById(containerAction + "-event-location");
    data.location = locationElement.value;
    if (!data.location){
        data.location = "";
    }

    if (failed){
        return undefined;
    }
    return data;
}

function checkEventOverlap(date, start, length){
    var eventData = [];
    var nextYear =  today.getFullYear();
    var nextMonth = today.getMonth() + 1;
    if (nextMonth >= 12){
        nextYear++;
        nextMonth = 0;
    }

    if (date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth()){
        eventData = currMonthData;
    } else if (date.getFullYear() == nextYear && date.getMonth() == nextMonth) {
        eventData = nextMonthData;
    } else {
        return undefined;
    }

    const dateNum = date.getDate();
    if (!eventData[dateNum]) return true;
    for (var i = 0; i < eventData[dateNum].length; i++){
        if ((eventData[dateNum][i].start <= start && eventData[dateNum][i].end > start) ||
                (eventData[dateNum][i].start >= start && eventData[dateNum][i].start < (start + length))){
            return false;
        }
    }

    return true;
}

function checkTimeslotDay(day, length){
    var timeslot = {
        start: 0,
        status: true,
    };
    const dayInMin = 60 * 24;

    // no entry
    if (!day) return timeslot;
    if (day.length == 0) return timeslot;

    // check for open slot
    if (day[0].start == null && day[0].end == null){
        timeslot.status = false;
        return timeslot;
    }

    for (var i = 0; i < day.length; i++){
        if (((i+1) == day.length && day[i].end == null) ||
                ((day[i].end + length) >= dayInMin)) {
            timeslot.status = false;
            return timeslot;
        } else if (((i+1) < day.length && (day[i].end + length) > day[i+1].start) ||
                (i == 0 && day[i].start != null && length > day[i].start)){
            continue;
        } else {
            timeslot.start = day[i].end;
            return timeslot;
        }
    }
}

function calulateTaskPosition(data, length, canUseUnavailable){
    var idx = new Date(absToday.getFullYear(), absToday.getMonth(), absToday.getDate());
    const dueDate = new Date(data.due.year, data.due.month, data.due.date + 1);
    const dayInMs = 1000 * 60 * 60 * 24;

    // loop for each level of acceptance
    for (var i = 3; i >= 0; i--){
        if (i == 0 && !canUseUnavailable) break;

        // loop for each day till due date
        while ((dueDate.getTime() + (dayInMs - 1)) >= idx.getTime()){
            const day = idx.getDay();
            var timeslot = {
                start: 0,
                status: true,
            };

            // check timeslots
            if (i > 0 && !canUseUnavailable){
                timeslot = checkTimeslotDay(userSettings.timeslots[0][day], Number(length));
            }

            // check events
            if (timeslot.status){
                var res = checkEventOverlap(idx, timeslot.start, length);
                if (res == undefined){
                    alert("Calculating unloaded month, please choose due date closer to selected day on calendar.");
                    return false;
                } else if (res == false){
                }
            }

            // correct found
            if (timeslot.status){
                data.date.year = idx.getFullYear();
                data.date.month = idx.getMonth();
                data.date.date = idx.getDate() - 1;
                data.start = timeslot.start;
                data.end = timeslot.start + length;
                return true;
            }

            // increment day
            var incTime = idx.getTime();
            idx = new Date(incTime + dayInMs);

            // account for daylight savings
            const idxHours = idx.getHours();
            incTime = idx.getTime();
            if (idxHours == 23){
                idx = new Date(incTime + (dayInMs / 24));
            } else if (idxHours == 1){
                idx = new Date(incTime - (dayInMs / 24));
            }
        }
    }

    return false;
}

function getTaskPopupData(containerAction, type){
    var failed = false;
    var data = {
        name: "",
        status: type,
        date: {
            year: "",
            month: "",
            date: "",
        },
        start: "",
        end: "",
        due: {
            year: "",
            month: "",
            date: "",
        },
        tags: [],
        priority: "",
    };

    // name
    var nameElement = document.getElementById(containerAction + "-task-name");
    data.name = nameElement.value;
    if (!data.name || data.name == ""){
        makeErrorMessage(nameElement, "Must add a name");
        failed = true;
    }

    // length
    var lengthElement = document.getElementById(containerAction + "-task-length");
    const length = lengthElement.value;
    if (length <= 0){
        makeErrorMessage(lengthElement, "Length must be greater than 0.");
        failed = true;
    }

    // due date
    var dueDateElement = document.getElementById(containerAction + "-task-due-date");
    var dueDateString = dueDateElement.value;
    if (!dueDateString || dueDateString == ""){
        makeErrorMessage(dueDateElement, "Must add a due date.");
        failed = true;
    } else {
        var dueDateData = dueDateString.split('-');
        data.due.year = dueDateData[0];
        data.due.month = dueDateData[1] - 1;
        data.due.date = dueDateData[2] - 1;
    }

    // tags
    var tagElement = document.getElementById(containerAction + "-task-tags");
    for (var i = 0; i < tagElement.selectedOptions.length; i++){
        data.tags.push(tagElement.selectedOptions[i].value);
    }

    // priority
    var priotityElement = document.getElementById(containerAction + "-task-priority");
    var priorityString = priotityElement.value;
    switch (priorityString){
        case "Low":
            data.priority = 0;
            break;
        case "Medium":
            data.priority = 1;
            break;
        case "High":
            data.priority = 2;
            break;
        default:
            makeErrorMessage(priotityElement, "Must set a priority for the task");
            failed = true;
    }
        
    if (containerAction == "edit"){
        // date
        var dateElement = document.getElementById(containerAction + "-task-date");
        var dateString = dateElement.value;
        if (!dateString || dateString == ""){
            makeErrorMessage(dateElement, "Must add a date.");
            failed = true;
        } else {
            var dateData = dateString.split('-');
            data.date.year = dateData[0];
            data.date.month = dateData[1] - 1;
            data.date.date = dateData[2] - 1;
        }

        // start
        var startElement = document.getElementById(containerAction + "-task-time-start");
        var startString = startElement.value;
        if (!startString || startString == ""){
            makeErrorMessage(startElement, "Must enter a start time.");
            failed = true;
        } else {
            var startData = startString.split(':');
            data.start = startData[0] * 60;
            data.start += startData[1] * 1;
        }

        // end
        var endElement = document.getElementById(containerAction + "-task-time-end");
        var endString = endElement.value;
        if (!endString || endString == ""){
            makeErrorMessage(startElement, "Must enter an end time.");
            failed = true;
        } else {
            var endData = endString.split(':');
            data.end = endData[0] * 60;
            data.end += endData[1] * 1;
        }

        // start-end error checking
        if (data.end < data.start){
            makeErrorMessage(startElement, "End time must be after the start time.");
            failed = true;
        }
    } else if (!failed) {
        // set position & time
        if (!calulateTaskPosition(data, length, false)){ 
            if (confirm("Could not find position for task.\nWould you like to include blocked timeslots in the selection?")){
                if (!calulateTaskPosition(data, length, true)){
                    alert("Could not find position for task.");
                    failed = true;
                }
            } else {
                failed = true;
            }
        }
    }

    if (failed){
        return undefined;
    }
    return data;
}

async function submitData(submitType){
    removeErrorTexts();

    // get data
    if (submitType.type == "event"){
        var data = getEventPopupData(submitType.action);
        if (!data) return;
    } else if (submitType.type == "task" || submitType.type == "complete") {
        var data = getTaskPopupData(submitType.action, submitType.type);
        if (!data) return;
    }

    // remove old entry
    if (submitType.action == "edit"){
        removeEntry(1);
    }

    var dataYear = data.date.year;
    var dataMonth = data.date.month;
    var dataDate = data.date.date;

    // get month data from server
    const userID = localStorage.getItem("userID");
    var monthData = await getMonthData(userID, dataYear, dataMonth);

    // insert data into month data
    if (monthData.length <= dataDate){
        for (var i = monthData.length; i < dataDate; i++){
            monthData.push([]);
        }
        monthData.push([data]);
    } else {
        var inserted = false;
        for (var i = 0; i < monthData[dataDate].length; i++){
            if (monthData[dataDate][i].start > data.start && monthData[dataDate][i].end > data.end){
                monthData[dataDate].splice(i, 0, data);
                inserted = true;
                break;
            }
        }
        if (!inserted) monthData[dataDate].push(data);
    }

    // post to server
    await fetch("/data/" + userID + "/" + dataMonth + "-" + dataYear + ".json", {
        method: "POST",
        body: JSON.stringify({ date: monthData}) + "\n",
        headers: {"Content-Type": "application/json"}
    }).then(function(res){
        if (res.status != 200){
            alert("Error: could not submit data");
            return;
        }
    });

    // rebuild calendar
    await getUserData(today);
    clearTaskList();
    clearCalendar();
    buildCalendar(today);
    buildTaskList(today);

    // close popup after submit
    closePopup();
}

async function removeEntry(editing){
    if (isNaN(editing)){
        var alertMessage = "Error in deleting item.";
    } else {
        var alertMessage = "Error updating item.";
    }

    if (!popupSelectedIdx){
        alert(alertMessage);
        return;
    }

    // get data
    switch (popupSelectedIdx.month){
        case "c":
            var data = currMonthData;
            break;
        case "p":
            var data = prevMonthData;
            break;
        case "n":
            var data = nextMonthData;
            break;
        default:
            alert(alertMessage);
            return;
    }
    if (!data[popupSelectedIdx.date] || data[popupSelectedIdx.date] == [] || !data[popupSelectedIdx.date][popupSelectedIdx.idx]){
        alert(alertMessage);
        return;
    }

    // confirmation message
    if (data[popupSelectedIdx.date][popupSelectedIdx.idx].status == "event"){
        var type = "event";
    } else {
        var type = "task";
    }
    if (isNaN(editing)){
        if(!confirm("Are you sure you want to delete this " + type + "?")) return;
    }

    // remove from list
    const dataYear = data[popupSelectedIdx.date][popupSelectedIdx.idx].date.year;
    const dataMonth = data[popupSelectedIdx.date][popupSelectedIdx.idx].date.month;
    data[popupSelectedIdx.date].splice(popupSelectedIdx.idx, 1);

    // post to server
    const userID = localStorage.getItem("userID");
    await fetch("/data/" + userID + "/" + dataMonth + "-" + dataYear + ".json", {
        method: "POST",
        body: JSON.stringify({ date: data}) + "\n",
        headers: {"Content-Type": "application/json"}
    }).then(function(res){
        if (res.status != 200){
            alert("Error: could not submit data");
            return;
        }
    });


    if (isNaN(editing)){
        // rebuild calendar
        await getUserData(today);
        clearTaskList();
        clearCalendar();
        buildCalendar(today);
        buildTaskList(today);


        // close popup after delete
        closePopup();
    }
}

async function getMonthData(userID, year, month){
    const response = await fetch("/data/" + userID + "/" + month + "-" + year + ".json");
    if (response.ok && response.status == 200){
        var data = await response.json();
        return data.date;
    } else {
        return [];
    }
}

async function getUserData(date){
    // get user ID
    const userID = localStorage.getItem("userID");

    // get current month
    const currYear = date.getFullYear();
    const currMonth = date.getMonth();
    currMonthData = await getMonthData(userID, currYear, currMonth)

    // get previous month
    var prevYear = currYear;
    var prevMonth = currMonth - 1;
    if (prevMonth < 0){
        prevYear--;
        prevMonth = 11;
    }
    prevMonthData = await getMonthData(userID, prevYear, prevMonth);
    
    // get next month
    var nextYear = currYear;
    var nextMonth = currMonth + 1;
    if (nextMonth >= 12){
        nextYear++;
        nextMonth = 0;
    }
    nextMonthData = await getMonthData(userID, nextYear, nextMonth);
}

function addTags(){
    var tagSelects = document.getElementsByClassName("tag-select");
    for (var i = 0; i < tagSelects.length; i++){
        for (var j = 0; j < userSettings.tags.length; j++){
            var newOption = document.createElement("option");
            newOption.value = userSettings.tags[j];
            newOption.textContent = userSettings.tags[j];
            tagSelects[i].appendChild(newOption);
        }
    }
}

async function init(){
    await getUserData(today);
    await getUserSettings();
    addTags();
    buildCalendar(today);
    buildTaskList(today);
}

// start of program
init();

// button listeners
var prevMonth = document.getElementById("nav-calendar-back");
var nextMonth = document.getElementById("nav-calendar-forward");
var closeButtons = document.getElementsByClassName("close-button");
var cancelButtons = document.getElementsByClassName("popup-cancel-button");

prevMonth.addEventListener("click", movePrevMonth);
nextMonth.addEventListener("click", moveNextMonth);
for (var i = 0; i < closeButtons.length; i++){
    closeButtons[i].addEventListener("click", closePopup);
}
for (var i = 0; i < cancelButtons.length; i++){
    cancelButtons[i].addEventListener("click", closePopup);
}
