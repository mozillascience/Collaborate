/*
 * Globals. Haters gonna hate.
 */

express = require("express");		// route-a-ma-jigs
session = require('express-session');
RedisStore = require('connect-redis')(session);
app = express();					// init app obj

/*
mongo = require('mongodb'); 		// database
mongoUri = process.env.MONGOLAB_URI 
	|| process.env.MONGOHQ_URL 
	|| 'mongodb://127.0.0.1:27017/test';
*/
ObjectID = require('mongodb').ObjectID;					// tool for reconstructing mongo-style ids out of their hex encodings
MongoClient = require('mongodb').MongoClient;           // database client
database = null;                                        //going to populate this with a persistent db connection

passport = require('passport');		// user authentication
LocalStrategy = require('passport-local').Strategy; // REALTALK: I 'unno, the internet said to do this. - Bill

bcrypt = require('bcrypt');			// hashes passwords before putting them in DB
SALT_WORK_FACTOR = 10;				// how many times to scramble a pass before returning the final hash?

mail = require("nodemailer");	// handles sending mail from the server side - no emails exposed in browser

smtpTransport = mail.createTransport("SMTP",{	//transport service for nodemailer
    service: "Gmail",
    auth: {
        user: "xxx",
        pass: "xxx"
    }
});

minify = require('express-minify');		//minification tool

require('./options.js');			// all the arrays of profile options - TODO name this file something more specific
helpers = require('./helpers.js');			// some generic helper functions
cleanCase = helpers.cleanCase;

mongoHelpers = require('./mongoHelpers.js');                    //helper functions for interacting with mongo
connect = mongoHelpers.connect;

// setup the app
app.set('views', __dirname + '/views');
app.use(minify({
    js_match: /javascript/,
    css_match: /css/
}));
app.use('/static', express.static(__dirname + '/static'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'j4IjCQtMcWTsahgMCFCS' }));  //TODO get this out of the public repo lulz
app.use(passport.initialize());
app.use(passport.session());
app.use(session({ store: new RedisStore(), secret: 'keyboard cat' }))

// Load our routes
require('./routes.js');

/*
 * User Authentication Config
 */

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
			    		return done(null, false, { message: 'Email not found.' });
			    	}
				    bcrypt.compare(password, user.Pass, function(err, isMatch) {
				    	if(err){
							console.log('Login password validation failure')
							console.log(err)
						}
				        if(isMatch)
					        return done(null, user)
					    else
					    	return done(null, false, { message: 'Bad Password.' });
				    });
			    });
			});
		});
    })
);

// passport serialize / deserialize magics
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