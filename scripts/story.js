// Global variables shared with planner.js
// TO-DO: Extend to allow multiple speakers on same page
// TO-DO: Play around with bounding boxes
var mbx;
var mby;

function addImages(page, objs, box){
    loop(objs, function(obj, k){
        var foundObject = false;
        obj = obj.trim();
        var bounding_box;
        var x;
        var y;

        // set up bounding box to hold images, record x & y coordinates for speech bubbles
        switch(box){
                case "LEFT-TOP-LEFT":
                    bounding_box = new Container(0, 0, stageW/4, stageH/2).addTo(page);
                    x = stageW/4;
                    y = 0;
                    break;
                case "TOP-LEFT":
                    bounding_box = new Container(stageW/4, 0, stageW/4, stageH/2).addTo(page);
                    x = 2*(stageW/4);
                    y = 0;
                    break;
                case "TOP":
                    bounding_box = new Container(stageW/4, 0, stageW/2, stageH/2).addTo(page);
                    x = 3*(stageW/4);
                    y = 0;
                    break;
                case "TOP-RIGHT":
                    bounding_box = new Container(2*(stageW/4), 0, stageW/4, stageH/2).addTo(page);
                    x = 3*(stageW/4);
                    y = 0;
                    break;
                case "RIGHT-TOP-RIGHT":
                    bounding_box = new Container(3*(stageW/4), 0, stageW/4, stageH/2).addTo(page);
                    x = 4*(stageW/4);
                    y = 0;
                    break;
                case "LEFT-CENTER-LEFT":
                    bounding_box = new Container(0, stageH/3, stageW/4, stageH/2).addTo(page);
                    x = stageW/4;
                    y = stageH/3;
                    break;
                case "CENTER-LEFT":
                    bounding_box = new Container(stageW/4, stageH/3, stageW/4, stageH/2).addTo(page);
                    x = 2*(stageW/4);
                    y = stageH/3;
                    break;
                case "CENTER":
                    bounding_box = new Container(0, 0, stageW, stageH).addTo(page);
                    x = 4*(stageW/4);
                    y = 0;
                    break;
                case "CENTER-RIGHT":
                    bounding_box = new Container(2*(stageW/4), stageH/3, stageW/4, stageH/2).addTo(page);
                    x = 3*(stageW/4);
                    y = stageH/3;
                    break;
                case "RIGHT-CENTER-RIGHT":
                    bounding_box = new Container(3*(stageW/4), stageH/3, stageW/4, stageH/2).addTo(page);
                    x = 4*(stageW/4);
                    y = stageH/3;
                    break;
                case "LEFT-BOTTOM-LEFT":
                    bounding_box = new Container(0, 2*(stageH/3), stageW/4, stageH/2).addTo(page);
                    x = stageW/4;
                    y = (stageH/2);
                    break;
                case "BOTTOM-LEFT":
                    bounding_box = new Container(stageW/4, 2*(stageH/3), stageW/4, stageH/2).addTo(page);
                    x = 2*(stageW/4);
                    y = (stageH/2);
                    break;
                case "BOTTOM":
                    bounding_box = new Container(stageW/4, 2*(stageH/4), stageW/2, stageH/2).addTo(page);
                    x = 3*(stageW/4);
                    y = (stageH/2);
                    break;
                case "BOTTOM-RIGHT":
                    bounding_box = new Container(2*(stageW/4), 2*(stageH/3), stageW/4, stageH/2).addTo(page);
                    x = 3*(stageW/4);
                    y = (stageH/2);
                    break;
                case "RIGHT-BOTTOM-RIGHT":
                    bounding_box = new Container(3*(stageW/4), 2*(stageH/3), stageW/4, stageH/2).addTo(page);
                    x = 4*(stageW/4);
                    y = (stageH/2);
                    break;
        }

        // add character graphics
        if (/Character\s+\d.*/.test(obj)){
            var index = parseInt(obj.match(/\d/)[0]) - 1;
            var details = obj.split("_");
            if(chosenCharacters[index].hasTail){
                var tail = frame.asset(chosenCharacters[index].id + "_tail.png").clone().scaleTo(bounding_box, 50, 50);
                if (chosenCharacters[index].id == "Cat"){
                    tail.pos(-tail.width/2, -tail.height/2, CENTER, CENTER, bounding_box);
                }
                else{
                    tail.pos(tail.width/2, -tail.height/2, CENTER, CENTER, bounding_box);
                }
            }
            frame.asset(chosenCharacters[index].id + "_standing.png").clone().scaleTo(bounding_box, 100, 100).center(bounding_box);
            if(chosenCharacters[index].id == "Horse"){
                if(chosenBackground.name == "space"){
                    frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(-5, 50);
                }
                else{
                    frame.asset("outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 85, 85).center(bounding_box).mov(5, -20);
                }
                if(details.length > 1){
                    var head = frame.asset(chosenCharacters[index].id + "_" + details[1] + ".png").clone().scaleTo(bounding_box, 50, 50);
                }
                else{
                    var head = frame.asset(chosenCharacters[index].id + "_neutral.png").clone().scaleTo(bounding_box, 50, 50);
                }
                head.pos(-10, -head.height/2, CENTER, TOP, bounding_box);
                chosenCharacters[index].x = head.x + head.width;
                chosenCharacters[index].y = head.y;
                if(chosenBackground.name == "space"){
                    var helmet = frame.asset("space_helmet.png").clone().scaleTo(bounding_box, 60, 60);
                    helmet.pos(-10, -helmet.height/2, CENTER, TOP, bounding_box);
                }
            }
            else{
                if(chosenCharacters[index].id == "Monkey"){
                    if(chosenBackground.name == "space"){
                        frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 105, 105).center(bounding_box).mov(0, -10);   
                    }
                    else{
                        frame.asset("outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(0, -35);
                    }
                }
                else{
                    if(chosenBackground.name == "space"){
                        frame.asset(chosenBackground.name + "_outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 100, 100).center(bounding_box).mov(0, 15);
                    }
                    else{
                        frame.asset("outfit_" + chosenCharacters[index].id + ".png").clone().scaleTo(bounding_box, 90, 90).center(bounding_box).mov(5, -40);   
                    }
                }
                if(details.length > 1){
                    var head = frame.asset(chosenCharacters[index].id + "_" + details[1] + ".png").clone().scaleTo(bounding_box, 60, 40);
                }
                else{
                    var head = frame.asset(chosenCharacters[index].id + "_neutral.png").clone().scaleTo(bounding_box, 60, 40);
                }
                head.pos(-10, -3*head.height/4, CENTER, TOP, bounding_box);
                chosenCharacters[index].x = head.x + head.width;
                chosenCharacters[index].y = head.y;
                if(chosenBackground.name == "space"){
                    var helmet = frame.asset("space_helmet.png").clone().scaleTo(bounding_box, 60, 60);
                    helmet.pos(-10, -3*helmet.height/4, CENTER, TOP, bounding_box);
                }
            }
        }

        else if (obj == "MiniBird"){
            var mb = frame.asset("MiniBird.png").clone().scaleTo(bounding_box, 50, 50);
            mb.pos(0, 0, CENTER, TOP, bounding_box);
            mbx = mb.x + mb.width;
            mby = mb.y;
        }

        // add object graphics
        else{
            loop(chosenObjects, function(item, i){
                if(obj == item.type){
                    frame.asset(item.img).clone().scaleTo(bounding_box, 100, 100, "biggest").center(bounding_box);
                    // text is not included in this graphic, so it's added here
                    if(item.name == engineProblemObj){
                        new Label({text:powType, size:100, color:"#fcbf1e", font:"Lato", outlineColor:"#40bad5", outlineWidth:15}).scaleTo(bounding_box, 30, 30).center(bounding_box);
                    }
                }
                else if(obj == item.type + "-held"){
                    frame.asset(item.img).clone().scaleTo(bounding_box, 30, 30).pos(30, 0, RIGHT, CENTER, bounding_box);
                }
            });
        }


    });
}

// stitch audio files for each page together based on text in script file
function setAudio(speaker, audio_components, page, audio_index){
    var text = "";
    var audioList = [breathAudio]; //add breath to fix bluetooth audio errors
    loop(audio_components, function(component, i){
        var foundComponent = false;

        // search for character names or background/setting names
        switch(component){
            case "Character 1":
                text += chosenCharacters[0].name;
                if(speaker == "Narrator"){
                    audioList.push(chosenCharacters[0].name + ".mp3");

                }
                else{
                    audioList.push(speaker + " " + chosenCharacters[0].name + ".mp3");
                }
                foundComponent = true;
                break;
            case "Character 2":
                text += chosenCharacters[1].name;
                if(speaker == "Narrator"){
                    audioList.push(chosenCharacters[1].name + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + chosenCharacters[1].name + ".mp3");
                }
                foundComponent = true;
                break;
            case "Character 3":
                text += chosenCharacters[2].name;
                if(speaker == "Narrator"){
                    audioList.push(chosenCharacters[2].name + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + chosenCharacters[2].name + ".mp3");
                }
                foundComponent = true;
                break;
            case "Character 4":
                text += chosenCharacters[3].name;
                if(speaker == "Narrator"){
                    audioList.push(chosenCharacters[3].name + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + chosenCharacters[3].name + ".mp3");
                }
                foundComponent = true;
                break;
            case "MiniBird":
                text += chosenCharacters[3].name;
                if(speaker == "Narrator"){
                    audioList.push(miniBirdObj + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + miniBirdObj + ".mp3");
                }
                foundComponent = true;
                break;
            case "setting":
                text += chosenBackground.setting;
                if(speaker == "Narrator"){
                    audioList.push(chosenBackground.setting + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + chosenBackground.setting + ".mp3");
                }
                foundComponent = true;
                break;
            case "background":
                text += chosenBackground.background;
                if(speaker == "Narrator"){
                    audioList.push(chosenBackground.background + ".mp3");
                }
                else{
                    audioList.push(speaker + " " + chosenBackground.background + ".mp3");
                }
                foundComponent = true;
                break;
        }

        // search for object names
        if(!foundComponent){
            loop(chosenObjects, function(item, j){
                if(component == item.type){
                    if(speaker == "Narrator"){
                        text += item.name;
                        audioList.push(item.name + ".mp3");
                    }
                    else{
                        text += item.name;
                        audioList.push(speaker + " " + item.name + ".mp3");
                    }
                    foundComponent = true;
                }
            });
        }

        // otherwise, use next story audio
        if(!foundComponent){
            text += component;
            if((/\w+/).test(component)){
                audioList.push(speaker + fname + audio_index +".mp3");
                audio_index++;
            }
        }
    });

    audio.push(audioList);

    // include speech bubble
    if(speaker != "Narrator"){
        if(speaker == miniBirdObj){
            new SpeechBubble(text).pos(mbx, mby, LEFT, TOP, page);
        }
        else{
            loop(chosenCharacters, function(character, i){
                if(character.name == speaker){
                    new SpeechBubble(text).pos(character.x, character.y, LEFT, TOP, page);
                }
            });
        }
    }

    return audio_index;
}

function goLeft(){
    if(pages.index > 0){
        pages.go(pages.index - 1, "left");
        playAudio();
    }
    else{
    }
}

function goRight(){
    if(pages.index < pages.pages.length - 1){
        pages.go(pages.index + 1, "right");
        playAudio();
    }
    else{
        // If not playing a saved story, show user page that asking for permission to store story.
        // move plan play function when user choose whether or not store story.
        if(!story_data){
            storeStories();
        }
        else{
            playedSkippedSaved = "played";
            console.log("playedSkippedSaved:", playedSkippedSaved);
            planPlay();
        }
        stage.update();
    }
}

function storeStories() {
    currentAudio.pause();
    stage.removeAllChildren();
    stage.update();
    var page = new Container(stageW, stageH);
    var roleTitle = new Label({text:saveStory, size:150, color:"#212529", font:"Lato"});
    roleTitle.center().mov(0, -300);
    
    var storyName = new TextArea({color:"#212529", width:stageW - 200, height:150, size:100, placeholder:nameYourStory})
        .center();

    var submitButton = new Button({
        width:300,
        height:150,
        backgroundColor:"#6ba292",
        rollBackgroundColor:"#f8f9fa",
        gradient:.3,
        corner:45,
        label: new Label({text:save, size:65, color:"#f8f9fa", outlineColor:dark})
    }).center(stage).mov(800, 500);

    var cancelButton = new Button({
        width:300,
        height:150,
        backgroundColor:"#6ba292",
        rollBackgroundColor:"#f8f9fa",
        gradient:.3,
        corner:45,
        label: new Label({text:skip, size:65, color:"#f8f9fa", outlineColor:dark})
    }).center(stage).mov(-800, 500);

    cancelButton.on("click",function () {
        playedSkippedSaved = "skipped";
        // move to play planner
        planPlay();
    });

    submitButton.on("click", function(){
            playedSkippedSaved = "saved";
            xmlhttp=new XMLHttpRequest();
            xmlhttp.open("POST","/record_user_stories", true);
            xmlhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(
                {"category":story,
                    "chosenCharacters":chosenCharacters,
                    "chosenBackground":chosenBackground,
                    "chosenObjects":chosenObjects,
                    //"storyDate":date,
                    "storyName": storyName.text,
                    "storyType":story,
                    //TEST: saving language of the current story
                    "storyLanguage": locale
                }));
            // move to play planner
            planPlay();
        //}
        
    });
    stage.update();
}

function createStoryPages(){
    // set up pages object
    var title = new Container(stageW, stageH);
    var titleText;
    var subtitleText;
    var present = null;
    var role_index = 0;
    var pageList =[];
    var narration_index = 1;
    var dialogue_index = 1;
    var minibird_index = 1;
    
    // create title page
    titleText = new Label({text:story, size:150, color:"#212529", font:"Lato"});
    titleText.center(title).mov(0,-300);
    pageList.push({page:title, swipe:["go left", "go right", null, null]});

    // get script file & fill in pages as appropriate
    jQuery.get('./assets/' + fname + '.txt', function(data) {
        var script = data;
        var scenes = script.split(/Page \d*/);
        scenes.shift();
        // add a page for each scene in the script
        loop(scenes, function(scene, i){
            //previous = present;
            present = new Container(stageW, stageH);

            // place graphics and set up audio
            var lines = scene.split("\n");
            loop(lines, function(line, j){
                if(line.trim() == "EXT"){
                    frame.asset(chosenBackground.outerImg).clone().center(present);
                }
                else if(line.trim() == "INT"){
                    frame.asset(chosenBackground.innerImg).clone().center(present);
                }
                else{
                    var split_line = line.split(/:\s*/);
                    if(split_line.length > 1){
                        var left_side = split_line[0];
                        var objs = split_line[1].replace(/\[|\]/g, "").split(/,\s*/);
                        var audio_components = split_line[1].split(/\[|\]/);
                        switch(left_side){
                            case "Narrator":
                                narration_index = setAudio("Narrator", audio_components, present, narration_index);
                                break;
                            case "Character 1":
                                dialogue_index = setAudio(chosenCharacters[0].name, audio_components, present, dialogue_index);
                                break;
                            case "Character 2":
                                dialogue_index = setAudio(chosenCharacters[1].name, audio_components, present, dialogue_index);
                                break;
                            case "Character 3":
                                dialogue_index = setAudio(chosenCharacters[2].name, audio_components, present, dialogue_index);
                                break;
                            case "Character 4":
                                dialogue_index = setAudio(chosenCharacters[3].name, audio_components, present, dialogue_index);
                                break;
                            case "MiniBird":
                                minibird_index = setAudio(miniBirdObj, audio_components, present, minibird_index);
                                break;
                            case "role":
                                addRole(role_index, objs[0], present);
                                chosenRoles.push(objs[0].replace(/[\n\r]/, ''));
                                role_index++;
                                break;
                            default:
                                addImages(present, objs, left_side);
                                break;
                        }
                    }
                }
            });
            pageList.push({page:present, swipe:["go left", "go right", null, null]});
        });
        pages = new Pages({pages:pageList});

        pages.go(0, "left");
        pages.addTo(stage, 0);
        // create arrows for page navigation
        right = new Button({
            width:50,
            height:50,
            backgroundColor:dark,
            rollBackgroundColor:dark,
            corner:25,
            label:"",
            icon:pizzazz.makeIcon("play", "white")
        }).center().mov((stageW / 2 - 120), 0).sca(2);

        //stage.removeChild(right);

        left = new Button({
            width:50,
            height:50,
            backgroundColor:dark,
            rollBackgroundColor:dark,
            corner:25,
            label:"",
            icon:pizzazz.makeIcon("play", "white")
        }).center().mov(-(stageW / 2 - 60), 0).sca(2);

        left.icon.rotation = 180;

        stage.update();
        createNavigation();
        stage.update();
        playAudio();
    });
}

function createNavigation(){
    // hotspots to shift between pages
	var hs = new HotSpots([
        // go back
        {page:stage, rect:[20,20,400,stageH-40], call:function(){goLeft();}},
        // go forward
        {page:stage, rect:[stageW-420,20,400,stageH-40], call:function(){goRight();}}
    ]);

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
}

function playStory(){
    // clear the stage
    stage.removeAllChildren();
    audio = [[]];
    // start play story
    createStoryPages();

	//left.icon.rotation = 180;
	//stage.removeChild(left);
    left.on("click", function(){goLeft();});
    right.on("click", function(){goRight();});
    pages.on("go left", function(){goLeft();});
    pages.on("go right", function(){goRight();});
}
