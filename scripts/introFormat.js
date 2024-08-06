const scaling = "canvasWrapper";
var stageW = 500;
var stageH = 250;
var stage;
const color = "#9bccf0"; // ZIM colors like green, blue, pink, faint, clear, etc.
const outerColor = "#e4fde1";

// keeps track of components
var tutorialSlides = ["intro1.png", "intro2.png", "intro3.png", "intro4.png", "intro5.png", "intro6.png", "intro7.png", "intro8.png", "intro9.png", "intro10.png", "intro11.png"]; // used for slides
var tutorialAudio = ["intro1.mp3", "intro2.mp3", "intro3.mp3", "intro4.mp3", "intro5.mp3", "intro6.mp3", "intro7.mp3", "intro8.mp3", "intro9.mp3", "intro10.mp3", "intro11.mp3"]; // used for audio for slides
var pages;
var currentAudio = document.querySelector("#playlist audio");
//var musicPath = "";
var audioIndex = 0;
var audio = [["slide00.mp3"]];

// arrows for page navigation
var right;
var left;

//TEST
var musicPath = "/intro/introAudio/" + locale + "/";
var imgPath = "/intro/introSlides/" + locale + "/";
var tutorialImgs = [];
var numSlides = 11;
var frame; 

// play the audio
function playAudio(){
    audioIndex = 0;
    let i = pages.index;

    if(audio[i].length > 0){
        currentAudio.src = musicPath + audio[i][audioIndex];
        currentAudio.onended = function(){
            // check for last audio file in the playlist
            if (audioIndex != audio[i].length - 1) {
                // change audio element source
                audioIndex++;
                currentAudio.src = musicPath + audio[i][audioIndex];
            }
        };
    }
}

//navigate back a page
function goLeft(){
    if(pages.index > 1){}
        if(pages.index == pages.pages.length - 1){
            right.backgroundColor = dark;
            right.rollBackgroundColor = dark;
            right.setIcon("icon", pizzazz.makeIcon("play", "white").sca(0.5));
            stage.update();
            console.log("add");
        }
        pages.go(pages.index - 1, "left");
        playAudio();
    }

//navigate forward a page
function goRight(){
    if(pages.index < pages.pages.length - 1){
        if(pages.index == pages.pages.length - 2){
            right.backgroundColor = clear;
            right.rollBackgroundColor = clear;
            right.setIcon("icon", pizzazz.makeIcon("play", "rgba(0,0,0,0)").sca(0.5));
            stage.update();
            console.log("remove");
        }
        pages.go(pages.index + 1, "right");
        playAudio();
    }
}

function createNavigation(){
    // Hotspots to shift between pages
    var hs = new HotSpots([
        {page:stage, rect:[20,20,stageW/4,stageH-40], call:function(){goLeft();}}, // go back
        {page:stage, rect:[stageW-(stageW/4 + 20),20,stageW/4,stageH-40], call:function(){goRight();}} // go forward
    ]);

     // create arrows for page navigation
     right = new Button({
        width:50,
        height:50,
        backgroundColor:dark,
        rollBackgroundColor:dark,
        corner:25,
        label:"",
        icon:pizzazz.makeIcon("play", "white").sca(0.5)
    });

    left = new Button({
        width:50,
        height:50,
        backgroundColor:dark,
        rollBackgroundColor:dark,
        corner:25,
        label:"",
        icon:pizzazz.makeIcon("play", "white").sca(0.5)
    });

    left.icon.rotation = 180;

    left.on("click", function(){goLeft();});
    right.on("click", function(){goRight();});
    pages.on("go left", function(){goLeft();});
    pages.on("go right", function(){goRight();});

    pages.go(0, "left"); // Navigate to the first page, "left" is the direction of the transition
    stage.update();
    playAudio();
}

// set up pages object and add images to it
function createTutorialPages(){
    let pageList = []; // Temporary holder for slides

    // Create first page -- no audio
    pageList.push({page:new Container(stageW, stageH), swipe:[null,null,null,null]}); // Add placeholder to the list
    var play = new Button({
        width:stageW,
        height:stageH,
        backgroundColor:dark,
        rollBackgroundColor:dark,
        corner:10,
        label:introStartText
    }).scaleTo(stage, 100).pos(0,0,MIDDLE,MIDDLE,stage).addTo(pageList[0].page);

    play.on("click", function(){
        left.scaleTo(stage, 10).pos(20,0,LEFT,MIDDLE,stage).addTo(stage);
        right.scaleTo(stage, 10).pos(20,0,RIGHT,MIDDLE,stage).addTo(stage);
        stage.update();
        goRight();
    });

    for (let i = 0; i < numSlides; i++){
        let page = new Container(stageW, stageH); // Create a container

        frame.asset(tutorialImgs[i]).clone().scaleTo(page, 100, 100).center(page); // Add image to container

        pageList.push({page:page, swipe:[null,null,null,null]}); // Add placeholder to the list
    }

    // Swipe array indicated which page to load on right swipe, left swipe, down swipe, and up swipe
    pageList[0].swipe = [null, pageList[1].page, null, null]; // Set up swipe array for the first slide
    pageList[numSlides-1].swipe = [pageList[numSlides-2].page, null, null, null]; // Set up swipe array for the last slide

    // Set up swipe arrays for all middle pages
    for(let j = 1; j < numSlides - 1; j++){
        pageList[j].swipe = [pageList[j - 1].page, pageList[j + 1].page, null, null];
    }

    pages = new Pages({pages:pageList, holder:stage}); // Used for navigation
    pages.addTo(stage, 0);
    stage.update();
    createNavigation();
}

function playStory(){
    let dimensions = document.getElementById("canvasWrapper").getBoundingClientRect();
    stageH = dimensions.height;
    stageW = dimensions.width;
    frame = new Frame({scaling:scaling, height:stageH, width:stageW, color:color, outerColor:outerColor, assets:["Intro1.png", "Intro2.png", "Intro3.png", "Intro4.png", "Intro5.png", "intro6.png", "Intro7.png", "Intro8.png", "Intro9.png", "Intro10.png", "Intro11.png"], path:imgPath, allowDefault:true});
    
    frame.on("ready", function(){
        // Clear the stage
        stage = frame.stage;

        for(let i = 0; i < numSlides; i++){
            let slideImg = "Intro" + (i+1) + ".png"; // Get name of image for slide
            tutorialImgs.push(slideImg); // Maintain list of image filenames

            let slideAudio = "intro" + (i+1) + ".mp3"; // Get name of image for slide
            audio.push([slideAudio]); // Maintain list of audio filenames
        }

            var loading = frame.loadAssets(tutorialImgs, imgPath); // Load images
            loading.on("complete", function(){
                createTutorialPages();
            });
        //}
        //document.getElementById("canvasWrapper").style.height = "relative";
        //document.getElementById("canvasWrapper").appendChild(document.getElementById("myCanvas"));
    });
}