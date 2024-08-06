// initialize env variables in .env
const path = require('path')
path.resolve(__dirname)
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// DynamoDB tables
var logTable = process.env.DYNAMO_LOG_TABLE; // Dynamo DB table name
var usersTable = process.env.DYNAMO_USERS_TABLE;
var surveyTable = process.env.SURVEY_TABLE;

// Qualtrics survey ids
var surveyIDs = process.env.SURVEY_IDS;
var surveyIDs_es = process.env.SURVEY_IDS_ES;

// List of research account ids (obtained from Cognito user pools)
// Used to filter log entries based on whether a user is a member of the research team
// Can also be used to test features that aren't ready for public deployment yet
var researchers = []; 
if ("RESEARCHERS" in process.env){
    researchers = process.env.RESEARCHERS;
}

// Testing -- I think we do not currently use adm-zip: https://www.npmjs.com/package/adm-zip 
//const AdmZip = require('adm-zip');

// Required modules & libraries
var createError = require('http-errors');

// Express framework for NodeJS: https://expressjs.com/
var express = require('express');

// Currently we don't split the app or do much interesting with routers
// https://expressjs.com/en/5x/api.html#router
var router = express.Router();

// Used to read/write to files
const fs = require('fs');
const csv = require('@fast-csv/format');

// Cookie is required to maintain session when user is logged in
var cookieParser = require('cookie-parser');

// Used to log HTTP requests: https://www.npmjs.com/package/morgan
var logger = require('morgan');

// Used to display the logo in browser tabs
var favicon = require('serve-favicon');

// We use v2 of the AWS SDK: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html
// Eventually, this should be migrated to v3 (end of support for v2: September 8, 2025): https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
var AWS = require("aws-sdk");

// S3 endpoints used for cloud storage for log files
const s3 = new AWS.S3({apiVersion: '2006-03-01', endpoint:process.env.S3_ENDPOINT});

// Internationalization framework: https://www.npmjs.com/package/i18n-2
// Used to display content in the appropriate language (English or Spanish)
// Uses dictionary files: dicts/en.js and dicts/es.js 
var i18n = require('i18n-2');

// Used to make http requests for Qualtrics surveys
var axios = require('axios');

// English version only: used to filter inappropriate language from the voice agent control interface
// https://www.npmjs.com/package/bad-words
var Filter = require('bad-words');
var filter = new Filter();

// Used to generate pseudo-random bytes in non-sensitive settings (random id used to indicate user does not have a voice agent from us)
const crypto = require('crypto');
// Declare NONCE_SIZE, ALGORITHM_TAG_SIZE, ALGORITHM_KEY_SIZE, ENCRYPTION_ALGORITHM, SALT_SIZE, PBKDF, and PBKDF_ITR
const NONCE_SIZE = 0;
const ALGORITHM_TAG_SIZE = 0;
const ALGORITHM_KEY_SIZE = 0;
const ENCRYPTION_ALGORITHM = "";
const SALT_SIZE = 0
const PBKDF = "";
const PBKDF_ITR = 0;

// Used to manage user login/logout
// Uses the built-in Cognito UI -- limited customization (including error handling and languages)
// Requires a Cognito User Pool set up to include client-secrets
// To use a custom UI, we would want to migrate to a User Pool without a client-secret
var passport = require('passport');
var CognitoStrategy = require('passport-cognito-oauth2').Strategy;
//const { CognitoJwtVerifier } = require("aws-jwt-verify");
var session = require('express-session');
//var s3 = new AWS.S3({apiVersion: '2006-03-01', endpoint:process.env.S3_ENDPOINT});

//Passport serialization
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Passport Strategy - AWS Cognito
const options = {
    callbackURL: process.env.COGNITO_CALLBACK_URL,
    clientDomain: process.env.COGNITO_DOMAIN,
    clientID: process.env.COGNITO_CLIENT_ID,
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    passReqToCallback: true,
    region: process.env.REGION
};

passport.use(new CognitoStrategy(options,
    function(req, accessToken, idToken, refreshToken, user, cb) {
        user.token = accessToken;
        user.locale = req.session.locale;
        
        // Parse the ID token
        try {
            const parsedToken = parseCognitoIdToken(refreshToken.id_token);
            user.id = parsedToken.sub;
        } catch (error) {
            console.error('Error parsing ID token:', error);
        }

        cb(null, user);
    }));

    // Function to parse Cognito ID token
    function parseCognitoIdToken(idToken) {
        function base64UrlDecode(str) {
            // Replace URL-safe characters with base64 characters
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            
            // Pad with '=' if the length is not a multiple of 4
            while (str.length % 4) {
                str += '=';
            }
    
            // Decode the base64 string
            return Buffer.from(str, 'base64').toString('utf-8');
        }
    
        // AWS Cognito ID token is a JWT, which consists of three parts separated by dots ('.')
        const tokenParts = idToken.split('.');
        
        // Ensure the token has the correct number of parts
        if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
        }
    
        // The payload is the second part of the token
        const payload = tokenParts[1];
    
        // Decode the base64url encoded payload
        const decodedPayload = base64UrlDecode(payload);
    
        // Parse the decoded payload as a JSON object
        return JSON.parse(decodedPayload);
    } 

// Upload log files to S3 every Friday at midnight
// This is just an example, modify as needed
const cron = require("node-cron");
cron.schedule("0 0 * * fri", function () {
    uploadLogFile("/completed-stories", "completed-stories.csv");
    uploadLogFile("/started-stories", "started-stories.csv");
    uploadLogFile("/agent-actions", "agent-actions.csv");
    console.log("---------------------");
    console.log("Uploaded logs to S3");
    console.log("---------------------");
});

// Create a Polly client -- used to synthesize voice agent's speech
const Polly = new AWS.Polly({
    region: process.env.REGION
});

// Initialize Express
var app = express();
// Templating language used to embed logic in html pages: https://ejs.co/
// Used by i18n to look up text in dictionaries
// Used to (for example) only display content to parents/professionals/researchers or users accessing the site in English/Spanish
const ejs = require('ejs');
const {
    strict
} = require('assert');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.__express);

app.set('view engine', 'html');

// Display the logo in browser tabs
app.use(favicon(path.join(__dirname, 'public', 'SC_logo.png')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Intailize Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: {
        expires: false
    }
}));

//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize Dynamo DB Connection
AWS.config.update({
    region: process.env.REGION
});

//Initialize I18n translation
i18n.expressBind(app, {
    // Set up some locales
    locales: ['en', 'es'],
    directory: path.join(__dirname, 'dicts'),
    session: true
});


app.use(function(req, res, next) {
    // If users go to https://storycarnival.cs.uiowa.edu/?lang=es for example, set locale to es
    if(req.query.lang){
        req.i18n.setLocaleFromQuery();
    }
    else{
        // Other locales (non-es) default to en silently
        if(!req.session.locale){
            req.session.locale = "en";
        }
        req.i18n.setLocaleFromSessionVar();
    }
    req.session.locale = req.i18n.getLocale();
    next();
});

// Voice agent inappropriate language filter
// Uses 'bad-words' package
// Only works for English text currently but could specify text to filter for Spanish as well
app.get("/string", function(req, res) {
    var text = req.query.param;
    var cleanText = filter.clean(text);
    res.send(cleanText);
});

// Used to make DynamoDB queries
const docClient = new AWS.DynamoDB.DocumentClient({service:new AWS.DynamoDB({endpoint: process.env.DYNAMO_ENDPOINT})});

// Login via Cognito
app.get('/login', passport.authenticate('cognito-oauth2'));

// Cognito Callback
// After logging in, users get redirected to the home page and the 'loginTime' function is called
app.get('/auth/cognito/callback', passport.authenticate('cognito-oauth2'), function (req, res) {req.session.locale = req.user.locale; res.redirect('/loginTime');});

function encrypt(plaintext, key) {
    let nonce = crypto.randomBytes(NONCE_SIZE);
    
    let cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, nonce);

    let encryptedText = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([nonce, encryptedText, cipher.getAuthTag()]);
}

function encryptString(plaintext, id) {
    let password = id;
    let salt = crypto.randomBytes(SALT_SIZE);

    let key = crypto.pbkdf2Sync(Buffer.from(password, "utf-8"), salt, PBKDF_ITR, ALGORITHM_KEY_SIZE, PBKDF);

    let cipheredText = Buffer.concat([salt, encrypt(Buffer.from(plaintext), key)]);

    return cipheredText.toString("base64");
}

function decrypt(encrypted, key) {
    let nonce = encrypted.slice(0, NONCE_SIZE);
    let text = encrypted.slice(NONCE_SIZE, encrypted.length - ALGORITHM_TAG_SIZE);
    let authTag = encrypted.slice(text.length + NONCE_SIZE);

    let cipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, nonce);

    cipher.setAuthTag(authTag);

    return Buffer.concat([cipher.update(text), cipher.final()]);
}

function decryptString(encrypted, id) {
    let ciphered = Buffer.from(encrypted, "base64");

    let salt = ciphered.slice(0, SALT_SIZE);
    let cipheredNoSalt = ciphered.slice(SALT_SIZE);
    let password = id;

    let key = crypto.pbkdf2Sync(Buffer.from(password, "utf-8"), salt, PBKDF_ITR, ALGORITHM_KEY_SIZE, PBKDF);

    return decrypt(cipheredNoSalt, key).toString("utf-8");
}

app.post('/allowSavedText', ensureAuthenticated, function(req, res) {
    if (req.user != null) {
        var params = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username
            },
            UpdateExpression: "SET allowSavedText = :t",
            ExpressionAttributeValues: {
                ":t": req.body.toggle
            },
            ReturnValues: "UPDATED_NEW"
        };
        docClient.update(params, function(err, data) {
            if (err) {
                console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
            }
            if (data) {
                console.log("Success. Data:", data);
            }
        })
    }

    res.status('200').send();
});

app.get('/savedText', ensureAuthenticated, async function(req, res) {
    let savedText = [];

    if (process.env.LOCAL_TESTING){
        req.user = {username:'test'};     
    }

    var params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username
        },
        ProjectionExpression: "SavedText",
    };

    try {
	    var data = await docClient.get(params).promise();
        if(data.Item.SavedText){
            savedText = data.Item.SavedText;
        }
    }
	catch(err) {
		console.log(err);
	}

    for(let i = 0; i < savedText.length; i++){
        try{
            savedText[i] = decryptString(savedText[i], req.user.id);
        }
        catch (err){
            console.log("Could not decrypt string:", err);
        }
    }

    res.send(savedText)
})

app.post('/record-saved-text', ensureAuthenticated, function(req, res) {
    savedText = JSON.parse(req.body.SavedText);
    for(let i = 0; i < savedText.length; i++){
        savedText[i] = encryptString(savedText[i], req.user.id)
    }

    var params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username
        },
        UpdateExpression: "SET SavedText = list_append(if_not_exists(SavedText, :empty_list), :S)",
        ExpressionAttributeValues: {
            ":S": savedText,
            ":empty_list": []
        },
        ReturnValues: "UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (data) {
            console.log("Success. Data:", data);
        }
        if (err) {
            console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
        }
    });

    res.status(200).send(false);
})

app.post('/replace-saved-text', ensureAuthenticated, function(req, res) {
    savedText = JSON.parse(req.body.SavedText);
    for(let i = 0; i < savedText.length; i++){
        savedText[i] = encryptString(savedText[i], req.user.id)
    }

    var params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username
        },
        UpdateExpression: "SET SavedText = :S",
        ExpressionAttributeValues: {
            ":S": savedText
        },
        ReturnValues: "UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (data) {
            console.log("Success. Data:", data);
        }
        if (err) {
            console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
        }
    });

    res.status(200).send(false);
})

// Uses the loginTime middleware to do some initial setup before redirecting to the home page
app.get('/loginTime', loginTime, function(req, res){
    req.session.viewSurvey = 0;
    res.redirect('/');
});

// This page displays if someone tries to access the site without logging in
app.get('/unauthorized', function(req, res, next) {
    return res.render('unauthorized', {
        title: "Unauthorized"
    })
});

// Research page gives additional information about the project -- does not require users to be logged in
app.get('/research', function(req, res){
    return res.render('research');
});

// Route to load role selection page -- renders views/roles.html
// This page displays only the first time a user signs up
app.get('/roles', ensureAuthenticated,  function(req, res, next) {
    return res.render('roles', {title: "roles"});
});

// After user sign up, users must select a role as a parent or professional
// This is called after users select the "parent" or "professional" button on the roles page
app.get('/selectRole', ensureAuthenticated, async function(req, res, next){
    let role = req.query.selected;
    let hasrole = false;
    var params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username,
        },
        UpdateExpression: 'SET userRole = :r',
        ExpressionAttributeValues: {
            ':r': role
        },
        ReturnValues: "UPDATED_NEW"
    };
    await docClient.get(params, async (err, data) => {
        if (err) {
            console.error("Unable to get item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // Checking if the user already has an assigned role
            if (data.Item.userRole == "Professional" || data.Item.userRole == "Parent"){
                hasrole = true;
            }
        }
    }).promise();

    // Only update if the user does not have a role
    if (!hasrole) {
        await docClient.update(params, async (err, data) => {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            }
        }).promise();
    }

    // Set initial values -- indicates when to prompt users to complete surveys
    let time = new Date().toISOString(); // Current date
    let offsetTime = new Date();
    offsetTime = new Date(offsetTime.setDate(offsetTime.getDate() - 14));
    offsetTime = offsetTime.toISOString(); // Date two weeks ago, used to stagger survey dates
    let userTimeWeek = time;
    let userTimeTookWeek = time;
    let userTimeMonth = time;
    let userTimeTookMonth = time;
    let userTimeUsability = offsetTime; // Offset by 2 weeks to stagger with the monthly survey
    let userTimeTookUsability = offsetTime;
    let username = null;
    let survey = null;
    let surveyList = surveyIDs;
    if(req.session.locale == "es"){
        surveyList = surveyIDs_es;
    }

    req.session.returningUser = false;

    // Only parents take the demographic survey
    if (role == "Parent"){
        req.session.surveyCheck = "Demo";
        username = req.user.username;
        survey = JSON.parse(surveyList)["Parent"]["Demo"];

        let userTimeNew = time;

        // Use offsetTime to make sure demographic survey shows up on /survey until a response is recorded
        let userTimeTookNew = offsetTime; 
    
        params = {
            TableName: surveyTable,
            Item: {
                "user_id": req.user.username,
                "info": {
                    "Demo": {
                        PrevDate: userTimeNew,
                        LastTookDate: userTimeTookNew
                    },
                    "Monthly": {
                        PrevDate: userTimeMonth,
                        LastTookDate: userTimeTookMonth
                    },
                    "Weekly": {
                        PrevDate: userTimeWeek,
                        LastTookDate: userTimeTookWeek
                    },
                    "Usability": {
                        PrevDate: userTimeUsability,
                        LastTookDate: userTimeTookUsability
                    }
                }
            }
        };
    }
    else{
        req.session.surveyCheck = "None";

        params = {
            TableName: surveyTable,
            Item: {
                "user_id": req.user.username,
                "info": {
                    "Monthly": {
                        PrevDate: userTimeMonth,
                        LastTookDate: userTimeTookMonth
                    },
                    "Weekly": {
                        PrevDate: userTimeWeek,
                        LastTookDate: userTimeTookWeek
                    },
                    "Usability": {
                        PrevDate: userTimeUsability,
                        LastTookDate: userTimeTookUsability
                    }
                }
            }
        };
    }
    
    // Set values in users table in DynamoDB
    await docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    }).promise().then(function(){
        // Go to Tutorial Page after selecting role
        res.render('tutorial', {
            user: username,
            surveyID: survey,
            role: role,
	        string: req.session.randomString
        });
    });
});

// Uses i18n to change the language content displays in
app.post('/changeLanguage', function (req, res) {
    // Update locale session variable & send response
    req.session.locale = req.body.lang;
    // Surveys in different languages are separate so have different ids
    surveyList = surveyIDs;
    if(req.session.locale == "es"){
        surveyList = surveyIDs_es;
    }

    res.status(200).send();
});

// Loads the landing page for logged out users and the home page for logged in users
// Use process.env.LOCAL_TESTING to access the homepage without logging in while testing locally
app.get('/', qualtricsRequest, async (req, res) => {
    // Define behavior for local testing
    // Can manually change these values as needed for testing
    // Renders the home page instead of the landing page
    if (process.env.LOCAL_TESTING) {
        req.user = {username:'test'}; 
        req.session.userRole =  "Professional";
        req.session.randomString = "Local Testing";
        req.session.storyData = null;

        res.render('./home.html', {
            name: req.user.username,
            time: '',
            message: '',
            story_data: req.session.storyData,
            surveys: surveyIDs,
            role: req.session.userRole
        });
    }

    // Define actual behavior for servers -- req.user is defined indicates user has logged in
    else if (req.user != null) {
        req.session.storyData = null;
        
        let userRole = "User";
        let surveyList = surveyIDs;
        if(req.session.locale == "es"){
            surveyList = surveyIDs_es;
        }

        const param = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username,
            }
        };
        //Try here was from testing, once the authentication is working better, we can remove this
        try{
            // Look up user in DynamoDB table
        await docClient.get(param, async (err, data) => {
                if (err) {
                } else {
                    userRole = data.Item.userRole;
                    language = data.Item.PreferLanguage;
                    req.session.storyData = data.Item.UserStories ? data.Item.UserStories : null

                    if (userRole == "User"){
                        req.session.returningUser = false;
                    } else {
                        req.session.returningUser = true;
                    }
                }
            }).promise();
        }
        catch(err){
                console.log(err);
        }
		// Everytime the user back to the home page, viewSurvey will ++
		// If viewSurvey is equals to 1, then it will pop out the survey in homepage
        (req.session.viewSurvey)++;

        // If a returning user has logged in, display the home page
        if (req.session.returningUser) {
            res.render('./home.html', {
                name: req.user.username,
                time: req.session.surveyCheck,
                message: req.session.viewSurvey,
                story_data: req.session.storyData,
                surveys: surveyList,
				role: userRole
            });
        } else {
			// New user, so will redirect /roles to select a role
            req.session.returningUser = true;
			res.redirect('/roles');
        }
    } else {
        // If user is logged out, display the landing page
        console.log("User is logged out");
        res.render('./' + process.env.LANDING_PAGE + '.html');
    }
});

app.use('/assets', express.static(path.join(__dirname, '/assets/')));
app.use('/scripts', express.static(path.join(__dirname, '/scripts/')));
app.use('/public', express.static(path.join(__dirname, '/public/')));

// Route used when users select the 'make your own' templates button from the home page
app.get('/story', ensureAuthenticated, async(req, res) => {
    // Username is required, set a temp value for local testing
    if (process.env.LOCAL_TESTING){
        req.user = {username:'test'};     
    }
    
    let isResearcher = researchers.includes(req.user.username);

    logStoryStarted(req.user.username, req.i18n.getLocale(), isResearcher, "New Template");

    res.render('templates', {
        story_data:null,
    });
});

// Route used to play a make-your-own template story that a user saved previously
app.get('/get_story_content', ensureAuthenticated, async (req, res) => {
    // Indicated by selected title from list of saved stories 
    const story_id = req.query.id;

    // storyData is updated when users navigate to the home page
    if (req.session.storyData === null) {
        res.status(500).end();
    } else {
        let isResearcher = researchers.includes(req.user.username);

        logStoryStarted(req.user.username, req.i18n.getLocale(), isResearcher, req.session.storyData[story_id].storyType);
        
        res.render('templates', {
            story_data: JSON.stringify(req.session.storyData[story_id])
        });
    }
});

// Called when a user saves a template story
app.post('/record_user_stories', function(req, res) {
    // Update user stories if there is already a corresponding item in the DynamoDB table, otherwise insert new one
    const story_info = {
        "chosenCharacters": req.body.chosenCharacters,
        "chosenBackground": req.body.chosenBackground,
        "chosenObjects": req.body.chosenObjects,
        "storyDate": req.body.storyDate,
        "storyName": req.body.storyName,
        "storyType": req.body.storyType,
        "locale": req.i18n.locale
    };

    if (req.user != null || req.user.username != null) {
        var params = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username
            },
            UpdateExpression: "set UserStories = list_append(if_not_exists(UserStories, :empty_list), :S)",
            ExpressionAttributeValues: {
                ":S": [story_info],
                ":empty_list": []
            },
            ReturnValues: "UPDATED_NEW"
        };
        docClient.update(params, function(err, data) {
            if (err) {
                console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
            }
        })
    }

    res.status(200).send(false);
});

// Called when users delete a saved story made from a template
app.get('/delete_user_stories', function(req, res) {
    // Indicated by selected title from list of saved stories 
    const story_id = req.query.id;

    // storyData is updated when users navigate to the home page
    if (req.user != null) {
        var params = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username
            },
            UpdateExpression: "remove UserStories[" + story_id + "]",
            ReturnValues: "UPDATED_NEW"
        };
        docClient.update(params, function(err, data) {
            if (err) {
                console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
            }
        })
    }

    // After deleting saved story, reload home page to reflect changes
    res.redirect('/');
});

// Grabs authentication token and settings for polly use
// Needs AWS credentials to work, will not work in local testing without separate credentials
app.post('/polly', ensureAuthenticated, function(req, res) {
    // Message has to be encoded before being transmitted
    var encodedMessage = req.body.message;
    var message = "";
    var voice = req.body.voice;

    // Convert message back from hex
    for (let index = 0; index < encodedMessage.length - 1; index += 2){
        message += String.fromCharCode(parseInt(encodedMessage.substring(index, index + 2), 16));
    }

    // Set parameters
    var params = {
        OutputFormat: 'mp3',
        Text: message,
        TextType: "ssml",
        VoiceId: voice
    }

    // Generate audio file with AWS Polly, on success send the file back to caller
    Polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            res.status(500).end();
        } else if (data) {
            res.status(200).send(data)
        }
    })
});

// Logout - passport
app.get('/logout', function(req, res) {
    // Save language used in session
    let lang = req.session.locale;
    
    // TO-DO: debug req.logout -- suddenly stopped working on dev server
    // Clear user info from passport
    req.logout(function(err) {
        if (err) { 
            console.log("Error with req.logout");
            console.log(err); 
        }
        else {
            // Clear cookie
            res.clearCookie('connect.sid');
            // Destroy express session
            req.session.destroy(function (err){
                if (err){
                    console.log("Error with req.session.destroy");
                    console.log(err);
                }
                else{
                    // Redirect to cognito logout, takes user back to the sign in page
                    console.log("Redirecting to Cognito");
                    res.redirect(options['clientDomain'] + "/logout?client_id=" + options['clientID'] + "&logout_uri=" + process.env.HOME_ADDRESS + "?lang=" + lang);
                }
            } );
        }
        
      });
});

// Tutorial page
app.get('/tutorial', ensureAuthenticated, function(req, res) {
    res.render('tutorial', {
        // User and surveyID are only required the first time a parent visits the tutorial page
        // Those values get passed directly from role selection
        user: null,
        surveyID: null,
		role: req.session.userRole,
	    string: req.session.randomString
    });
});

// Premade stories -- title is passed as a URL parameter
app.get('/playStory', ensureAuthenticated, async(req, res) => {  
    if (process.env.LOCAL_TESTING){
        req.user = {username:'test'};     
    }

    let isResearcher = researchers.includes(req.user.username);
    let story = req.query.title.slice(0,-3);
    res.locals.translatedTitle = req.i18n.__(story);

    logStoryStarted(req.user.username, req.i18n.getLocale(), isResearcher, story); 
        
    res.render('premade', {
    });  

});

// Survey page
// Will not work for local testing without dummy data
// Makes a call to DynamoDB to figure out which surveys a user needs to take
app.get('/survey', ensureAuthenticated, qualtricsRequest, async (req, res) => {
    var newShown, weekShown, monthShown, usabilityShown;
    var newTaken, weekTaken, monthTaken, usabilityTaken;
    let surveyList = surveyIDs;
    if(req.session.locale == "es"){
        surveyList = surveyIDs_es;
    }

    req.session.surveysToTake = [];

    var params = {
        TableName: surveyTable,
        Key: {
            "user_id": req.user.username
        }
    };

    await docClient.get(params, async (err, data) => {

        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            if (typeof data.Item === 'undefined') {
                console.log("data was empty");
            } else {
                // Professionals do not have a demographic survey
                if(req.session.userRole == "Parent" || req.session.userRole == "User"){
                    newShown = data.Item.info.Demo.PrevDate; // date the demographic survey was shown
                }
                
                weekShown = data.Item.info.Weekly.PrevDate; // date the weekly survey popped up
                monthShown = data.Item.info.Monthly.PrevDate; // date the monthly survey popped up
                usabilityShown = data.Item.info.Usability.PrevDate; // date the usability survey popped up

                // Professionals do not have a demographic survey
                if(req.session.userRole == "Parent" || req.session.userRole == "User"){
                    newTaken = data.Item.info.Demo.LastTookDate; // date the demographic survey was last taken
                }
                weekTaken = data.Item.info.Weekly.LastTookDate; // date the weekly survey was last taken
                monthTaken = data.Item.info.Monthly.LastTookDate; // date the monthly survey was last taken
                usabilityTaken = data.Item.info.Usability.LastTookDate; // date the usability survey was last taken

                // Professionals do not have a demographic survey
                if(req.session.userRole == "Parent" || req.session.userRole == "User"){
                    // Check whether user needs to take demographic survey
                    if(new Date(newTaken) < new Date(newShown)){ 
                        req.session.surveysToTake.push("Demo");
                    }
                }
                // Check whether user needs to take weekly survey
                if(new Date(weekTaken) < new Date(weekShown)){
                    req.session.surveysToTake.push("Weekly");
                }
                // Check whether user needs to take monthly survey
                if(new Date(monthTaken) < new Date(monthShown)){
                    req.session.surveysToTake.push("Monthly");
                }
                // Check whether user needs to take usability survey
                if(new Date(usabilityTaken) < new Date(usabilityShown)){
                    req.session.surveysToTake.push("Usability");
                }
            }
        }
    }).promise();

    res.render('survey', {
        user: req.user.username,
        surveysToTake: req.session.surveysToTake,
        surveys: surveyList,
        role: req.session.userRole
    });
});

// The voice agent control interface
app.get('/voiceAgent', ensureAuthenticated, async function(req, res) {
    /* if (process.env.LOCAL_TESTING){
        req.user = {username:'test'};     
    } */

    // Used to get appropriate id for session survey -- accessed via a button at the bottom of the voice agent control page
    let surveyList = surveyIDs;
    if(req.session.locale == "es"){
        surveyList = surveyIDs_es;
    }

    // Testing -- moved to get the user role regardless of route
    var userRole = "User";
    let allowSavedText = false;
    if (process.env.LOCAL_TESTING){
        req.user = {username:'test'};
        userRole = "Professional";     
    }
    else{
        const param = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username,
            },
        };
        // Try to get the userRole

        await docClient.get(param, async (err, data) => {
            if (err) {
                console.log(err);
            } else {
                userRole = data.Item.userRole;
                if(data.Item.allowSavedText){
                    allowSavedText = data.Item.allowSavedText;
                }
            }
        }).promise();
    }

    // If users came from a story template, we want to reflect their choices in the speech suggestions
    if (req.query.story) {
        req.session.storyObj = JSON.parse(req.query.story);
        let chosenCharacters = [req.session.storyObj.char1, req.session.storyObj.char2, req.session.storyObj.char3, req.session.storyObj.char4];
        let isResearcher = researchers.includes(req.user.username);
        req.session.character1 = req.session.storyObj.char1;
        req.session.character2 = req.session.storyObj.char2;
        req.session.character3 = req.session.storyObj.char3;
        req.session.character4 = req.session.storyObj.char4;
        
        req.session.objects = req.session.storyObj.obj;
        req.session.objTypes = req.session.storyObj.types;
        req.session.background = req.session.storyObj.background;
        req.session.story = req.session.storyObj.storyType;

        const exploreANewPlace = req.i18n.__("Explore a New Place");
        const planAnEvent = req.i18n.__("Plan an Event");
        const whatIsThatNoise = req.i18n.__("What is That Noise?");
        const templates = [exploreANewPlace, planAnEvent, whatIsThatNoise];

        if (templates.includes(req.session.story)){
            // req.i18n is used to look up text in appropriate language
            const finderRole = req.i18n.__("I am the finder. I can find anything the group needs.");
            const makerRole = req.i18n.__("I am a maker. I can make anything new that our team needs.");
            const chefRole = req.i18n.__("I am the chef. I can gather and prepare any food we need.");
            const builderRole = req.i18n.__("I am the builder. I can build anything the group needs.");
            const healerRole = req.i18n.__("I am the healer. I can take care of anyone who is hurt or sick.");
            const dreamerRole = req.i18n.__("I am the dreamer. I have all the ideas for the group.");
            const muscleRole = req.i18n.__("I am the muscle. I am the strongest of the group.");
            const waterRole = req.i18n.__("I am the lord of the sea. I am the master of water.");
            const growerRole = req.i18n.__("I am a grower. I can grow anything that our team needs.");
            const fixerRole = req.i18n.__("I am a fixer. I can fix any broken thing.");
            const driverRole = req.i18n.__("I am a driver. I can drive any vehicle that we find.");
            var roleMap = {};
            roleMap[exploreANewPlace] = [finderRole, builderRole, chefRole, fixerRole];
            roleMap[planAnEvent] = [dreamerRole, chefRole, finderRole, driverRole];
            roleMap[whatIsThatNoise] = [chefRole, finderRole, builderRole, healerRole];
            req.session.role1 = roleMap[req.session.story][0];
            req.session.role2 = roleMap[req.session.story][1];
            req.session.role3 = roleMap[req.session.story][2];
            req.session.role4 = roleMap[req.session.story][3];
        }
        else {
            req.session.role1 = req.session.storyObj.role1;
            req.session.role2 = req.session.storyObj.role2;
            req.session.role3 = req.session.storyObj.role3;
            req.session.role4 = req.session.storyObj.role4;
        }

        // Log user selections
        const rows = [
            [req.user.username, req.i18n.getLocale(), isResearcher, userRole, new Date().toISOString(), req.session.storyObj.title, req.session.storyObj.background, chosenCharacters, req.session.storyObj.log, req.session.storyObj.playedSkippedSaved, req.session.storyObj.players, req.session.storyObj.chars]
        ];

        const headers = ["User", "Lang", "Researcher?", "Role",	"Date",	"Story", "ChosenBackground", "ChosenCharacters", "ChosenObjects", "Played/Skipped/Saved", "NumPlayers",	"CharactersPicked"];

        const filePath = path.join(__dirname, 'logs', 'completed-stories.csv');

        csv.writeToStream(fs.createWriteStream(filePath, { flags: 'a' }), rows, 
            {headers:headers, includeEndRowDelimiter:true, writeHeaders:false})
                .on('error', (err) => console.error(err))
                .on('finish', () => {
                    console.log('Appended story log');
                });
        res.redirect('/voiceAgent');
    } else {
		// If no story was previously played this session, default to the party story
        if(!req.session.story){
            // i18n calls get text from the appropriate dictionary based on the locale
            req.session.character1 = "Cat"; // character names always have to be passed in English
            req.session.character2 = "Monkey";
            req.session.character3 = "Bear";
            req.session.character4 = "Horse";
            req.session.role1 = req.i18n.__("I am the dreamer. I have all the ideas for the group.");
            req.session.role2 = req.i18n.__("I am the chef. I can gather and prepare any food we need.");
            req.session.role3 = req.i18n.__("I am the finder. I can find anything the group needs.");
            req.session.role4 = req.i18n.__("I am a driver. I can drive any vehicle that we find.");
            req.session.story = "Birthday Party"; // title always needs to be passed in English
        }
		
        req.session.charArray = [req.session.character1, req.session.character2, req.session.character3, req.session.character4];
        req.session.roleArray = [req.session.role1, req.session.role2, req.session.role3, req.session.role4];
        res.render('voiceAgent', {
            name: req.user.username,
            characters: req.session.charArray,
            roles: req.session.roleArray,
            object: req.session.objects,
            type: req.session.objTypes,
            background: req.session.background,
            story: req.session.story,
            surveys: surveyList,
			userRole: userRole,
            story_data: req.session.storyData,
            researchers: process.env.RESEARCHERS,
            checked: allowSavedText
        })
    }
});

app.post('/save_text', ensureAuthenticated, function(req, res) {
    let text = req.body.Text;
    const sub = req.session.token;
    const bucket = 'user-saved-text';
    const key = `cognito/storycarnival-public-client/${sub}`;
    const params = {Bucket:bucket, Key:key};
    console.log('Logged: ' + text);
});

// Appends a row to logs/agent-actions.csv each time a user presses a button, etc. on the voice agent page
app.post('/log_agent_action', ensureAuthenticated, function(req, res) {
    let action = req.body.action;
    const rows = [
        [req.body.user, req.body.lang, researchers.includes(req.body.user), new Date().toISOString(), action]
    ];
    
    const headers = ["User", "Lang", "Researcher?",	"Date",	"Action"];

    const filePath = path.join(__dirname, 'logs', 'agent-actions.csv');

    csv.writeToStream(fs.createWriteStream(filePath, { flags: 'a' }), rows, 
        {headers:headers, includeEndRowDelimiter:true, writeHeaders:false})
            .on('error', (err) => console.error(err))
            .on('finish', () => {
                console.log('Appended agent log');
                res.status(200).send();
            });
});

// Update a user's stored preferences in DynamoDB
app.get('/update_preferences', ensureAuthenticated, function(req, res) {
    if (req.user != null || req.user.username != null) {
        var params = {
            TableName: usersTable,
            Key: {
                "user_id": req.user.username
            },
            UpdateExpression: "set PreferLanguage = :l",
            ExpressionAttributeValues: {
                ":l": req.query.language
            },
            ReturnValues: "UPDATED_NEW"
        };
        docClient.update(params, function(err, data) {
            if (err) {
                console.log("Unable to update item. Error JSON:" + JSON.stringify(err, null, 2));
            }
        })
    }

    res.redirect('/');
});

// Makes request to the API Gateway to fetch new survey responses from Qualtrics
function qualtricsRequest(req, res, next){
  // Skip if testing locally
  if (process.env.LOCAL_TESTING){
    return next();
  }
  
  else {
    var config = {
        method: 'get',
        url: process.env.API_GATEWAY,
        headers: { }
      };
      
      axios(config)
      .then(function (response) {
        return next();
      })
      .catch(function (error) {
        console.log(error);
        return next();
      });
  }
    
}

// Get the difference between timestamps in months
function diff_months(dt2, dt1) {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24 * 7 * 4);
    return Math.abs(diff);

}

// Get the difference between timestamps in weeks
function diff_weeks(dt2, dt1) {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24 * 7);
    return Math.abs(diff);

}
async function addObjectToS3(params, text) {
    try{
        await s3.headObject(params).promise();
        const object = await s3.getObject(params).promise();
        params.Body = object.Body.toString() + text;
        await s3.upload(params).promise();
    } catch (err){
        if(err.code === 'NotFound') {
            params.Body = text;
            await s3.upload(params).promise();
        } else {
            throw err;
        }
    }
}
// Middleware executed each time a user logs into storycarnival
async function loginTime(req, res, next) {
    // Set session variables
    req.session.surveyCheck = "none";

    // Language preference may be obsolete now
    // TO-DO: test language preference
    let language = "English";
    let userRole = "User";
    let timestamp = new Date().toISOString();
    let randomString = crypto.randomBytes(20).toString('hex');
    var params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username,
        },
	    UpdateExpression: 'SET CreatedAt = if_not_exists(CreatedAt, :ca), PreferLanguage = if_not_exists(PreferLanguage, :l), userRole = if_not_exists(userRole, :r), Sent = if_not_exists(Sent, :rs), allowSavedText = if_not_exists(allowSavedText, :t)',
        ExpressionAttributeValues: {
            ':ca': timestamp,
            ':l': language,
            ':r': userRole,
	        ':rs': randomString,
            ':t': false
        },
        ReturnValues: "UPDATED_NEW"
    };
    
    try{
        var updated = await docClient.update(params).promise();
        console.log("Successfully updated:", updated);
    }
    catch(err){
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    }
    
    // Query user table to get user role and set session variable
    params = {
        TableName: usersTable,
        Key: {
            "user_id": req.user.username
        }
    };
    
    var userdata = null;
    try{
        userdata = await docClient.get(params).promise();
        req.session.userRole = userdata.Item.userRole;
	    req.session.randomString = userdata.Item.Sent;
    }
    catch(err){
        console.error("Unable to get item. Error JSON:", JSON.stringify(err, null, 2));
    }

    var userTimeNew, userTimeWeek, userTimeMonth, userTimeUsability; // Dates surveys were shown to user
    var userTimeTookNew, userTimeTookWeek, userTimeTookMonth, userTimeTookUsability; // Dates of most recent survey responses

    var time = new Date().toISOString(); // Current date
    var offsetTime = new Date();
    offsetTime = new Date(offsetTime.setDate(offsetTime.getDate() - 14));
    offsetTime = offsetTime.toISOString(); // Date two weeks ago, used to stagger survey dates
	
    params = {
        TableName: surveyTable,
        Key: {
            "user_id": req.user.username
        }
    };
    var dataobj = null; // Survey response information of the user
	try{
		dataobj = await docClient.get(params).promise();
	}
	catch(err){
		console.error("Unable to get item. Error JSON:", JSON.stringify(err, null, 2));
	}
	
    // Check if the person is a new user that doesn't have survey information
    if (typeof dataobj.Item != 'undefined') {
		req.session.returningUser = true;
		
        // Get values from survey table
        // Professionals do not have a demographic survey
        if (req.session.userRole == "Parent"){
            userTimeNew = dataobj.Item.info.Demo.PrevDate;
            userTimeTookNew = dataobj.Item.info.Demo.LastTookDate;
        }
        userTimeWeek = dataobj.Item.info.Weekly.PrevDate;
        userTimeTookWeek = dataobj.Item.info.Weekly.LastTookDate;
		userTimeMonth = dataobj.Item.info.Monthly.PrevDate;
		userTimeTookMonth = dataobj.Item.info.Monthly.LastTookDate;
        userTimeUsability = dataobj.Item.info.Usability.PrevDate;
		userTimeTookUsability = dataobj.Item.info.Usability.LastTookDate;
        
        // Check how much time has elapsed since surveys were last shown
        var monthCheck = diff_months(new Date(userTimeMonth), new Date(time));
		var weekCheck = diff_weeks(new Date(userTimeWeek), new Date(time));
		var usabilityCheck = diff_months(new Date(userTimeUsability), new Date(time));

        // Check whether at least a month has passed since monthly survey was last shown
        if (monthCheck >= 1){
            // If so, it's time to show the monthly survey again
            req.session.surveyCheck = "Monthly";
            userTimeMonth = time;
        }
        // Otherwise, check whether at least a month has passed since the usability survey was last shown
        // The usability survey is first shown after 2 weeks, because of staggered start date
        else if (usabilityCheck >= 1){
            // If so, it's time to show the usability survey again
            req.session.surveyCheck = "Usability";
            userTimeUsability = time;
        }
        // Otherwise, check whether at least a week has passed since the weekly survey was last shown
        else if (weekCheck >= 1){
            // If so, it's time to show the weekly survey again
            req.session.surveyCheck = "Weekly";
            userTimeWeek = time;
        }

        // Update the survey table
        // Professionals do not have a demographic survey
        if (req.session.userRole == "Parent"){
            params = {
                TableName: surveyTable,
                Item: {
                    "user_id": req.user.username,
                    "info": {
                        "Demo": {
                            PrevDate: userTimeNew,
                            LastTookDate: userTimeTookNew
                        },
                        "Monthly": {
                            PrevDate: userTimeMonth,
                            LastTookDate: userTimeTookMonth
                        },
                        "Weekly": {
                            PrevDate: userTimeWeek,
                            LastTookDate: userTimeTookWeek
                        },
                        "Usability": {
                            PrevDate: userTimeUsability,
                            LastTookDate: userTimeTookUsability
                        }
                    }
                }
            };
        }
        else {
            params = {
                TableName: surveyTable,
                Item: {
                    "user_id": req.user.username,
                    "info": {
                        "Monthly": {
                            PrevDate: userTimeMonth,
                            LastTookDate: userTimeTookMonth
                        },
                        "Weekly": {
                            PrevDate: userTimeWeek,
                            LastTookDate: userTimeTookWeek
                        },
                        "Usability": {
                            PrevDate: userTimeUsability,
                            LastTookDate: userTimeTookUsability
                        }
                    }
                }
            };
        }

        await docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        }).promise();
        
	}

    return next();
}

// Simple route middleware to ensure user is authenticated. Use this route middleware on any resource that needs to be protected.
// If the request is authenticated (via a persistent login session), the request will proceed.
// Otherwise, the user will be redirected to the home page for login.
function ensureAuthenticated(req, res, next) {
   // If testing locally, treat as if the user is authenticated
    if (process.env.LOCAL_TESTING || req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/unauthorized');
    } 
}

// Called by cron job -- at regular intervals, log files are uploaded to S3 storage
function uploadLogFile(folder, filename){
    if ("S3_BUCKET" in process.env){
        let bucket = process.env.S3_BUCKET + folder;
        var uploadParams = {Bucket: bucket, Key: '', Body: ''};
        var file = path.join(__dirname, 'logs', filename);
        // Configure the file stream and obtain the upload parameters
        var fileStream = fs.createReadStream(file);
        fileStream.on('error', function(err) {
            console.log('File Error', err);
        });
        uploadParams.Body = fileStream;
        uploadParams.Key =filename;

        // call S3 to retrieve upload file to specified bucket
        s3.upload (uploadParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } if (data) {
            console.log("Upload Success", data.Location);
        }
        });
    }
}

// Called to log information about stories selected by users (even if they are not read through entirely)
function logStoryStarted(user, lang, researcher, story){
    const rows = [
        [user, lang, researcher, new Date().toISOString(), story]
    ];

    const headers = ["User", "Lang", "Researcher?",	"Date",	"Story"];

    const filePath = path.join(__dirname, 'logs', 'started-stories.csv');

    csv.writeToStream(fs.createWriteStream(filePath, { flags: 'a' }), rows, 
        {headers:headers, includeEndRowDelimiter:true, writeHeaders:false})
            .on('error', (err) => console.error(err))
            .on('finish', () => {
                console.log('Appended story log');
            });
}

// Catch 404 (page not found) and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', {
        message: res.locals.message,
        error: res.locals.error
    });
});

module.exports = app;

