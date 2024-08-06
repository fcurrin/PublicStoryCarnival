//'use strict';

//let checked = false;
let counter = 0;
let savedText = [];
let uniqueText = new Set();
let i = 0;

function saveInit() {
    $.get("/savedText", function(texts) {
        savedText = shuffle(texts);
        let savedTextElems = "";
        savedText.forEach(function(elem){
            i += 1;
            savedTextElems += `<div class="input-group mb-3">
        <div class="input-group-prepend">
            <div class="input-group-text">
            <input type="checkbox" id="deleteCheckbox${i}" aria-label="Checkbox for following text input">
            </div>
        </div>
        <input type="text" class="form-control" id="deleteText${i}" value="${elem}" aria-label="Text input with checkbox">
        </div>`;
        });
        $("#deleteSavedTextModal").find(".modal-body").html(savedTextElems);
    });


    var saveText = document.getElementById("saveText");

    saveText.addEventListener("change", function() {
        checked = saveText.checked;
        $.post("/allowSavedText", {toggle:checked})
    });

    //Adds the saved text to the input box
    var addText = document.getElementById("addText");
    //Submit button
    var submit = document.getElementById('submit');
    //Opens Modal
    var modalBtn = document.getElementById('modalBtn');
    //Closes Modal
    var saveButton = document.getElementById('saveButton');

    // Commenting out listener and instead calling addToModal from wizardSpeak() in agentcontrol.js to more easily log just user created text
    submit.addEventListener("click", function() {
        if (checked && !tookSuggestion) {
            addToModal();
        }
    })

    modalBtn.addEventListener("click", function() {
        $("#saveTextModal").modal('show');
    })
}
//When users exit the modal, it saves the text that was kept and adds it to the users lists of saved text.
function saveText(){
    let keptElements = []
    // Get the ids for the text inputs that match each checked checkbox
    var idSelector = function() { let matches = this.id.match(/(\d+)/); if(matches){return "displayText"+matches[0];} };
    var clickedElements = $(":checkbox:checked").map(idSelector).get();
    clickedElements.forEach(function(elem) {
        let id = '#'+elem;
        let val = $(id).val();
        // only add if value is unique (don't save text that has been saved previously)
        if (new Set(savedText).size !== new Set(savedText).add(val).size){
            savedText.push(val);
            keptElements.push(val);
        }
        // Update list of items to potentially save for next time the modal displays
        $(id).closest(".input-group").remove();    
    });
    $.post('/record-saved-text', {SavedText:JSON.stringify(keptElements)})
    $('#saveTextModal').modal('hide');

    
    counter = 0;
    let savedTextElems = "";
    savedText.forEach(function(elem){
        i += 1;
        savedTextElems += `<div class="input-group mb-3">
    <div class="input-group-prepend">
        <div class="input-group-text">
        <input type="checkbox" id="deleteCheckbox${i}" aria-label="Checkbox for following text input">
        </div>
    </div>
    <input type="text" class="form-control" id="deleteText${i}" value="${elem}" aria-label="Text input with checkbox">
    </div>`;
    });
    $("#deleteSavedTextModal").find(".modal-body").html(savedTextElems);
}

function deleteText(){
    let toRemove = [];
    // Get the ids for the text inputs that match each checked checkbox
    var idSelector = function() { let matches = this.id.match(/(\d+)/); if(matches){return "deleteText"+matches[0];} };
    var clickedElements = $(":checkbox:checked").map(idSelector).get();
    clickedElements.forEach(function(elem) {
        let id = '#'+elem;
        let val = $(id).val();
        toRemove.push(val);
    });
    let checkVal = function(item){
        return !toRemove.includes(item);
    };
    savedText = savedText.filter(checkVal);
    $.post('/replace-saved-text', {SavedText:JSON.stringify(savedText)})
    $('#deleteSavedTextModal').modal('hide');

    // Update list of items to potentially delete for next time the modal displays:
    i = 0;
    let savedTextElems = "";
    savedText.forEach(function(elem){
        i += 1;
        savedTextElems += `<div class="input-group mb-3">
    <div class="input-group-prepend">
        <div class="input-group-text">
        <input type="checkbox" id="deleteCheckbox${i}" aria-label="Checkbox for following text input">
        </div>
    </div>
    <input type="text" class="form-control" id="deleteText${i}" value="${elem}" aria-label="Text input with checkbox">
    </div>`;
    });
    $("#deleteSavedTextModal").find(".modal-body").html(savedTextElems);
}

// saved text is shuffled at the start of each session, so order stays consistent within a session
function randomSavedText() {
    if(savedText.length > 0){
            //document.getElementById("text").value = savedText[Math.floor(Math.random() * savedText.length)]
            let temp = savedText.shift();
            document.getElementById("text").value = temp;
            savedText.push(temp);

    } else {
        alert("You have no saved texts!");
    }
}

async function addToModal() {
    var input = document.getElementById("text");
    var text = input.value;
    // only add if value is unique (don't display a statement multiple times if users called it more than once in a session)
    // also do not add statements that have been previously saved
    if(new Set(uniqueText).size !== uniqueText.add(text).size && new Set(savedText).size !== new Set(savedText).add(text).size){
        var $newText = $(`<div class="input-group mb-3">
        <div class="input-group-prepend">
            <div class="input-group-text">
            <input type="checkbox" id="displayCheckbox${counter}" aria-label="Checkbox for following text input">
            </div>
        </div>
        <input type="text" class="form-control" id="displayText${counter}" value="${text}" aria-label="Text input with checkbox">
        </div>`)
        $("#saveTextModal").find(".modal-body").append($newText)
    }
    counter += 1;
}
    
document.addEventListener('DOMContentLoaded', function() {
    saveInit();
    init();
})

