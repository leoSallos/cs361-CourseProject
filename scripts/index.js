const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function buildCalendarGrid(date){
    // get container
    var container = document.getElementById("page-calendar");

    // get start of month
    var currMonth = date.getMonth();
    console.log(currMonth);
    firstOfCurrMonth = new Date(date.getFullYear(), currMonth, 1);
    var firstDay = firstOfCurrMonth.getDay();
    var currTime = firstOfCurrMonth.getTime();
    var offsetMS = (1000 * 60 * 60 * 24) * firstDay;
    var idxDate = new Date(currTime - offsetMS);
    console.log(idxDate);

    // create days
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

        // create day div
        var day = document.createElement('div');
        day.classList.add("day-container");
        day.id = "day-" + i;

        // append new elements
        day.appendChild(dayNum);
        container.appendChild(day);

        // increment day
        var idxTime = idxDate.getTime();
        idxDate = new Date(idxTime + (1000 * 60 * 60 * 24));
    }
}

function buildCalendar(date){

    buildCalendarGrid(date);
}

function init(){
    // get date
    var today = new Date();

    // get month lable
    var monthLabel = document.getElementById("month-label");
    monthLabel.textContent = months[today.getMonth()] + " " + today.getFullYear();

    buildCalendar(today);
}

// start of program
init();
