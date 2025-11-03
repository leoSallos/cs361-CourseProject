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

function insertTimeslots(){
}

function insertUserData(){
    clearTags();
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
