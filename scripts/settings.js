function insertTags(){
    var tagSelect = document.getElementById("settings-tag-select");
    for (var i = 0; i < userSettings.tags.length; i++){
        var newOption = document.createElement("option");
        newOption.value = userSettings.tags[i];
        newOption.textContent = userSettings.tags[i];
        tagSelect.appendChild(newOption);
    }
}

function insertTimeslots(){
}

function insertUserData(){
    insertTags();
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
