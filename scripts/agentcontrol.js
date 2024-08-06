// AWS Polly / ChattyKathy variables
var agentVoice;

// Variables for different statement types
var initialTags, endingTags, voice;
var greetings, needStatements, gratStatements, praiseStatements, opinionStatements, positStatements, socialStatements;
var wrapper1, wrapper2, need1, need2;
var noflag, flag, vowelFlag;
var verb, object;
var shelterObj, treeObj, bedObj, drinkObj, foodObj, clothingObj, targetObj, vehicleObj, objectObj; // objects related to the flags
var speechTarget;
var previousStatements = [];
var preview = "needs";
var vowelRegex = '^[aieouAIEOU].*';
var currentAudio = document.querySelector("#playlist audio");
var uid;
var placeholder = "";

function init() {
	
    agentVoice = ChattyKathy();
    uid = document.getElementById("hiddenName").value;
	
	// The break time and 'breath' sound effect allow for the delay to get the bluetooth ready to speak the words
	// once a delay has caused the antenna to wind down.
    // TEST: are these necessary?
    initialTags = minibirdInitialTags;
    endingTags = minibirdEndingTags;
    voice = minibirdVoice;
    
	// Code to get <enter> to submit
	// Get the input field
	var input = document.getElementById("text");

    var saveText = document.getElementById("saveText")
	
	// Execute a function when the user releases a key on the keyboard
	input.addEventListener("keyup", function(event) {
		// Cancel the default action, if needed
		event.preventDefault();
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) {
			// Trigger the button element with a click
			document.getElementById("submit").click();
		}
        else{
            if (!isTyping){
                isTyping = true;
                tookSuggestion = false;
                $.post('/log_agent_action', {action:"typing", lang:locale, user:uid});
            }
        }
	});
	
}

// Function called when the submit button (or <enter> key) pressed
function wizardSpeak() {
	// replace characters that break AWS Polly
    var text = document.getElementById('text').value.replaceAll("&", "and").replaceAll("’", "'").replaceAll("–", "-");
    
    // Log submit action
    // User is not actively typing
    isTyping = false;
    let action = "submit";
    //Only include text if a researcher typed the text or came from one of our suggestions
    if(researchers.includes(uid) || tookSuggestion) {
        action = action + ": " + text;
    }
 
    // Do not log user-entered text
    $.post('/log_agent_action', {action:action, lang:locale, user:uid});

	// Run the text through the inappropriate language filter
    $.get("/string",{param:text}, function(string) {
		if(text.includes("*bird sound*") || text.includes("*sonidos de pájaro*")){
            try{
                currentAudio.src = "./assets/" + locale + '/' + objects[types.indexOf(soundeffectType)] + ".mp3";
            }
            catch {
                currentAudio.src = "./assets/" + locale + '/' + "whoosh.mp3";
            }
            
        }
        else{
            var cleanText;
            cleanText=string;
            // Add the text to the previousStatements to remember text that was submitted
            previousStatements.push(cleanText);
            document.getElementById('text').value = cleanText;

            if(text!=cleanText){
                alert("CAUTION: you have entered inappropiate text that is not allowed on StoryCarnival.");
            }
            else {
                if (saveText.checked) {
                    $.post('/log_agent_action', {action:"User saved text", lang:locale, user:uid});
                }
                // Create new string from input in the document text box
                // text.value is the string in the text box
                if(whispering){
                    speech = initialTags.concat('<amazon:effect name="whispered">'.concat(cleanText.concat('</amazon:effect>'.concat(endingTags))));
                }
                else{
                    speech = initialTags.concat(cleanText.concat(endingTags));
                }

                agentVoice.Speak(speech, voice);

                agentVoice.ForgetCachedSpeech();
            }
        }
	})
	
}

// Added to create a random order for array values
function shuffle(array) {

	var currentIndex = array.length, temporaryValue, randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		
		// And swap it with the current element.
		temporaryValue = array[currentIndex];

		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
		
	}
	return array;
}

function eraseText() {
    document.getElementById("text").value = "";
    isTyping = false;
    tookSuggestion = false;
    $.post('/log_agent_action', {action:"clear text", lang:locale, user:uid});
}


function previousText(){
    // If there is something in the previousText stack place it in the textbox and remove it from the stack
    if(previousStatements.length != 0){
        // Place text to preview in the text box
        document.getElementById("text").value = previousStatements.pop();
        
        isTyping = false;
        tookSuggestion = false;
        $.post('/log_agent_action', {action:"previous text", lang:locale, user:uid});
    }
}

// Polly tags are translated in /voiceAgent.html and saved here
function setVoice(speaker) {
    var options = document.getElementsByClassName("dropdown-item active");
    for (i = 0; i < options.length; i++){
       options[i].className = "dropdown-item"; 
    }
    document.getElementById(speaker).className += " active";

    // All voice tag initialized in voiceAgent.html
    switch(speaker){
        case "MiniBirdVoice":
            initialTags = minibirdInitialTags;
            endingTags = minibirdEndingTags;
            voice = minibirdVoice;
            
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to MiniBird", lang:locale, user:uid});
            break;
        case "CatVoice":
            initialTags = catInitialTags;
            endingTags = catEndingTags;
            voice = catVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Cat", lang:locale, user:uid});
            break;
        case "BearVoice":
            initialTags = bearInitialTags;
            endingTags = bearEndingTags;
            voice = bearVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Bear", lang:locale, user:uid});
            break;
        case "MonkeyVoice":
            initialTags = monkeyInitialTags;
            endingTags = monkeyEndingTags;
            voice = monkeyVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Monkey", lang:locale, user:uid});            
            break;
        case "HorseVoice":
            initialTags = horseInitialTags;
            endingTags = horseEndingTags;
            voice = horseVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Horse", lang:locale, user:uid});            
            break;
        case "DogVoice":
            initialTags = dogInitialTags;
            endingTags = dogEndingTags;
            voice = dogVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Dog", lang:locale, user:uid});            
            break;
        case "RobotVoice":
            initialTags = robotInitialTags;
            endingTags = robotEndingTags;
            voice = robotVoice;
            isTyping = false;
            $.post('/log_agent_action', {action:"set voice to Robot", lang:locale, user:uid});            
            break;
    }
}

// Used to allow users to switch to suggestions for a specific story
function changeStory(title, type, index){
    let storyObj = {};
    index = parseInt(index);

    if (type == "premade"){
        let premadeStoryData = storyJSON; // defined in storyData.js
    
        // For premade stories
        storyObj = {storyType:title, char1: premadeStoryData[title]["characters"][0]["id"],
            char2: premadeStoryData[title]["characters"][1]["id"], char3: premadeStoryData[title]["characters"][2]["id"], 
            char4: premadeStoryData[title]["characters"][3]["id"], role1:premadeStoryData[title]["roles"][0]["text"], 
            role2:premadeStoryData[title]["roles"][1]["text"], role3:premadeStoryData[title]["roles"][2]["text"], 
            role4:premadeStoryData[title]["roles"][3]["text"], obj:premadeStoryData[title]["objects"], types:[], 
            background:premadeStoryData[title]["background"][0], players:0, 
            playedSkippedSaved:"skipped", chars:[], log:[], title:title};
    }
    else{
        // For templates
        storyObj = {storyType:story_data[index]["storyType"], char1: story_data[index]["chosenCharacters"][0]["id"],
            char2: story_data[index]["chosenCharacters"][1]["id"], char3: story_data[index]["chosenCharacters"][2]["id"], 
            char4: story_data[index]["chosenCharacters"][3]["id"], role1:templateJSON[story_data[index]["storyType"]]["roles"][0]["text"], 
            role2:templateJSON[story_data[index]["storyType"]]["roles"][1]["text"], role3:templateJSON[story_data[index]["storyType"]]["roles"][2]["text"], 
            role4:templateJSON[story_data[index]["storyType"]]["roles"][3]["text"], obj:story_data[index]["chosenObjects"].map(function(val){return val["name"]}), types:story_data[index]["chosenObjects"].map(function(val){return val["type"]}), 
            background:story_data[index]["chosenBackground"]["name"], players:0, 
            playedSkippedSaved:"skipped", chars:[], log:[], title:story_data[index]["storyType"]};
    }
    
        // Reload the page
    location.href = '/voiceAgent?story='+ JSON.stringify(storyObj);
}

// TEST: try changing the case?
function roleText(characters, roles){
    isTyping = false;
    $.post('/log_agent_action', {action:"role text", lang:locale, user:uid});
    switch(voice){
        case "Ivy":
            document.getElementById("text").value = "I am MiniBird. I am here to help suggest things to do while you play.";
            break;
        case "Justin":
            var i = characters.indexOf("Cat");
            if (i == -1){
                document.getElementById("text").value = "I am not in this story.";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Nicole":
            var i = characters.indexOf("Bear");
            if (i == -1){
                document.getElementById("text").value = "I am not in this story.";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Aditi":
            var i = characters.indexOf("Monkey");
            if (i == -1){
                document.getElementById("text").value = "I am not in this story.";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Geraint":
            var i = characters.indexOf("Horse");
            if (i == -1){
                document.getElementById("text").value = "I am not in this story.";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Salli":
            var i = characters.indexOf("Dog");
            if (i == -1){
                document.getElementById("text").value = "I am not in this story.";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Lupe":
            // checking if its minibird or bear
            if (initialTags == minibirdInitialTags){
                document.getElementById("text").value = "Soy Pajarito. Estoy aquí para ayudar a sugerir cosas que hacer mientras juegas.";
                break;
            }
            else {
                var i = characters.indexOf("Bear");
                if (i == -1){
                    document.getElementById("text").value = "no estoy en esta historia";
                }
                else{
                    document.getElementById("text").value = roles[i];
                }
                break;
            }
        case "Penelope":
            var i = characters.indexOf("Cat");
            if (i == -1){
                document.getElementById("text").value = "no estoy en esta historia";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;
        case "Mia":
            // checking if its monkey or dog
            if (initialTags == monkeyInitialTags) {
                var i = characters.indexOf("Monkey");
                if (i == -1){
                    document.getElementById("text").value = "no estoy en esta historia";
                }
                else{
                    document.getElementById("text").value = roles[i];
                }
                break;
            }
            else {
                var i = characters.indexOf("Dog");
                if (i == -1){
                    document.getElementById("text").value = "no estoy en esta historia";
                }
                else{
                    document.getElementById("text").value = roles[i];
                }
                break;
            }
        case "Miguel":
            var i = characters.indexOf("Horse");
            if (i == -1){
                document.getElementById("text").value = "no estoy en esta historia";
            }
            else{
                document.getElementById("text").value = roles[i];
            }
            break;        
    }
    tookSuggestion = true;
}

function pickRandom(title){
    var options;
    switch(title){
        case "helloLabel":
            options = helloOptions;
            $.post('/log_agent_action', {action:"hello suggestion", lang:locale, user:uid});
            break;
        case "praiseLabel":
            options = praiseOptions;
            $.post('/log_agent_action', {action:"praise suggestion", lang:locale, user:uid});
            break;
        case "collaborateLabel":
            options = collaborateOptions;
            $.post('/log_agent_action', {action:"collaborate suggestion", lang:locale, user:uid});
            break;
        case "yesLabel":
            options = yesOptions;
            $.post('/log_agent_action', {action:"yes suggestion", lang:locale, user:uid});
            break;
        case "noLabel":
            options = noOptions;
            $.post('/log_agent_action', {action:"no suggestion", lang:locale, user:uid});
            break;
        case "octopusLabel":
            options = octopusOptions;
            $.post('/log_agent_action', {action:"octopus suggestion", lang:locale, user:uid});
            break;
        case "goodbyeLabel":
            options = goodbyeOptions;
            $.post('/log_agent_action', {action:"goodbye suggestion", lang:locale, user:uid});
            break;
        case "expandEvent":
            options = expandOptions;
            $.post('/log_agent_action', {action:"expand event suggestion", lang:locale, user:uid});
            break;
        case "expandRole1":
            options = expandRole1Options;
            $.post('/log_agent_action', {action:"expand role 1 suggestion", lang:locale, user:uid});
            break;
        case "expandRole2":
            options = expandRole2Options;
            $.post('/log_agent_action', {action:"expand role 2 suggestion", lang:locale, user:uid});
            break;
        case "expandRole3":
            options = expandRole3Options;
            $.post('/log_agent_action', {action:"expand role 3 suggestion", lang:locale, user:uid});
            break;
        case "expandRole4":
            options = expandRole4Options;
            $.post('/log_agent_action', {action:"expand role 4 suggestion", lang:locale, user:uid});
            break;
    }
    
    var shuffled = shuffle(options);
    isTyping = false;
    tookSuggestion = true;
    
    // Ensure selection always changes
    if(shuffled[0] != document.getElementById("text").value){
        document.getElementById("text").value = shuffled[0];
    }
    else{
        document.getElementById("text").value = shuffled[1];
    }
}

function pickPrevious(){
    if(replayOptionsPrev.length > 0){
        if (placeholder != ""){
            replayOptionsNext.unshift(placeholder);
            document.getElementById("nextEvent").className = "btn btn-sm btn-outline-primary";
        }

        placeholder = replayOptionsPrev.pop();

        if(replayOptionsPrev.length == 0){
            document.getElementById("prevEvent").className = "btn btn-sm btn-outline-primary disabled";
        }

        $.post('/log_agent_action', {action:"replay previous suggestion", lang:locale, user:uid});
        isTyping = false;
        tookSuggestion = true;
        document.getElementById("text").value = placeholder;
    }
}

function pickNext(){
    if(replayOptionsNext.length > 0){
        if (placeholder != ""){
            replayOptionsPrev.push(placeholder);
            document.getElementById("prevEvent").className = "btn btn-sm btn-outline-primary";
        }

        placeholder = replayOptionsNext.shift();

        if(replayOptionsNext.length == 0){
            document.getElementById("nextEvent").className = "btn btn-sm btn-outline-primary disabled";
        }

        $.post('/log_agent_action', {action:"replay next suggestion", lang:locale, user:uid});
        isTyping = false;
        tookSuggestion = true;
        document.getElementById("text").value = placeholder;
    }
}

function toggleValue(val){
    switch(val){
        case "whisperSwitch":
            whispering = !whispering;
    }
}