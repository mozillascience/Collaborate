////////////////////////////////////////////////////
//setup/////////////////////////////////////////////
////////////////////////////////////////////////////

//globals///////////////////////////////////////////
express = require("express"),		//express
mongo = require('mongodb'),			//database
passport = require('passport'),		//handles user authentication
LocalStrategy = require('passport-local').Strategy,
bcrypt = require('bcrypt'),			//hashes passwords before putting them in DB
SALT_WORK_FACTOR = 10,				//how many times to scramble a pass before returning the final hash?
mail = require("nodemailer").mail,	//handles sending mail from the server side - no emails exposed in browser
app = express(),
mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL ||
  	'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917',
searchBuffer = {}, 					//namespace to hold user searches
matchBuffer = {}, 					//namespace to hold user matches
options = require('./options.js'),
//don't want to carry the options. prefix around forever:
disciplines = options.disciplines,
languages = options.languages;

//set up the app
app.set('views', __dirname + '/views');
app.use(express.static(__dirname));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'j4IjCQtMcWTsahgMCFCS' }));
app.use(passport.initialize());
app.use(passport.session());

//attatch the routes to the app object
require('./routes');

//////////////////////////////////////////////////////
//user auth///////////////////////////////////////////
//////////////////////////////////////////////////////

//configure the passport authentication
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

//passport serialize / deserialize magics
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {

	done(null, obj);
});

////////////////////////////////////////////////////////
//start serving/////////////////////////////////////////
////////////////////////////////////////////////////////
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});