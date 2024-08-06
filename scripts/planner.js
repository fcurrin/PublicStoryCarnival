const scaling = "fit"; // this will resize to fit inside the screen dimensions
var stage;
var stageW = 2200;
var stageH = 1238;
const color = "#e4fde1"; // ZIM colors like green, blue, pink, faint, clear, etc.
const outerColor = "#6ba292"; // any HTML colors like "violet", "#333", etc. are fine to use

// set up ZIM frame
var progressBar = new ProgressBar({barType:"rectangular", foregroundColor:"#e4fde1", backgroundColor:"#6ba292"});
progressBar.width = stageW/3;
var frame;

// keep track of selected story components
var chosenCharacters = []; // updated in picker.js
var chosenBackground; // updated in picker.js
var chosenObjects = []; // updated in picker.js
var chosenRoles = []; // updated in story.js
var playedSkippedSaved = "played"; // updated in story.j, used for logging purposes
var premadeSlides = []; // used for premade stories
var premadeAudio = []; // used for premade stories
var pickedCharacters = []; // holds the characters users choose to play at end of story
var roles = [{name:"Finder", text:"I am the finder. I can find anything the group needs."},{name:"Builder", text:"I am the builder. I can build anything the group needs."}, {name:"Chef", text:"I am the chef. I can gather and prepare any food."}, {name:"Fixer", text:"I am the fixer. I can fix anything that is broken."}, {name:"Dreamer", text:"I am the dreamer. I have all the ideas for the group."}, {name:"Driver", text:"I am the driver. I can drive any vehicle."}, {name:"Healer", text:"I am the healer. I can take care of anyone who is hurt or sick."}, 
             {name:"Buscador", text:"Yo busco cosas. Puedo encontrar cualquier cosa que el grupo necesite."}, {name: "Constructor", text:"Yo construyo. Puedo construir cualquier cosa que el grupo necesite."}, {name:"Cocinero", text:"Yo cocino. Puedo conseguir y preparar cualquier comida."}, {name:"Mecánico", text:"Yo arreglo cosas. Puedo arreglar cualquier cosa que esté rota."}, {name:"Soñador", text:"Yo tengo ideas. Tengo todas las ideas para el grupo."}, {name:"Conductor", text:"Yo conduzco vehículos. Puedo conducir cualquier vehículo."}, {name:"Doctor", text:"Yo sano. Puedo cuidar de cualquiera que esté herido o enfermo."}];
var story; // updated in picker.js
var title; // updated in picker.js
var fname; // updated in picker.js
var pages; // updated in story.js
// used to control play/pause
var currentAudio = document.querySelector("#playlist audio");
var musicPath = "/assets/" + locale + "/";
const breathAudio = "/assets/breath.mp3"; //add breath to fix speaker problems
var audioIndex = 0;
var audio = [];
var soundEffects = ["rustling.mp3", "whoosh.mp3", "goldfinch.mp3"];
var plannerImgPath = "";

// arrows used for page navigation
var right;
var left;

var playerCounter = 1; // updates after each player picks a chracter
var randomizer;

// create page containers
var role1;
var role2;
var role3;
var role4;
var rolePicker;
var miniBirdPicker;
var howMany;
var numPlayers = 9;

var roleOrder = [0, 1, 2, 3];

//Fisher-Yates shuffle - https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function shuffleOptions(arr){
    for(let i = 0; i < arr.length; i++){
        let a = Math.floor(Math.random()*i);
        //swap elements
        let temp = arr[i];
        arr[i] = arr[a];
        arr[a] = temp;
    }
}

// wrapper class for characters -- may eventually be easier to just use generic objects
// voice is not currently used but will be when audio needs to be generated on-the-fly
class Character {
	constructor(id, name, img, voice, hasTail){
        this.id = id;
		this.name = name;
		this.img = img;
		this.voice = voice;
        this.hasTail = hasTail;
        this.x = 0;
        this.y = 0;
	}
}
    
// wrapper class for backgrounds -- may eventually be easier to just use generic objects
// eventually will separate vehicle and problem into their own objects
class Background {
	constructor(name, setting, background, outerImg, innerImg){
		this.name = name;
        this.setting = setting;
		this.background = background;
		this.outerImg = outerImg;
        this.innerImg = innerImg;
	}
}

// wrapper class for speech bubbles
class SpeechBubble extends Container {
    constructor(text){
        super();
        // construct shadow
        this.addChild(new Rectangle({width:500, height:250, color:moon, corner:[20,20,20,0]}).setTransform(10, 10));
        this.addChild(new Triangle({a:50, color:moon}).setTransform(20, 285, 1, 1, 220));
        // construct bubble
        var rect = this.addChild(new Rectangle({width:500, height:250, color:white, corner:[20, 20, 20, 0]}));
        this.addChild(new Triangle({a:50, color:white}).setTransform(10, 275, 1, 1, 220));
        // add text
        this.addChild(new Label({text:text, color:"#212529", align:"center", valign:"center", labelWidth:rect.width - 10, labelHeight:rect.height - 10, maxSize:50, font:"Lato"}).center(rect));
    }
}

function constructRolePicker(){
    //shuffle
    shuffleOptions(roleOrder);

    //construct how many page
    var howManyTitle = new Label({text:howManyTitleStr, size:150, color:"#212529", font:"Lato", backgroundColor:"#f8f9fa"});
    howManyTitle.center(howMany).mov(0, -300);
    
    var numPad = new Pad({width:stageW/4, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", rollColor:"dark"}).center(howMany).mov(0, 100);
    
    // construct random picker page
    frame.asset(plannerImgPath + "MiniBird.png").clone().scaleTo(miniBirdPicker, 80, 80).center(miniBirdPicker);

    // construct role picker page
    var roleTitle = new Label({text:whoDoesPlayer + playerCounter + wantToBe, size:150, color:"#212529", font:"Lato", backgroundColor:"#f8f9fa"});
    roleTitle.center(rolePicker).mov(0, -300);

    var roleButtons = [];

    // loop through assets and add a button for each character
    for(let i = 0; i < roleOrder.length; i++){
        let img = frame.asset(plannerImgPath + chosenCharacters[roleOrder[i]].id + "_neutral.png").clone();
        img.id = chosenCharacters[roleOrder[i]].img;
        let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(rolePicker, 15, 15).centerReg()}).scaleTo(rolePicker, 20, 20, "both");
        roleButtons.push(button);
    }

    let img = frame.asset(plannerImgPath + "dice.png").clone();
    img.id = "random";
    let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(rolePicker, 15, 15).centerReg()}).scaleTo(rolePicker, 20, 20, "both");
    roleButtons.push(button);

    // Tabs show a series of choices as buttons
    var roleTab = new Tabs({width:rolePicker.width/2, tabs:roleButtons}).center(rolePicker);

    // buttons to let children pick or not pick a role
    var checkButton = new Button({
        width:300,
        height:150,
        backgroundColor:"#6ba292",
        rollBackgroundColor:"#f8f9fa",
        gradient:.3,
        corner:45,
        label: new Label({text:pick, size:65, color:"#f8f9fa", outlineColor:dark})
    });
    
    var xButton = new Button({
        width:300,
        height:150,
        backgroundColor:"#6ba292",
        rollBackgroundColor:"#f8f9fa",
        gradient:.3,
        corner:45,
        label: new Label({text:change, size:65, color:"#f8f9fa", outlineColor:dark})
    });
    
    var doneButton = new Button({
        width:300,
        height:150,
        backgroundColor:"#6ba292",
        rollBackgroundColor:"#f8f9fa",
        gradient:.3,
        corner:45,
        label: new Label({text:done, size:65, color:"#f8f9fa", outlineColor:dark})
    }).center(rolePicker).mov(0, 500);

    checkButton.on("click", function(){
        playerCounter += 1;
        if(pages.index < 4){
            pickedCharacters.push(chosenCharacters[pages.index].id);
        }
        else{
            pickedCharacters.push("Helper");
        }
        roleTitle.removeFrom(rolePicker);
        roleTitle = new Label({text:whoDoesPlayer + playerCounter + wantToBe, size:150, color:"#212529", font:"Lato", backgroundColor:"#f8f9fa"});
        roleTitle.center(rolePicker).mov(0, -300);
        if(playerCounter > numPlayers){
            var objArray = [];
            var typeArray = [];
            var logArray = [];
            for(var i = 0; i < chosenObjects.length; i++){
                objArray.push(chosenObjects[i].name);
                typeArray.push(chosenObjects[i].type);
                logArray.push(chosenObjects[i].img.slice(0,-4));
            }
            if (chosenRoles.length == 4){
                var temp = [];
                for(var i = 0; i < roles.length; i++){
                    for(var j = 0; j < chosenRoles.length; j++){
                        if(roles[i].name == chosenRoles[j]){
                            temp.push(roles[i]);
                        }
                    }
                }
                chosenRoles = temp;
            }
            var storyObj = {storyType: story, char1: chosenCharacters[0].id,
                char2: chosenCharacters[1].id, char3: chosenCharacters[2].id, 
                char4: chosenCharacters[3].id, role1:chosenRoles[0].text, 
                role2:chosenRoles[1].text, role3:chosenRoles[2].text, 
                role4:chosenRoles[3].text, obj:objArray, types:typeArray, 
                background:chosenBackground.name, players:numPlayers, 
                playedSkippedSaved:playedSkippedSaved, chars:pickedCharacters, log:logArray, title:title};
                
            location.href = '/voiceAgent?story='+ JSON.stringify(storyObj);
        }
        else{
            pages.go(rolePicker);    
        }
    });

    xButton.on("click", function(){
        pages.go(rolePicker); 
    });
    
    doneButton.on("click", function(req, res){
        var objArray = [];
        var typeArray = [];
        var logArray = [];
        for(var i = 0; i < chosenObjects.length; i++){
            objArray.push(chosenObjects[i].name);
            typeArray.push(chosenObjects[i].type);
            logArray.push(chosenObjects[i].img.slice(0,-4));
        }
        if (chosenRoles.length == 4){
            var temp = [];
            for(var i = 0; i < roles.length; i++){
                for(var j = 0; j < chosenRoles.length; j++){
                    if(roles[i].name == chosenRoles[j]){
                        temp.push(roles[i]);
                    }
                }
            }
            chosenRoles = temp;
        }
        var storyObj = {storyType: story, char1: chosenCharacters[0].name,
            char2: chosenCharacters[1].name, char3: chosenCharacters[2].name, 
            char4: chosenCharacters[3].name, role1:chosenRoles[0].text, 
            role2:chosenRoles[1].text, role3:chosenRoles[2].text, 
            role4:chosenRoles[3].text, obj: objArray, types:typeArray, 
            background:chosenBackground.name, players:numPlayers, 
            playedSkippedSaved:playedSkippedSaved, chars:pickedCharacters, log:logArray, title:title};
        location.href = '/voiceAgent?story='+ JSON.stringify(storyObj);
    });

    // navigate to appropriate role page
    // as long as we have 4 characters per story, leaving this hardcoded should be fine

    roleTab.on("change", function(){
        let navigationHelper = function(j){
            console.log("Inside navigationHelper");
            console.log(j);
            switch(j) {
                case 0:
                    console.log("Go to page 1");
                    checkButton.center(role1).mov(800, 500);
                    xButton.center(role1).mov(-800, 500);
                    pages.go(role1);
                    break;
                case 1:
                    console.log("Go to page 2");
                    checkButton.center(role2).mov(800, 500);
                    xButton.center(role2).mov(-800, 500);
                    pages.go(role2);
                    break;
                case 2:
                    console.log("Go to page 3");
                    checkButton.center(role3).mov(800, 500);
                    xButton.center(role3).mov(-800, 500);
                    pages.go(role3);
                    break;
                case 3:
                    console.log("Go to page 4");
                    checkButton.center(role4).mov(800, 500);
                    xButton.center(role4).mov(-800, 500);
                    pages.go(role4);
                    break;
            }
        }

        switch(roleTab.selectedIndex) {
            case 4:
                var randomRole;
                console.log(randomizer);
                let randomIndex = randomizer.shift();
                console.log(randomIndex);
                let audioFlag = true;
                randomizer.push(Math.floor(Math.random() * 4));
                if(audioFlag == true){
                    currentAudio.src = "assets/transition.wav";
                    if (randomIndex == 4){
                        currentAudio.onended = function(){
                            currentAudio.src = "/assets/" + locale + "/Helper-random.mp3";
                            currentAudio.onended = function(){
                                audioFlag = false;
                                checkButton.center(miniBirdPicker).mov(800, 500);
                                xButton.center(miniBirdPicker).mov(-800, 500);
                                pages.go(miniBirdPicker);
                            }
                        };

                    }
                    else{
                        randomRole = chosenCharacters[randomIndex];
                        console.log(randomRole);
                        currentAudio.onended = function(){
                            currentAudio.src = "/assets/" + locale + "/" + randomRole.id + "-random.mp3";
                            currentAudio.onended = function(){
                                audioFlag = false;
                                navigationHelper(randomIndex);
                            };
                        };
                    }
                }
                break;
            default:    
                navigationHelper(roleOrder[roleTab.selectedIndex]);
                break;
        }
    });
    
    numPad.on("change", function(){
        numPlayers = numPad.text;

        let randomizerOptions = [roleOrder[0], roleOrder[1], roleOrder[2], roleOrder[3], 4, roleOrder[0], roleOrder[1], roleOrder[2], roleOrder[3]];
        console.log(randomizerOptions);
        randomizer = randomizerOptions.slice(0, numPlayers);
        console.log(randomizer);
        shuffleOptions(randomizer);
        console.log(randomizer);

        pages.go(rolePicker);
    });
}

// set up role pages
function addRole(role_index, role_name, page){
    // add background
    frame.asset(chosenBackground.innerImg).clone().center(page);
    
    // set character images
    var bounding_box = bounding_box = new Container(stageW/4, 2*(stageH/4), stageW/2, stageH/2).addTo(page);
    var x = 3*(stageW/4);
    var y = (stageH/2);
    if(chosenCharacters[role_index].hasTail){
        var tail = frame.asset(chosenCharacters[role_index].id + "_tail.png").clone().scaleTo(bounding_box, 50, 50);
        if (chosenCharacters[role_index].id == "Cat"){
            tail.pos(-tail.width/2, -tail.height/2, CENTER, CENTER, bounding_box);
        }
        else{
            tail.pos(tail.width/2, -tail.height/2, CENTER, CENTER, bounding_box);
        }   
    }
    frame.asset(chosenCharacters[role_index].id + "_standing.png").clone().scaleTo(bounding_box, 100, 100).center(bounding_box);
    if(chosenCharacters[role_index].id == "Horse"){
        if(chosenBackground.name == "space"){
            frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(-5, 50);
        }
        else{
            frame.asset("outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 85, 85).center(bounding_box).mov(5, -20);
        }
        var head = frame.asset(chosenCharacters[role_index].id + "_neutral.png").clone().scaleTo(bounding_box, 50, 50);   
        head.pos(-10, -head.height/2, CENTER, TOP, bounding_box);
        chosenCharacters[role_index].x = head.x + head.width;
        chosenCharacters[role_index].y = head.y;
        if(chosenBackground.name == "space"){
            var helmet = frame.asset("space_helmet.png").clone().scaleTo(bounding_box, 60, 60);
            helmet.pos(-10, -helmet.height/2, CENTER, TOP, bounding_box);
        }
    }
    else{
        if(chosenCharacters[role_index].id == "Monkey"){
            if(chosenBackground.name == "space"){
                frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 105, 105).center(bounding_box).mov(0, -10);   
            }
            else{
                frame.asset("outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(0, -35);
            }
        }
        else{
            if(chosenBackground.name == "space"){
                frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 100, 100).center(bounding_box).mov(0, 15);
            }
            else{
                frame.asset("outfit_" + chosenCharacters[role_index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(5, -40);   
            }
        }
        var head = frame.asset(chosenCharacters[role_index].id + "_neutral.png").clone().scaleTo(bounding_box, 60, 40);
        head.pos(-10, -3*head.height/4, CENTER, TOP, bounding_box);
        chosenCharacters[role_index].x = head.x + head.width;
        chosenCharacters[role_index].y = head.y;
        if(chosenBackground.name == "space"){
            var helmet = frame.asset("space_helmet.png").clone().scaleTo(bounding_box, 60, 60);
            helmet.pos(-10, -3*helmet.height/4, CENTER, TOP, bounding_box);
        }
    }
    // set audio
    audio.push([chosenCharacters[role_index].name + role_name + ".mp3"]);
    // add speech bubbles
    loop(roles, function(role, i){
        if(role_name.trim() == role.name){
            new SpeechBubble(role.text).pos(chosenCharacters[role_index].x, chosenCharacters[role_index].y, "left", "top", page);
        }
    });
}

function addPremade(slide, page){
    frame.asset(slide).clone().scaleTo(page, 100, 100).center(page);
}

function createPlannerPages(){
    // set up pages
    role1 = new Container(stageW, stageH);
    role2 = new Container(stageW, stageH);
    role3 = new Container(stageW, stageH);
    role4 = new Container(stageW, stageH);
    rolePicker = new Container(stageW, stageH);
    miniBirdPicker = new Container(stageW, stageH);
    howMany = new Container(stageW, stageH);
    
    pages = new Pages({pages:[
                {page:role1, swipe:[rolePicker,null,null,null]},
                {page:role2, swipe:[rolePicker,null,null,null]},
                {page:role3, swipe:[rolePicker,null,null,null]},
                {page:role4, swipe:[rolePicker,null,null,null]},
                {page:rolePicker, swipe:[null,null,null,null]},
                {page:miniBirdPicker, swipe:[null,null,null,null]},
                {page:howMany, swipe:[null,rolePicker,null,null]}
            ], holder:stage});
    
    // construct role pages for make-your-own
    if(chosenRoles.length == 4){
        loop(pages.pages, function(val, i){
            frame.asset(chosenBackground.innerImg).clone().center(val.page);
        });

        addRole(0, chosenRoles[0], role1);
        addRole(1, chosenRoles[1], role2);
        addRole(2, chosenRoles[2], role3);
        addRole(3, chosenRoles[3], role4);
    }
    // construct role pages for premade
    else{
        addPremade(premadeSlides[0], role1);
        addPremade(premadeSlides[1], role2);
        addPremade(premadeSlides[2], role3);
        addPremade(premadeSlides[3], role4);
    }

    constructRolePicker();
    
    pages.addTo();
    
    var homeButton = new Button({
        width:100,
        height:50,
        backgroundColor:"#2c3e50",
        rollBackgroundColor:"#f8f9fa",
        label: new Label({text:home, size:24, color:"#f8f9fa", rollColor:"dark"})
    }).pos({x:10, y:10, container:stage});
    
    homeButton.on("click", function(){
        location.href = "/";
    });
    
    pages.go(howMany);
    stage.update();
}

// used by story.js as well
function playAudio(){
    audioIndex = 0;

    console.log("Inside playAudio");
    console.log(pages.index);
    console.log(audio);

    if(audio[pages.index].length > 0){
        console.log(audio[pages.index]);
        if (audio[pages.index][audioIndex] == breathAudio) {
            currentAudio.src = breathAudio;
        } else {
            currentAudio.src = musicPath + audio[pages.index][audioIndex];
        }
        currentAudio.onended = function(){
            // Check for last audio file in the playlist
            if (audioIndex != audio[pages.index].length - 1) {
                // Change the audio element source
                audioIndex++;
                currentAudio.src = musicPath + audio[pages.index][audioIndex];
            }
        };
    }
    else{
        currentAudio.pause();
    }
}

function planPlay(){
    // clear the stage
    stage.removeAllChildren();
    pages.dispose();
    stage.update();
    
    // empty list is the audio for the role picker page
    if(chosenRoles.length == 4){
        audio = [[chosenCharacters[0].name + chosenRoles[0] + ".mp3"], 
                 [chosenCharacters[1].name +  chosenRoles[1] + ".mp3"], 
                 [chosenCharacters[2].name +  chosenRoles[2] + ".mp3"], 
                 [chosenCharacters[3].name +  chosenRoles[3] + ".mp3"],
                 [],
                 [],
                 []];
    }
    else{
        audio = premadeAudio;
    }

    createPlannerPages();
    
    playAudio();
	pages.on("page", function(){
        playAudio(); // all subsequent pages
	});
}