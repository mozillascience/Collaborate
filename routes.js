require('./models/users.js');

/*
 * GET Requests
 */

app.get('/', function(req, res){
	app.userModel.getMostRecent(res);
});

//show login page
app.get('/login', function(req, res) {
	var loginError = null;

	if(req.query.loginError == 1)
		loginError = 'Whooops!  Bad user / pass combo, try again plz:';

	res.render('auth/login.jade', {loginMessage: loginError})
});

//show registration page
app.get('/register', function(req, res){
	res.render('registration/register.jade', {disciplines: disciplines, languages: languages, user:{}});
});

//show page to set up a new user profile
app.get('/setupNewUser', function(req, res){

	res.render('registration/chooseClass.jade', {});

});

//show a page of search results
app.get('/searchResults', function(req, res){

	res.render('search/searchResults.jade', {	searchResults: searchBuffer[req.user['_id']], 
										page: req.query.page, 
										nPages: Math.ceil(searchBuffer[req.user['_id']].length/10), 
										hasContacted: req.user.hasContacted} );
});

//user profile page
app.get('/userProfile', function(req, res){
	res.render('user/userProfile.jade', {user: req.user, disciplines: disciplines, languages: languages});

});

//show the first 10 user matches, with links to subsequnt batches of 10
app.get('/userMatches', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {	    	
	    	collection.find( {scientist: req.user.developer, language : {$in: req.user.language}, discipline : {$in: req.user.discipline}} ).toArray(function(err, matches){
	    		matchBuffer[req.user['_id']] = matches;
	    		res.render('user/userMatches.jade', {match: matches, 
	    										page: req.query.page, 
	    										nPages: Math.ceil(matchBuffer[req.user['_id']].length/10),
	    										hasContacted: req.user.hasContacted});
	    	});
	    });
	});
});


//search page
app.get('/userSearch', function(req, res){

	res.render('search/userSearch.jade', {languages: languages, disciplines: disciplines});

});

//view another user's profile
app.get('/viewProfile', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
	    	collection.findOne( {uName: req.query.userID}, function(err, user){
	    		res.render('user/profile.jade', {user: user});
	    	});
		});
	});
});

//show the page to contact a user
app.get('/contactUser', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
	    	collection.findOne( {uName: req.query.username}, function(err, user){
	    		res.render('user/contactUser.jade', {user: user});
	    	});
		});
	});
});

//run a search using the given parameters
app.post('/search', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {	
			var scientist = (req.body.profession == 'scientist') ? true : false;

	    	collection.find( {	scientist: scientist,
	    						//for checkbox groups, blank === match anything
	    						language : {$in: (req.body.language ? req.body.language : languages)}, 
	    						discipline : {$in: (req.body.discipline ? req.body.discipline : disciplines)}
	    					} ).toArray(function(err, matches){
	    							searchBuffer[req.user['_id']] = matches;
	    							return res.redirect('/searchResults?page=0');
	    						});
		});
	});
});

//go to the change password form
app.get('/changePasswordForm', function(req, res){

	return res.render('user/changePassword.jade');

});

//go to the password recovery page
app.get('/forgotPass', function(req, res){

	res.render('auth/recoverPassword.jade');

});

////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////

//validate login attempt
app.post('/login', passport.authenticate('local', { successRedirect: '/userMatches?page=0', failureRedirect: '/login/?loginError=1'}) );

//logout
app.post('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//show registration page with email filled in
app.post('/register', function(req, res){
	res.render('registration/register.jade', {disciplines: disciplines, languages: languages, user:{}, email: req.body.email});
});

//register a new user
app.post('/regUser', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.render('error.jade');
		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.redirect('/register/?registerError=2');
	
				//reject new account if email is already taken	    	
		    	collection.find({email: req.body.email}).toArray(function(err, accounts){
		    		if(accounts.length != 0){ 
		    			res.render('registration/register.jade', {disciplines: disciplines, languages: languages, emailError: true, user:{language: req.body.language, discipline: req.body.discipline, profession: req.body.profession, name: req.body.uName} });
		    			return;
					}
			        // hash the password along with our new salt:
			        bcrypt.hash(req.body.pass, salt, function(err, hash) {
			        	if(err) return res.render('error.jade');

		        		//register new user in the db:
						collection.insert({	'uName':req.body.uName, 
											'email': req.body.email, 
											'Pass': hash,
											'scientist': req.body.profession == 'scientist',
											'developer': req.body.profession == 'developer',
											'hasContacted': [],
											'discipline': req.body.discipline,
											'language': req.body.language,
											'description': req.body.projectDescription
										}, {safe: true}, function(err,res) {});

						//log the new user in:
						collection.findOne({email: req.body.email}, function(err, user){
							if(err) return res.render('error.jade');

							req.login(user, function(err) {
							  if (err) return res.render('error.jade');
							  return res.redirect('/userMatches?page=0');;
							});
						});
			        });
		    	});
		    });
		});
	});
});

//update a user's profile
app.post('/updateUser', function(req, res){

	//open link to the database
	connect(function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ email: req.user.email }, function(err, user){

		    	if (err || !user) return res.render('utilityPages/error.jade');

		    	//update the local user object
		    	req.user.scientist = req.body.profession=='scientist';
		    	req.user.developer = req.body.profession=='developer';
		    	req.user.discipline = req.body.discipline || req.user.discipline;
		    	req.user.language = req.body.language || req.user.language;
		    	req.user.email = req.body.email;
		    	req.user.description = req.body.projectDescription;

	    		//insist all fields have at least one option selected
	    		if(!req.body.discipline){
	    			return res.render('user/userProfile.jade', {user: req.user, disciplines:disciplines, languages:languages, disciplineError: 'Please choose at least one discipline'})
	    		}
	    		if(!req.body.language){
	    			return res.render('user/userProfile.jade', {user: req.user, disciplines:disciplines, languages:languages, languageError: 'Please choose at least one language'})
	    		}

		    	//update the DB and carry on to main user pages
		    	collection.update(	{uName : user.uName}, 
		    						{$set:{	scientist : req.body.scientist,
		    								developer : req.body.developer,
		    								discipline : req.body.discipline, 
		    								language : req.body.language,
		    								email : req.body.email,
		    								description: req.body.projectDescription}
		    						},
		    						function(){
										return res.redirect('/userMatches?page=0');									
		    						});
			});
		});
	});	
});


//password recovery - generate a random password, hash it, update the db, and mail it to the user
app.post('/emailNewPassword', function(req, res){

	//open link to the database
	connect(function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.body.username }, function(err, user){
				var newPass;

		    	if (err) return res.render('utilityPages/error.jade');
		    	if (!user)
		    		return res.render('utilityPages/error.jade');

		    	//generate a new password, bunch of random characters
		    	newPass = (Math.random() + 1).toString(36);

			    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			    	if(err) return res.render('utilityPages/error.jade');

				        // hash the password along with our new salt:
				        bcrypt.hash(newPass, salt, function(err, hash) {
				        	if(err) return res.render('utilityPages/error.jade');

				        	//update db
				        	collection.update({uName : user.uName}, {$set:{Pass : hash}}, function(){});
							
				        });
			    });

				mail({
				    from: "Fred Foo <foo@blurdybloop.com>", // sender address
				    to: "herpderp, mills.wj@gmail.com", // list of receivers
				    subject: "Hello", // Subject line
				    text: newPass // body
				});

				res.redirect('/')
			});
		});
	});
});

//validate and register the new password
app.post('/updatePassword', function(req, res){

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.render('utilityPages/error.jade');
		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.render('utilityPages/changePassword.jade');

		        // hash the password along with our new salt:
		        bcrypt.hash(req.body.pass, salt, function(err, hash) {
		        	if(err) return res.render('utilityPages/error.jade');

	        		//register new password in the db:
	        		collection.update({uName : req.user.uName}, {$set:{Pass : hash}}, function(){
	        			return res.redirect('/userMatches?page=0');
	        		});
		        });
		    });
		});
	});
});

//delete the profile of the currently logged in user
app.post('/deleteProfile', function(req, res){

	//open link to the database
	connect(function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user
			collection.findOne({ uName: req.user.uName }, function(err, user){

		    	if (err || !user) return res.render('utilityPages/error.jade');

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

//send an email to the user indicated by _id, and the initiating user
app.post('/sendEmail', function(req, res){
	//open link to the database
	connect(function(err, db) {
		db.collection('Users', function(er, collection) {

			//find the user to get their email - this way email is never exposed in the browser
			collection.findOne({ uName: req.body.uName }, function(err, user){

				//send the mail
				mail({
				    from: "Interdisciplinary Programming <noreply@interdisciplinaryprogramming.com>", // sender address
				    to: user.email + ', ' + req.user.email, // list of receivers
				    subject: req.body.subject, // Subject line
				    text: req.body.body // body
				});

				//make a note in the initiating user's database that they've now contacted this user
				collection.findOne({uName: req.user.uName}, function(err, user){
			    	collection.update(	{uName : user.uName}, 
			    						{$addToSet:{hasContacted : req.body.uName} }, 
			    						function(){
											return res.redirect('/userMatches?page=0');									
			    						});
				});
			});
		});
	});
});
