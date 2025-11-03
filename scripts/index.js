var userSettings = {
    tags: [],
    timeslots: [
        [],
        [],
        [],
    ],
    clock: "",
    theme: "",
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
        body.classList.remove("light");
        body.classList.remove("dark");
        body.classList.remove("high-contrast");
        body.classList.add(userSettings.theme);
    }
}

localStorage.setItem("userID", "00000000");
