/*
 * Globals. Haters gonna hate.
 *
 *   "AHHHH, WHYYYYY???!?" - Abby
 */

express = require("express");        // route-a-ma-jigs

var MongoStore = require('connect-mongo')(express),
		mongoose = require('mongoose'),
		models = require('./models'),
		dotenv = require('dotenv');

app = express();                    // init app obj
dotenv.load();                      // My secret environment variables

mongoUri = process.env.MONGOLAB_URI
    || process.env.MONGOHQ_URL
    || 'mongodb://127.0.0.1:27017/test';

MongoClient = require('mongodb').MongoClient;           // database client
database = null;                                        //going to populate this with a persistent db connection

passport = require('passport');        // user authentication
LocalStrategy = require('passport-local').Strategy; // REALTALK: I 'unno, the internet said to do this. - Bill
GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
var GITHUB_TOKEN = process.env.GITHUB_TOKEN;


//setup user model
models.defineModels(mongoose, function() {
	app.users = Users = mongoose.model('Users');
	mongoose.connect(mongoUri, function(err) {
	if (err)
		console.log('Database connection failed - ', err);
	});
	mongoose.connection.on("open", function() {
		console.log("Connected to users schema");
		Users.count({}, function(err, count) {console.log("Records: ", count);});
	});
});

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
app.use(express.session({
  store: new MongoStore({
    url: mongoUri
  }),
  secret: process.env.MONGO_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

// Load our routes
require('./routes.js');



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
if(GITHUB_TOKEN){
	github.authenticate({
			type: "oauth",
			token: GITHUB_TOKEN
	});
}

/* Github authentication */

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK || "http://localhost:5000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			console.log('User profile after github login - ', profile);
			profile.token = accessToken;
			github.authenticate({
				type: "oauth",
				token: accessToken
			});

			Users.findOne({'githubId': profile.username}, function(err, user) {
				console.log('Error any - ', err);
				if(err) { // OAuth error
					return done(err);
				} else if (user) { // User record in the database

					// update information from github
					user.avatar_url = profile._json.avatar_url;
					user.token = profile.token;
					user.company = profile._json.company;
					user.location = profile._json.location;
					user.email = profile._json.email;
          user.name = profile._json.name || profile.username;

					user.save();
					return done(null, user);
				} else { // record not in database
					var reg = new Users({
						name: profile._json.name || profile.username,
						email: profile._json.email,
						githubId: profile.username,
						company: profile._json.company,
						location: profile._json.location,
						token: profile.token,
						avatar_url: profile._json.avatar_url
					});
					reg.save();
					return done(null, reg);
				}
			})
		});
  }
));


// Passport session setup.
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