// Global variables shared with planner.js
frame = new Frame(scaling, stageW, stageH, color, outerColor, ["dice.png", "cat.png", "dog.png", "monkey.png", "horse.png", "bear.png", "island.png", "space.png", "woods.png", "storm.png", "sea.png", "moon.png", "boat.png", "car.png", "spaceship.png", "fish.png", "shelter.png", "pow.png", "catch.png", "look for.png", "home-button.png", "Cat_standing.png", "Cat_neutral.png", "Cat_worried.png", "Cat_surprised.png", "Cat_smile.png", "Cat_sleep.png", "Cat_confused.png", "Cat_looking.png", "Dog_standing.png", "Dog_neutral.png", "Dog_worried.png", "Dog_surprised.png", "Dog_smile.png", "Dog_sleep.png", "Dog_confused.png", "Dog_looking.png", "Monkey_standing.png", "Monkey_neutral.png", "Monkey_worried.png", "Monkey_surprised.png", "Monkey_smile.png", "Monkey_sleep.png", "Monkey_confused.png", "Monkey_looking.png", "Horse_standing.png", "Horse_neutral.png", "Horse_worried.png", "Horse_surprised.png", "Horse_smile.png", "Horse_sleep.png", "Horse_confused.png", "Horse_looking.png", "Bear_standing.png", "Bear_neutral.png", "Bear_worried.png", "Bear_surprised.png", "Bear_smile.png", "Bear_sleep.png", "Bear_confused.png", "Bear_looking.png", "apple.png", "balloons.png", "balloons2.png", "basketball.png", "candy.png", "cupcake.png", "donut.png", "hamburger.png", "ice cream.png", "sushi.png", "house.png", "door.png", "dancing.png", "space_outfit_Bear.png", "space_outfit_Cat.png", "space_outfit_Dog.png", "space_outfit_Horse.png", "space_outfit_Monkey.png", "outfit_Bear.png", "outfit_Cat.png", "outfit_Dog.png", "outfit_Horse.png", "outfit_Monkey.png", "space_helmet.png", "Cat_tail.png", "Monkey_tail.png", "chair.png", "table.png", "MiniBird.png", "rustling.png", "whoosh.png", "goldfinch.png", {font: "Lato", src: "https://fonts.googleapis.com/css2?family=Lato&display=swap"}], "/assets/", progressBar);

frame.on("ready", () => { // ES6 Arrow Function - like function(){}
    zog("ready from ZIM Frame"); // logs in console (F12 - choose console)
    chosenRoles = [];
	// set up stage
    stage = frame.stage;
    stageW = frame.width;
    stageH = frame.height;
	
    var backgrounds = [new Background("island", theSevenSeasObj, onAnIslandObj, "sea.png", "island.png"),
                       new Background("space", spaceObj, onTheMoonObj, "space.png", "moon.png"), 
                       new Background("woods", theWoodsObj, inTheWoodsObj, "woods.png", "woods.png"), 
                       new Background("house", outsideTheHouseObj, atTheHouseObj, "door.png", "house.png")]; 
    
	var characters = [new Character("Cat", catObj, "cat.png", catObjVoice, true), new Character("Dog", dogObj, "dog.png", dogObjVoice, false),
                      new Character("Monkey", monkeyObj, "monkey.png", monkeyObjVoice, true), new Character("Horse", horseObj, "horse.png", horseObjVoice, false), 
                      new Character("Bear", bearObj, "bear.png", bearObjVoice, false)];

    var objects = [{type:foodType, name:fishObj, img:"fish.png"}, {type:foodType, name:appleObj, img:"apple.png"}, {type:foodType, name:candyObj,
                    img:"candy.png"}, {type:methodType, name:catchObj, img:"catch.png"}, {type:methodType, name:lookForObj, img:"look for.png"}, {type:vehicleType, name:spaceshipObj, img:"spaceship.png"}, 
                    {type:vehicleType, name:carObj, img:"car.png"}, {type:vehicleType, name:boatObj, img:"boat.png"}, {type:problemType, name:engineProblemObj, 
                    img:"pow.png"}, {type:problemType, name:stormObj, img:"storm.png"}, {type:"shelter", name:"shelter", img:"shelter.png"}, {type:mealType, name:cupcakeObj,
                    img:"cupcake.png"}, {type:mealType, name:donutObj, img:"donut.png"}, {type:mealType, name:sushiObj, img:"sushi.png"}, {type:mealType, name:hamburgerObj, 
                    img:"hamburger.png"}, {type:mealType, name:iceCreamObj, img:"ice cream.png"}, {type:decorationType, name:balloonObj, img:"balloons.png"}, {type:entertainmentType, 
                    name:basketballObj, img:"basketball.png"}, {type:eventType, name:partyObj, img:"balloons.png"}, {type:eventType, name:basketballGameObj, img:"basketball.png"}, 
                    {type:eventType, name:danceObj, img:"dancing.png"}, {type:activityType, name:dancingObj, img:"dancing.png"}, {type:activityType, name:playingBallObj, img:"basketball.png"},
                    {type:furnitureType, name:chairObj, img:"chair.png"}, {type:furnitureType, name:tableObj, img:"table.png"}, {type:soundeffectType, name:"rustling", img:"rustling.png"}, 
                    {type:soundeffectType, name:"whoosh", img:"whoosh.png"}, {type:soundeffectType, name:"goldfinch", img:"goldfinch.png"}, {type:"MiniBird", name:"MiniBird", img:"MiniBird.png"}];

    var types;
    // story names translated in templates.html                    
    var stories = [exploreANewPlace, planAnEvent, whatIsThatNoise];
    
    // create containers for pages
    var storyPicker = new Container(stageW, stageH);
    var backgroundPicker = new Container(stageW, stageH);
    var characterPicker = new Container(stageW, stageH);
    var objectPicker = new Container(stageW, stageH);

    pages = new Pages({pages:[
        {page:storyPicker, swipe:[null,null,null,null]},
        {page:backgroundPicker, swipe:[null,null,null,null]},
        {page:characterPicker, swipe:[null,null,null,null]},
        {page:objectPicker, swipe:[null,null,null,null]},
    ], holder:stage});
    
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
    
    // If playing a saved story, set choices and skip straight to playing the story
    if(story_data){
        chosenBackground = story_data.chosenBackground;
        chosenCharacters = story_data.chosenCharacters;
        chosenObjects = story_data.chosenObjects;
        story = story_data.storyType;

        if(story == exploreANewPlace) {
            fname = exploreTemplateScript;
            title = "Explore a New Place";
        }
        else if (story == planAnEvent){
            fname = eventTemplateScript;
            title = "Plan an Event";
        }
        else{
            fname = noiseTemplateScript;
            title = "What is that Noise?";
        }
        playStory();
    }

    // Otherwise, construct story picker page
    else{
        new Label({text:pickStory, size:200, font:"Lato", color: "#212529"}).center(storyPicker).mov(0, -400);
        storyList = new List({list:stories, color:"#f8f9fa", backgroundColor:"#6ba292", rollColor:"#f8f9fa", rollBackgroundColor:"#6ba292", selectedColor:"#212529", selectedRollColor:"#212529", selectedBackgroundColor:"#f8f9fa", selectedRollBackgroundColor:"#f8f9fa", borderColor:"#e4fde1", backdropColor:"#e4fde1"}).sca(3).center(storyPicker).mov(0, 50);
        
        var nextButton = new Button({
            width:300,
            height:150,
            backgroundColor:"#6ba292",
            rollBackgroundColor:"#f8f9fa",
            gradient:.3,
            corner:45,
            label: new Label({text:next, size:65, color:"#f8f9fa"})
        }).center(storyPicker).mov(0, 500);
        
        nextButton.on("click", function(){
            story = storyList.text;

            if(story == exploreANewPlace) {
                fname = exploreTemplateScript;
                title = "Explore a New Place";
            }
            else if(story == planAnEvent){
                fname = eventTemplateScript;
                title = "Plan an Event";
            }
            else{
                fname = noiseTemplateScript;
                title = "What is that Noise?";
            }
            pages.go(backgroundPicker);
            jQuery.get('./assets/' + fname + '.txt', function(data) {
                var script = data.replace(/\n|\r/g, " ");
    
                // extract object types from script
                types = new Set(script.match(/\[.*?\]/g));
    
                // remove types that are covered by background and character and strip brackets
                types.forEach(e => {
                    if(/\[(Character \d)|(setting)|(background)\]/.test(e)){
                        types.delete(e);
                    }
                    else{
                        let temp = e.replace(/\[|\]/g, "");
                        if(temp != e){
                            types.add(temp);
                            types.delete(e);
                        }
                    }
                });
    
                // convert back to Array
                types = Array.from(types);
                var typeIndex = 0;
    
                // construct initial object picker page
                var objectButtons = [];
    
                // loop through assets and add a button for each object of the first type
                loop(objects, function(val, i) {
                    if(val.type == types[0]){
                        let img = frame.asset(val.img).clone();
                        img.id = val.img;
                        let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(objectPicker, 10, 10).centerReg()}).scaleTo(objectPicker, 20, 20);
                        objectButtons.push(button);   
                    }
                });
    
                // Tabs show a series of choices as buttons
                var objectTab = new Tabs({width:objectPicker.width/3, tabs:objectButtons}).center(objectPicker);
                var soundList = new List({list:["1", "2", "3"], color:"#f8f9fa", backgroundColor:"#6ba292", rollColor:"#f8f9fa", rollBackgroundColor:"#6ba292", selectedColor:"#212529", selectedRollColor:"#212529", selectedBackgroundColor:"#f8f9fa", selectedRollBackgroundColor:"#f8f9fa", borderColor:"#e4fde1", backdropColor:"#e4fde1"});
                var soundButton = new Button({
                    width:300,
                    height:150,
                    backgroundColor:"#6ba292",
                    rollBackgroundColor:"#f8f9fa",
                    gradient:.3,
                    corner:45,
                    label: new Label({text:next, size:65, color:"#f8f9fa"})
                });

                var objectLabel = new Label({text:pickOne + types[0], size:200, font:"Lato", color: "#212529"}).center(objectPicker).mov(0, -400);

                stage.update();

                function loadPicker(){
                    if(typeIndex < types.length){
                        objectPicker.removeChildAt(objectPicker.getChildIndex(objectLabel));
                        objectLabel = new Label({text:pickOne + types[typeIndex], size:200, font:"Lato", color: "#212529"}).center(objectPicker).mov(0, -400);
                        
                        if(types[typeIndex] == soundeffectType){
                            objectTab.center(objectPicker).mov(0, stageH);
                            soundList.sca(3).center(objectPicker).mov(0, 50);
                            soundButton.center(objectPicker).mov(0, 500);
                        }
                        else{
                            soundList.center(objectPicker).mov(0, stageH);
                            soundButton.center(objectPicker).mov(0, stageH);
                
                            let tempIndex = objectButtons.length;
                        
                            loop(objectButtons, function(val, i){
                                objectTab.removeAt(tempIndex);
                                tempIndex -= 1;
                            })
                
                            objectButtons = [];
                            
                            // loop through assets and add a button for each object of the first type
                            loop(objects, function(val, i) {
                                if(val.type == types[typeIndex]){
                                    let img = frame.asset(val.img).clone();
                                    img.id = val.img;
                                    let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(objectPicker, 10, 10).centerReg()}).scaleTo(objectPicker, 20, 20);
                                    objectButtons.push(button);  
                                }
                            });

                            // if only one option, skip picking
                            if(objectButtons.length == 1){
                                let selectedImg = objectButtons[0].icon.id;
                                loop(objects, function(val, i) {
                                    if(val.type == types[typeIndex]){
                                        if(selectedImg == val.img){
                                            chosenObjects.push(val);
                                            return "break";
                                        }
                                    }
                                });
                
                                typeIndex += 1;
                                loadPicker();
                            }
                            else{
                                // otherwise ask user to pick
                                objectTab.addAt(objectButtons, 0);
                                objectTab.center(objectPicker);
                            }
                        }
                        
                        // show changes
                        stage.update();
                    }
                    else{
                        playStory();
                    }
                }
    
                backgroundTab.on("change", function() {
                    zog("Background tab change loop");
                    let selectedImg = backgroundTab.selected.getChildAt(1).icon.id;
    
                    loop(backgrounds, function(val, i) {
                        if(selectedImg == val.outerImg){
                            chosenBackground = val;
                            return "break";
                        }
                    });
    
                    pages.go(characterPicker, "right");
                });
    
                characterTab.on("change", function() {
                    // add selected character to chosen and remove from options
                    let selectedImg = characterTab.selected.getChildAt(1).icon.id;
                    loop(characters, function(val, i) {
                        if(selectedImg == val.id + "_neutral.png"){
                            chosenCharacters.push(val);
                            return "break";
                        }
                    });
    
                    characterTab.removeAt(1, characterTab.selectedIndex);
                    // start the story
                    if(chosenCharacters.length == 4){
                        if(types.length > 0){
                            pages.go(objectPicker, "right");
                        }
                        else{
                            playStory();
                        }
                    }
    
                    stage.update();
                });
    
                objectTab.on("change", function(){
                    let selectedImg = objectPicker.getChildAt(objectPicker.getChildIndex(objectTab)).selected.getChildAt(1).icon.id;
                    loop(objects, function(val, i) {
                        if(val.type == types[typeIndex]){
                            if(selectedImg == val.img){
                                chosenObjects.push(val);
                                return "break";
                            }
                        }
                    });
    
                    typeIndex += 1;
                    loadPicker();
                });
                
                // listen for click instead of change (which would only play audio if selection is new)
                soundList.on("click", function(){
                    // delay to make sure selection has been updated on change
                    setTimeout(function(){
                        let soundIndex = objectPicker.getChildAt(objectPicker.getChildIndex(soundList)).selectedIndex;
                        currentAudio.src = musicPath + soundEffects[soundIndex];
                        currentAudio.play();
                    }, 200);    
                });
    
                soundButton.on("click", function(){
                    let soundIndex = objectPicker.getChildAt(objectPicker.getChildIndex(soundList)).selectedIndex;
                    let selectedSound = soundEffects[soundIndex].replace(".mp3","");
    
                    loop(objects, function(val, i) {
                        if(val.type == types[typeIndex]){
                            if(selectedSound == val.name){
                                chosenObjects.push(val);
                                return "break";
                            }
                        }
                    });
    
                    typeIndex += 1;
                    loadPicker();
    
                });
            });
        });
        
        // construct background picker page

        new Label({text:pickSetting, size:200, font:"Lato", color: "#212529"}).center(backgroundPicker).mov(0, -300);
    
        var backgroundButtons = [];
    
        // loop through assets and add a button for each setting
        loop(backgrounds, function(val, i) {
            let img = frame.asset(val.outerImg).clone();
            img.id = val.outerImg;
            let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(backgroundPicker, 8, 8).centerReg()}).scaleTo(backgroundPicker, 40, 40);
            backgroundButtons.push(button);
        });
    
        // Tabs show a series of choices as buttons
        var backgroundTab = new Tabs({width:backgroundPicker.width/2, tabs:backgroundButtons}).center(backgroundPicker);
    
        // construct character picker page
        new Label({text:pick4Characters, size:200, font:"Lato", color: "#212529"}).center(characterPicker).mov(0, -300);
    
        var characterButtons = [];
    
        // loop through assets and add a button for each character
        loop(characters, function(val, i) {
            let img = frame.asset(val.id + "_neutral.png").clone();
            img.id = val.id + "_neutral.png";
            let button = new Button({height:200, backgroundColor:"#6ba292", rollBackgroundColor:"#f8f9fa", icon:img.scaleTo(characterPicker, 15, 15).centerReg()}).scaleTo(characterPicker, 20, 20);
            characterButtons.push(button);
        });
    
        // Tabs show a series of choices as buttons
        var characterTab = new Tabs({width:characterPicker.width/2, tabs:characterButtons}).center(characterPicker);
        
        pages.addTo(); 
    
        // show changes
        stage.update(); 
    }   
});
