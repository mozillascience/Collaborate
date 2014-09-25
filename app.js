/*
 * Globals. Haters gonna hate.
 *
 *   "AHHHH, WHYYYYY???!?" - Abby
 */

express = require("express");        // route-a-ma-jigs
var MongoStore = require('connect-mongo')(express);
app = express();                    // init app obj

var dotenv = require('dotenv');
dotenv.load();

mongo = require('mongodb');         // database
mongoUri = process.env.MONGOLAB_URI
    || process.env.MONGOHQ_URL
    || 'mongodb://127.0.0.1:27017/test';

ObjectID = require('mongodb').ObjectID;                 // tool for reconstructing mongo-style ids out of their hex encodings
MongoClient = require('mongodb').MongoClient;           // database client
database = null;                                        //going to populate this with a persistent db connection

passport = require('passport');        // user authentication
LocalStrategy = require('passport-local').Strategy; // REALTALK: I 'unno, the internet said to do this. - Bill
GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
var GITHUB_TOKEN = process.env.GITHUB_TOKEN;

bcrypt = require('bcrypt');            // hashes passwords before putting them in DB
SALT_WORK_FACTOR = 10;                // how many times to scramble a pass before returning the final hash?


mail = require("nodemailer");    // handles sending mail from the server side - no emails exposed in browser

smtpTransport = mail.createTransport("SMTP",{    //transport service for nodemailer
    service: "Gmail",
    auth: {
        user: "interdisciplinaryprogramming@gmail.com",
        pass: "***"
    }
});


minify = require('express-minify');        //minification tool

require('./options.js');            // all the arrays of profile options - TODO name this file something more specific
helpers = require('./helpers.js');            // some generic helper functions
cleanCase = helpers.cleanCase;

//no need for db in static pilot page
mongoHelpers = require('./mongoHelpers.js');                    //helper functions for interacting with mongo
connect = mongoHelpers.connect;

// Github
var GitHubApi = require("github");

github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    // debug: true,
    protocol: "https",
    host: "api.github.com",
    timeout: 5000
});

// OAuth2
github.authenticate({
    type: "oauth",
    token: GITHUB_TOKEN
});



// setup the app
app.set('views', __dirname + '/views');
app.use(express.compress());
app.use(minify({
    js_match: /javascript/,
    css_match: /css/
}));
app.use('/static', express.static(__dirname + '/static'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.session({
  store: new MongoStore({
    url: mongoUri
  }),
  secret: process.env.MONGO_SECRET
}));

// Load our routes
require('./routes.js');

//no users in static pilot
/*
 * User Authentication Config
 */
/*
// configure the passport authentication
passport.use(new LocalStrategy(
    function(email, password, done) {
        connect(function(err, db) {
            if(err){
                console.log('Login connect failure')
                console.log(err)
            }
            db.collection('Users', function(er, collection) {
                if(er){
                    console.log('Login database connection failure')
                    console.log(er)
                }
                collection.findOne({ email: email }, function(err, user) {
                    if(err){
                        console.log('Login database lookup failure')
                        console.log(err)
                    }
                    if (!user) {
                        console.log('Email not found :(')
                        return done(null, false, { message: 'Email not found.' });
                    }
                    bcrypt.compare(password, user.Pass, function(err, isMatch) {
                        if(err){
                            console.log('Login password validation failure')
                            console.log(err)
                        }
                        if(isMatch)
                            return done(null, user)
                        else{
                            console.log('Bad password :(')
                            return done(null, false, { message: 'Bad Password.' });
                        }
                    });
                });
            });
        });
    })
);
*/

/* Github authentication */

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
		// console.log(profile);
		// asynchronous verification, for effect...
		// process.nextTick(function () {
		// 	// To keep the example simple, the user's GitHub profile is returned to
		// 	// represent the logged-in user. In a typical application, you would want
		// 	// to associate the GitHub account with a user record in your database,
		// 	// and return that user instead.
		// 	return done(null, profile);
		// });
  }
));


// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete GitHub profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});


/*
 * START SERVING DELICIOUS INTERNETS
 * A PROGRAMMER IS YOU!
 */

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});