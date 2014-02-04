/*
 * Globals. Haters gonna hate.
 */

express = require("express");		// route-a-ma-jigs
app = express();					// init app obj

mongo = require('mongodb'); 		// database
mongoUri = process.env.MONGOLAB_URI 
	|| process.env.MONGOHQ_URL 
	|| 'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917';

passport = require('passport');		// user authentication
LocalStrategy = require('passport-local').Strategy; // REALTALK: I 'unno, the internet said to do this. - Bill

bcrypt = require('bcrypt');			// hashes passwords before putting them in DB
SALT_WORK_FACTOR = 10;				// how many times to scramble a pass before returning the final hash?

mail = require("nodemailer").mail;	// handles sending mail from the server side - no emails exposed in browser

searchBuffer = {}; 					// namespace to hold user searches
matchBuffer = {}; 					// namespace to hold user matches
require('./options.js');			// all the arrays of profile options - TODO name this file something more specific

// setup the app
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/static'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'j4IjCQtMcWTsahgMCFCS' }));  //TODO get this out of the public repo lulz
app.use(passport.initialize());
app.use(passport.session());

// Load our routes
require('./routes.js');

/*
 * User Authentication Config
 */

// configure the passport authentication
passport.use(new LocalStrategy(
    function(username, password, done) {
		mongo.Db.connect(mongoUri, function(err, db) {
			db.collection('Users', function(er, collection) {
			    collection.findOne({ uName: username }, function(err, user) {
			    	if (err) return res.render('error.jade');
			    	if (!user) {
			    		return done(null, false, { message: 'Incorrect username.' });
			    	}
				    bcrypt.compare(password, user.Pass, function(err, isMatch) {
				        if (err) res.render('error.jade');
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