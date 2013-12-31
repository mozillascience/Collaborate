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
			        if(isMatch)
				        return done(null, user)
				    else
				    	return done(null, false, { message: 'Bad Password.' });
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

//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//set up a new user profile
app.get('/setupNewUser', function(req, res){

	res.render('chooseClass.jade', {});

});

app.get('/searchResults', function(req, res){

	res.render('searchResults.jade', {searchResults: searchBuffer, page: req.query.page, nPages: Math.ceil(searchBuffer.length/10)} );

});

//user profile page
app.get('/userProfile', function(req, res){

	var i,
		user = JSON.parse(JSON.stringify(req.user));

	//break checkbox groups out into booleans to smooth things out on the Jade side:
	for(i=0; i<user.language.length; i++){
		user[user.language[i]] = true;
	}
	for(i=0; i<user.discipline.length; i++){
		user[user.discipline[i]] = true;
	}
	delete user.language;
	delete user.discipline;

	res.render('userProfile.jade', {user: user});

});

app.get('/userMatches', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {	    	
	    	collection.find( {scientist: req.user.developer, language : {$in: req.user.language}, discipline : {$in: req.user.discipline}} ).toArray(function(err, matches){
	    		matchBuffer = matches;
	    		res.render('userMatches.jade', {match: matches, page: req.query.page, nPages: Math.ceil(matchBuffer.length/10)} );
	    		//res.redirect('/searchResults?page=0' );

	    	});
		});
	});

});

//search page
app.get('/userSearch', function(req, res){

	res.render('userSearch.jade');

});

////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////

//validate login attempt
app.post('/login', passport.authenticate('local', { successRedirect: '/userMatches', failureRedirect: '/badCredentials'}) );

//register a new user
app.post('/regUser', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.render('error.jade');
		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.render('login.jade');
	
				//reject new account if the username is already taken	    	
		    	collection.find({uName: req.body.uName}).toArray(function(err, accounts){
		    		if(accounts.length != 0) return res.redirect('/userTaken');

			        // hash the password along with our new salt:
			        bcrypt.hash(req.body.pass, salt, function(err, hash) {
			        	if(err) return res.render('error.jade');

		        		//register new user in the db:
						collection.insert({'uName': req.body.uName, 'Pass': hash}, {safe: true}, function(err,res) {});

						//log the new user in:
						collection.findOne({uName: req.body.uName}, function(err, user){
							if(err) return res.render('error.jade');

							req.login(user, function(err) {
							  if (err) return res.render('error.jade');
							  return res.redirect('/setupNewUser');
							});

						});
			        });
		    	});
		    });
		});
	});
});

//register user as scientist and go to new scientist setup page
app.post('/newScientist', function(req, res){

	//open link to the database
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.user.uName }, function(err, user){

		    	if (err || !user) return res.render('error.jade');

                //update the local user object
                req.user.scientist = true;
                req.user.developer = false;

		    	collection.update(	{uName : user.uName}, 
		    						{$set:{ scientist: true,
		    								developer: false}
		    						}, 
		    						function(){
										  return res.render('setupUser.jade', {user:req.user});
		    						});
			});
		});
	});
});

//register user as developer and go to new developer setup page
app.post('/newDeveloper', function(req, res){

	//open link to the database
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.user.uName }, function(err, user){

		    	if (err || !user) return res.render('error.jade');

                //update the local user object
                req.user.scientist = false;
                req.user.developer = true;

                //write the new data to the DB and carry on to user setup
		    	collection.update(	{uName : user.uName}, 
		    						{$set:{ scientist: false,
		    								developer: true}
		    						}, 
		    						function(){
										  return res.render('setupUser.jade', {user:req.user});
		    						});
			});
		});
	});
});

//update a user's profile
app.post('/recordUpdate', function(req, res){

	//open link to the database
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.user.uName }, function(err, user){

		    	if (err || !user) return res.render('error.jade');

		    	//update the local user object
		    	req.user.discipline = req.body.discipline;
		    	req.user.language = req.body.language;

		    	//update the DB and carry on to main user pages
		    	collection.update(	{uName : user.uName}, 
		    						{$set:{	discipline : req.body.discipline, 
		    								language : req.body.language}
		    						}, 
		    						function(){
										return res.redirect('/userMatches');									
		    						});
			});
		});
	});	
});

//go to the password recovery page
app.post('/forgotPass', function(req, res){

	res.render('recoverPassword.jade');

});

//password recovery - generate a random password, hash it, update the db, and mail it to the user
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
});

//go to the change password form
app.post('/changePasswordForm', function(req, res){

	return res.render('changePassword.jade');

});

//validate and register the new password
app.post('/updatePassword', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {
		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.render('error.jade');
		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.render('changePassword.jade');

		        // hash the password along with our new salt:
		        bcrypt.hash(req.body.pass, salt, function(err, hash) {
		        	if(err) return res.render('error.jade');

	        		//register new password in the db:
	        		collection.update({uName : req.user.uName}, {$set:{Pass : hash}}, function(){
	        			return res.redirect('/userMatches');
	        		});
		        });
		    });
		});
	});
});

//delete the profile of the currently logged in user
app.post('/deleteProfile', function(req, res){

	//open link to the database
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.user.uName }, function(err, user){

		    	if (err || !user) return res.render('error.jade');

		    	//logout
		    	req.logout();

		    	//dump user from DB and return to landing page:
		    	collection.remove({uName : user.uName}, true, function(){
		    		return res.redirect('/');
		    	});									
			});
		});
	});	
});

app.post('/search', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('Users', function(er, collection) {	
			var scientist = (req.body.profession == 'scientist') ? true : false;

	    	collection.find( {scientist: scientist, language : {$in: req.body.language}, discipline : {$in: req.body.discipline}} ).toArray(function(err, matches){
	    		searchBuffer = matches;
	    		res.redirect('/searchResults?page=0' );

	    	});
		});
	});

});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});