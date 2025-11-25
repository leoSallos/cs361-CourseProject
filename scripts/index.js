var userSettings = {
    tags: [],
    timeslots: [
        [],
        [],
        [],
    ],
    clock: "",
    theme: "",
    onlineStatusID: "",
}

//
// User Settings
//

async function postUserSettings(){
    const userID = localStorage.getItem("userID");
    await fetch("/data/" + userID + "/settings.json", {
        method: "POST",
        body: JSON.stringify(userSettings) + "\n",
        headers: {"Content-Type": "application/json"}
    }).then(function(res){
        if (res.status != 200){
            alert("Error: could not update setting");
            return;
        }
    });
}

async function getUserSettings(){
    const userID = localStorage.getItem("userID");
    const response = await fetch("/data/" + userID + "/settings.json");
    if (response.ok && response.status == 200){
        var data = await response.json();
    } else {
        var data = undefined;
        alert("Could not retrieve user data.");
    }

    if (data){
        userSettings = data;
        // set theme
        var body = document.querySelector("body");
        if (!body) return;
        body.classList.remove("light");
        body.classList.remove("dark");
        body.classList.remove("high-contrast");
        body.classList.add(userSettings.theme);
    }
}

//
// Online Status Connetion
//

async function getOnlineStatusID(){
    const res = await fetch("http://localhost:8007/new", {
        method: "POST",
        body: JSON.stringify({name: localStorage.getItem("userID")}),
        headers: {
            "Content-Type": 'application/json; charset=UTF-8'
        }
    });

    if (res.ok){
        const onlineID = await res.json()
        userSettings.onlineStatusID = onlineID.id;
    }

    await postUserSettings();
}

async function markOnline(){
    // check if no user id
    if (userSettings.onlineStatusID === ""){ 
        await getOnlineStatusID();
        return;
    }

    // tell server to mark online
    const res = await fetch("http://localhost:8007/online/" + userSettings.onlineStatusID);

    // get new user id
    if (res.status == 404){ 
        await getOnlineStatusID();
    }
}

//
// Header Drawers
//

function hideDrawers(){
    var drawers = document.getElementsByClassName("header-list-container");

    for (var i = 0; i < drawers.length; i++){
        drawers[i].classList.add("hidden");
    }
}

function clearDrawer(container){
    while (container.lastChild && container.lastChild.tagName != "BUTTON"){
        container.removeChild(container.lastChild);
    }
}

// account drawer
function accountDrawer(){
    var container = document.getElementById("account-list-container");

    const open = container.classList.contains("hidden");
    hideDrawers();

    if (open){
        container.classList.remove("hidden");
    }
}

function signOut(){
    localStorage.removeItem("userID");
    window.location.replace("/login.html");
}

// users status drawer
async function updateUsersDrawer(container){
    clearDrawer(container);

    // get users list
    const res = await fetch("http://localhost:8007/list");
    const usersObj = await res.json();
    const users = usersObj.users;

    // create list
    if (users){
        for (var i = 0; i < users.length; i++){
            var userContainer = document.createElement("div");
            userContainer.classList.add("users-list-element");

            var nameText = document.createElement("p");
            nameText.textContent = users[i].name;
            userContainer.appendChild(nameText);

            var statusText = document.createElement("p");
            statusText.textContent = users[i].status;
            userContainer.appendChild(statusText);

            container.appendChild(userContainer);
        }
    } else {
        var emptyText = document.createElement("p");
        emptyText.textContent = "No users found.";
    }
}

function usersDrawer(){
    var container = document.getElementById("users-list-container");
    const open = container.classList.contains("hidden");

    hideDrawers();

    if (open){
        // update drawer
        updateUsersDrawer(container);

        // open drawer
        container.classList.remove("hidden");
    }
}

// notifications drawer
async function updateNotificationsDrawer(container){
}

function notificationsDrawer(){
    var container = document.getElementById("notifications-list-container");
    const open = container.classList.contains("hidden");

    hideDrawers();

    if (open){
        // update drawer
        updateNotificationsDrawer(container);

        // open drawer
        container.classList.remove("hidden");
    }
}

//
// Initialization and Global Logic
//

async function init(){
    // check if logged in
    if (!localStorage.getItem("userID")){
        window.location.replace("/login.html");
        return;
    }

    // get user data
    await getUserSettings();

    // mark as newly online
    await markOnline();
}

init();

// 1 min timer for online status
const oneMin = 1000 * 60;
const interval = setInterval(() => {
    markOnline();
}, oneMin);
