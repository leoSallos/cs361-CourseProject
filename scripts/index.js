// date global data
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var dayList = [];
var today = new Date();
const absToday = new Date();

// user data
var prevMonthData = [];
var currMonthData = [];
var nextMonthData = [];

// testing data
const testEventData = {
    name: "test",
    status: "event",
    start: 480,
    end: 590,
    tags: ["testing", "Event to Test"],
    location: "Dearborn Hall",
};
const testTaskData = {
    name: "test",
    status: "task",
    start: 660,
    end: 690,
    tags: ["testing"],
    priority: 1,
    due: {
        year: 2025,
        month: 9,
        day: 20,
    },
};
const testCompleteData = {
    name: "testComp",
    status: "complete",
    start: 660,
    end: 720,
    tags: ["testing"],
    priority: 2,
    due: {
        year: 2025,
        month: 9,
        day: 19,
    },
};
currMonthData[16] = [testEventData, testTaskData];
currMonthData[15] = [testCompleteData];

function convert12hr(hour){
    if (hour < 12 && hour > 1){
        var tod = "am";
    } else if (hour > 12) {
        hour -= 12;
        var tod = "pm";
    } else {
        hour = 12;
        var tod = "am";
    }

    return {hour: hour, tod: tod,};
}

function makeTaskListElement(data, date){
    // make button
    var container = document.createElement("button");
    container.classList.add("task-list-button");
    container.addEventListener("click", function(){})

    // make title text
    var titleText = document.createElement("p");
    titleText.textContent = data.name;
    container.appendChild(titleText);

    // make the time box
    var timeContainer = document.createElement("div");
    timeContainer.classList.add("task-time-container");
    var timeText = document.createElement("p");
    var startHour = convert12hr(Math.floor(data.start / 60));
    var startMin = data.start % 60;
    var endHour = convert12hr(Math.floor(data.end / 60));
    var endMin = data.end % 60;
    if (startMin < 10) startMin = "0" + startMin;
    if (endMin < 10) endMin = "0" + endMin;
    timeText.textContent = startHour.hour + ":" + startMin + startHour.tod +
        " - " + endHour.hour + ":" + endMin + endHour.tod;
    timeContainer.appendChild(timeText);
    container.appendChild(timeContainer);

    // tags
    if (data.tags.length > 0){
        var tagText = document.createElement("p");
        tagText.textContent = data.tags[0];
        for (var i = 1; i < data.tags.length; i++){
            tagText.textContent = tagText.textContent + ", " + data.tags[i];
        }
        tagText.textContent = tagText.textContent + " |";
        container.appendChild(tagText);
    }

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
        taskLength = taskLengthHr + "hr ";
    }
    taskLength = taskLength + taskLengthMin + "min";
    indicatorText.textContent = indicatorText.textContent + " (" + taskLength + ") |";

    circleContainer.appendChild(circle);
    container.appendChild(circleContainer);
    container.appendChild(indicatorText);

    // location/due date text
    var locationOrDueText = document.createElement("p");
    if (data.status == "event"){
        locationOrDueText.textContent = data.location;
    } else {
        var dueDate = "Due ";
        var dueDateDate = new Date(data.due.year, data.due.month, data.due.day);
        var timeDiffMS = absToday.getTime() - dueDateDate.getTime();
        var timeDiff = Math.floor(timeDiffMS / 1000 / 60 / 60 / 24);
        if (timeDiff < 8 && timeDiff > 0){
            dueDate = dueDate + weekdays[timeDiff];
        } else if (timeDiff == 0){
            dueDate = dueDate + "Today";
        } else {
            if (data.due.year == absToday.getFullYear()){
                dueDate = dueDate + months[data.due.month] + " " + data.due.day;
            } else {
                dueDate = dueDate + months[data.due.month] + " " + data.due.day + ", " + data.due.year;
            }
        }
        locationOrDueText.textContent = dueDate;
    }
    container.appendChild(locationOrDueText);

    // task button
    var taskButton = document.createElement("button");
    taskButton.classList.add("task-completion-button");
    container.addEventListener("click", function(){});

    return container;
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
    for (var i = 0; i < 3 && i < tasksToAdd.length; i++){
        container.appendChild(makeTaskListElement(tasksToAdd[i], currDate - 1));
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

function makeNewCalendarTaskElement(data, relMonth, date){
    // make button
    var container = document.createElement("button");
    container.classList.add("task-button");
    container.addEventListener("click", function(){})

    // make the time text
    var timeText = document.createElement("p");
    if (data.status != "event"){
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
    }
    var hour = Math.floor(data.start / 60);
    if (hour < 12 && hour > 1){
        var tod = "a";
    } else if (hour > 12) {
        hour -= 12;
        var tod = "p";
    } else {
        hour = 12;
        var tod = "a";
    }
    var min = data.start % 60;
    if (min < 10) min = "0" + min;
    timeText.textContent = hour + ":" + min + tod;
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

function buildCalendarGrid(date){
    // get container
    var container = document.getElementById("page-calendar");

    // get start of month
    var currMonth = date.getMonth();
    var currDate = date.getDate();
    firstOfCurrMonth = new Date(date.getFullYear(), currMonth, 1);
    var firstDay = firstOfCurrMonth.getDay();
    var currTime = firstOfCurrMonth.getTime();
    var offsetMS = (1000 * 60 * 60 * 24) * firstDay;
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
        const idxDateNum = idxDate.getDate() - 1;
        var tasksToAdd = [];
        var taskElements = [];
        var taskMonth = '';
        if (currMonth == idxMon){
            // curr month data
            taskMonth = 'c';
            if (currMonthData[idxDateNum]){
                tasksToAdd = currMonthData[idxDateNum]
            }
        } else if (idxDate.getTime() < firstOfCurrMonth.getTime()){
            // prev month data
            taskMonth = 'p';
            if (prevMonthData[idxDateNum]){
                tasksToAdd = prevMonthData[idxDateNum]
            }
        } else {
            // next month data
            taskMonth = 'n';
            if (nextMonthData[idxDateNum]){
                tasksToAdd = nextMonthData[idxDateNum]
            }
        }
        if (tasksToAdd.length > 0){
            for (var j = 0; j < 3 && j < tasksToAdd.length; j++){
                taskElements[j] = makeNewCalendarTaskElement(tasksToAdd[j], taskMonth, idxDateNum);
            }
            if (tasksToAdd.length > 4){
                // add "show more" element
            } else if (tasksToAdd.length == 4){
                taskElements[3] = makeNewCalendarTaskElement(tasksToAdd[3], taskMonth, 3);
            }
        }

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
        idxDate = new Date(idxTime + (1000 * 60 * 60 * 24));
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

function movePrevMonth(date){
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

    // rebuildCalendar
    clearCalendar();
    buildCalendar(prevMonthDate);
    today = prevMonthDate;
    refreshSelectedDay();
}

function moveNextMonth(date){
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

    // rebuildCalendar
    clearCalendar();
    buildCalendar(nextMonthDate);
    today = nextMonthDate;
    refreshSelectedDay();
}

function init(){
    buildCalendar(today);
    buildTaskList(today);
}

// start of program
init();

// button listeners
var prevMonth = document.getElementById("nav-calendar-back");
var nextMonth = document.getElementById("nav-calendar-forward");

prevMonth.addEventListener("click", movePrevMonth);
nextMonth.addEventListener("click", moveNextMonth);
