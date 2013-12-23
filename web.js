// require all the things
var express = require("express");
var logfmt = require("logfmt");
var mongo = require('mongodb');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;
var app = express();

//point at the DB
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917';

//set up the app
app.set('views', __dirname + '/views');
app.use(express.static(__dirname));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'SECRET' }));
app.use(passport.initialize());
app.use(passport.session());

//configure the passport authentication
passport.use(new LocalStrategy(
  function(username, password, done) {

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {
		    collection.findOne({ uName: username }, function(err, user) {
		    	if (err) { return done(err); }
		    	if (!user) {
		    		return done(null, false, { message: 'Incorrect username.' });
		    	}

			    bcrypt.compare(password, user.Pass, function(err, isMatch) {
			        if (err) res.render('login.jade');
			        return done(null, isMatch)
			    });
		    });
		});
	});
  }
));

//passport serialize / deserialize magics
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//landing page
app.get('/', function(req, res) {
	res.render('login.jade');
});

//main page
app.get('/passedLogin', function(req, res) {
	res.render('index.jade', {name: req.user.uName});
});

//validate login attempt
app.post('/login',
 	passport.authenticate('local', { successRedirect: '/passedLogin', failureRedirect: '/'})
);









app.post('/regUser', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) res.render('login.jade');
		        // hash the password along with our new salt
		        bcrypt.hash(req.body.pass, salt, function(err, hash) {
		        	if(err) res.render('login.jade');
					collection.insert({'uName': req.body.uName, 'Pass': hash}, {safe: true}, function(er,rs) {});
					res.render('index.jade', {name: req.user.uName});
		        });
		    });
		});
	});
});

app.post('/dinoStart', function(req, res){

	res.render('dinoInput.jade', {});

});

app.post('/roboStart', function(req, res){

	res.render('roboInput.jade', {});

});

app.post('/dinoSubmit', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('dinos', function(er, collection) {
			collection.insert({'Name': req.body.Name, 'Feature': req.body.feature, 'Wants': req.body.wants}, {safe: true}, function(er,rs) {});
		});
	});

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('robos', function(er, collection) {
			collection.find({Language : req.body.wants}).toArray(function(err, robos){

				if(robos.length == 0)
					res.render('dinoReport.jade', {name: 'Sorry friend, no one matches your dino demands :('})
				else if (robos.length == 1)
					res.render('dinoReport.jade', {name: robos[0].Name+' is perfect for you!'})
				else
					res.render('dinoReport.jade', {name: 'there are so many matches you dont even know'})

			});
		});
	});

});

app.post('/roboSubmit', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('robos', function(er, collection) {
			collection.insert({'Name': req.body.Name, 'Language': req.body.language, 'Wants':req.body.wants}, {safe: true}, function(er,rs) {});
		});
	});

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('dinos', function(er, collection) {
			collection.find({Feature : req.body.wants}).toArray(function(err, dinos){							

				if(dinos.length == 0)
					res.render('dinoReport.jade', {name: '404: NO DINOS FOUND, CONTACT YOUR DINO PROVIDER'})
				else if (dinos.length == 1)
					res.render('dinoReport.jade', {name: dinos[0].Name+' satisfies all criteria.'})
				else
					res.render('dinoReport.jade', {name: 'TOO MANY MATCHES, DINO OVERFLOW'})

			});
		});
	});

});

app.post('/home', function(req, res) {
	res.render('index.jade', {name: req.user.uName});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});