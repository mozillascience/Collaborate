////////////////////////////////////////////////////
//setup/////////////////////////////////////////////
////////////////////////////////////////////////////
var express = require("express"),
	logfmt = require("logfmt"),
	mongo = require('mongodb'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10,
    mail = require("nodemailer").mail,
	app = express(),
	mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL ||
  		'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917';

//set up the app
app.set('views', __dirname + '/views');
app.use(express.static(__dirname));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'SECRET' }));
app.use(passport.initialize());
app.use(passport.session());

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
			        return done(null, user)
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

/////////////////////////////////////////////////////
//get requests///////////////////////////////////////
/////////////////////////////////////////////////////

//landing page
app.get('/', function(req, res) {
	res.render('login.jade', {loginMessage: null, registerMessage: null});
});

//landing page - bad user / pass combo
app.get('/badCredentials', function(req, res){
	res.render('login.jade', {loginMessage: 'Whooops!  Bad user / pass combo, try again plz:', registerMessage: null})
});

//landing page - username already taken
app.get('/userTaken', function(req, res){
	res.render('login.jade', {loginMessage: null, registerMessage: 'Too late!  That username is already taken - choose again!'})
});

//main page
app.get('/passedLogin', function(req, res) {
	res.render('index.jade', {name: req.user.uName});
});

//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////

//validate login attempt
app.post('/login', passport.authenticate('local', { successRedirect: '/passedLogin', failureRedirect: '/badCredentials'}) );

//register a new user
app.post('/regUser', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.render('error.jade');
		    	//make sure the password was entered correctly twice
		    	if(req.body.pass != req.body.repass) return res.render('login.jade');
	
				//reject new account if the username is already taken	    	
		    	collection.find({uName: req.body.uName}).toArray(function(err, accounts){
		    		if(accounts.length != 0) return res.redirect('/userTaken');

			        // hash the password along with our new salt:
			        bcrypt.hash(req.body.pass, salt, function(err, hash) {
			        	if(err) return res.render('error.jade');

		        		//register new user in the db:
						collection.insert({'uName': req.body.uName, 'Pass': hash}, {safe: true}, function(er,rs) {});

						//log the new user in:
						collection.findOne({uName: req.body.uName}, function(err, user){
							if(err) return res.render('error.jade');

							req.login(user, function(err) {
							  if (err) return res.render('error.jade');
							  return res.redirect('/passedLogin');
							});
						});
						
			        });
		    	});
		    });
		});
	});
});

app.post('/forgotPass', function(req, res){

	res.render('recoverPassword.jade');

});

app.post('/emailNewPassword', function(req, res){

	//open link to the database
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.body.username }, function(err, user){
				var newPass;

		    	if (err) return res.render('error.jade');
		    	if (!user)
		    		return res.render('error.jade');

		    	//generate a new password, bunch of random characters
		    	newPass = (Math.random() + 1).toString(36);

			    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			    	if(err) return res.render('error.jade');

				        // hash the password along with our new salt:
				        bcrypt.hash(newPass, salt, function(err, hash) {
				        	if(err) return res.render('error.jade');

				        	//update db
				        	collection.update({uName : user.uName}, {$set:{Pass : hash}}, function(){});
							
				        });
			    });

				mail({
				    from: "Fred Foo <foo@blurdybloop.com>", // sender address
				    to: "herpderp, mills.wj@gmail.com", // list of receivers
				    subject: "Hello", // Subject line
				    text: newPass // plaintext body
				});

				res.redirect('/')
			});
		});
	});
})






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