var userSettings = {
    tags: [],
    timeSlots: {
        unavailable: [],
        notPreferable: [],
        flexable: [],
    },
    clock: "",
    weekStart: "",
    theme: "",
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
    }
}
