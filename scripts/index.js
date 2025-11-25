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

function promptSignOut(){
    var signOutButton = document.getElementById("sign-out-button");

    signOutButton.classList.toggle("hidden");
}

function signOut(){
    localStorage.removeItem("userID");
    window.location.replace("/login.html");
}

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

function usersDrawer(){
}

function notificationsDrawer(){
}

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
