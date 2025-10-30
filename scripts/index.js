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
}

function refreshSelectedDay(){
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
    if (date){
        var newDate = date;
    } else {
        var newDate = 0;
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
    if (date){
        var newDate = date;
    } else {
        var newDate = 0;
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
