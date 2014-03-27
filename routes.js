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

app.get('/error', function(req, res){
	var errorMessage = null;

	//error codes
	//10xx - database connection & lookup problems
	if(req.query.errCode == 1000)
		errorMessage = 'Error 1000: Database connection failed.'
	if(req.query.errCode == 1001)
		errorMessage = 'Error 1001: Failed to connect to User databse collection.'
	if(req.query.errCode == 1002)
		errorMessage = 'Error 1002: Failed to find user email in database.'
	if(req.query.errCode == 1003)
		errorMessage = 'Error 1003: Failed to find user id in database.'	
	//11xx - password & login problems
	if(req.query.errCode == 1100)
		errorMessage = 'Error 1100: Password salt generation failed.'
	if(req.query.errCode == 1101)
		errorMessage = 'Error 1101: Password hashing failed.'
	if(req.query.errCode == 1102)
		errorMessage = 'Error 1102: Login failed.'
	//12xx - search problems
	if(req.query.errCode == 1200)
		errorMessage = 'Error 1200: Search summarization failed.'
	//13xx - email problems
	if(req.query.errCode == 1300)
		errorMessage = 'Error 1300: Email generation failed.'

	res.render('error.jade', {errorMessage: errorMessage});
})

//show registration page
app.get('/register', function(req, res){
	res.render('registration/register.jade', {disciplines: disciplines, languages: languages, user:{}});
});

//show page to confirm profile deletion
app.get('/requestDeleteProfile', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('user/confirmDeleteProfile.jade', {});
});

//show a page of search results
app.get('/searchResults', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('search/searchResults.jade', {	searchResults: searchBuffer[req.user['_id']], 
										page: req.query.page, 
										nPages: Math.ceil(searchBuffer[req.user['_id']].length/10), 
										hasContacted: req.user.hasContacted} );
});

//user profile page
app.get('/userProfile', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('user/userProfile.jade', {user: req.user, disciplines: disciplines, languages: languages});

});

//show the first 10 user matches, with links to subsequnt batches of 10
app.get('/userMatches', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
			//build query object first:
			var query = {scientist: req.user.developer};
			if(req.user.discipline.indexOf('Any Discipline') == -1 )
				query.discipline = {$in: req.user.discipline};
			if(req.user.language.indexOf('Any Language') == -1 )
				query.language = {$in: req.user.language};
	    	collection.find( query ).toArray(function(err, matches){
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
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('search/userSearch.jade', {languages: languages, disciplines: disciplines});

});

//view another user's profile
app.get('/viewProfile', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
	    	collection.findOne( {_id: ObjectID.createFromHexString(req.query.uniqueID)}, function(err, user){
	    		res.render('user/profile.jade', {user: user});
	    	});
		});
	});
});

//show the page to contact a user
app.get('/contactUser', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
	    	collection.findOne( {_id: ObjectID.createFromHexString(req.query.uniqueID)}, function(err, user){
	    		res.render('user/contactUser.jade', {user: user});
	    	});
		});
	});
});

//go to the change password form
app.get('/changePasswordForm', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	return res.render('user/changePassword.jade');

});

//go to the password recovery page
app.get('/forgotPass', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('auth/recoverPassword.jade');

});

////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////

//validate login attempt
app.post('/login', passport.authenticate('local', { successRedirect: '/userMatches?page=0', failureRedirect: '/login?loginError=1'}) );

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
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');			

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.redirect('/error?errCode=1100');

		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.redirect('/register?registerError=2');
	
				//reject new account if email is already taken	    	
		    	collection.find({email: req.body.email}).toArray(function(err, accounts){
		    		if(err) return res.redirect('/error?errCode=1002');

		    		if(accounts.length != 0){ 
		    			res.render('registration/register.jade', {disciplines: disciplines, languages: languages, emailError: true, user:{language: req.body.language, discipline: req.body.discipline, profession: req.body.profession, name: req.body.uName} });
		    			return;
					}
			        // hash the password along with our new salt:
			        bcrypt.hash(req.body.pass, salt, function(err, hash) {
			        	if(err) return res.redirect('/error?errCode=1101');

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
							if(err) return res.redirect('/error?errCode=1002');

							req.login(user, function(err) {
							  if(err) return res.redirect('/error?errCode=1102');
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
		if(err) return res.redirect('/error?errCode=1000'); 

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

			//find the user
			collection.findOne({ email: req.user.email }, function(err, user){

		    	if (err || !user) return res.redirect('/error?errCode=1002');

		    	//update the local user object
		    	req.user.scientist = req.body.profession=='scientist';
		    	req.user.developer = req.body.profession=='developer';
		    	req.user.discipline = req.body.discipline || req.user.discipline;
		    	req.user.language = req.body.language || req.user.language;
		    	req.user.description = req.body.projectDescription;

	    		//insist all fields have at least one option selected
	    		if(!req.body.discipline){
	    			return res.render('user/userProfile.jade', {user: req.user, disciplines:disciplines, languages:languages, disciplineError: 'Please choose at least one discipline'})
	    		}
	    		if(!req.body.language){
	    			return res.render('user/userProfile.jade', {user: req.user, disciplines:disciplines, languages:languages, languageError: 'Please choose at least one language'})
	    		}

	    		//need to make sure that either the user hasn't changed their
	    		//email, or they've changed it to something not otherwise in the
	    		//database
	    		collection.findOne({ email: req.body.email }, function(err, user2){
	    			if(err) return res.redirect('/error?errCode=1002');

	    			if(!user2 || req.user.email == req.body.email){
	    				//email checks out - update the DB and carry on to main user pages
				    	collection.update(	{_id: ObjectID.createFromHexString(user._id+'')}, 
				    						{$set:{	scientist : req.body.profession=='scientist',
				    								developer : req.body.profession=='developer',
				    								discipline : req.body.discipline, 
				    								language : req.body.language,
				    								email : req.body.email,
				    								description: req.body.projectDescription}
				    						},
				    						function(){
												return res.redirect('/userMatches?page=0');									
				    						});

	    			} else{
	    				//update failed - need to inform user
	    				return res.render('user/userProfile.jade', {user: req.user, disciplines:disciplines, languages:languages, emailError: 'That email address is already taken - keep your old one or choose another.'})
	    			}
	    		});
			});
		});
	});	
});

//run a search using the given parameters
app.post('/search', function(req, res){
	connect(function(err, db) {
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

			var scientist = (req.body.profession == 'scientist') ? true : false,
				query = {scientist: scientist};
				//no box checked on a checkbox group matches anything, as does checking the 'Any' box
				if(req.body.language && (req.body.language.indexOf('Any Language') == -1) )
					query.language = req.body.language;
				if(req.body.discipline && (req.body.discipline.indexOf('Any Discipline') == -1) )
					query.discipline = req.body.discipline;				

	    	collection.find(query).toArray(function(err, matches){
	    		if(err) return res.redirect('/error?errCode=1200');

	    		searchBuffer[req.user['_id']] = matches;
	    		return res.redirect('/searchResults?page=0');
	    	});
		});
	});
});

//password recovery - generate a random password, hash it, update the db, and mail it to the user
app.post('/emailNewPassword', function(req, res){

	//open link to the database
	connect(function(err, db) {
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

			//find the user
			collection.findOne({ email: req.body.email }, function(err, user){
				var newPass;

		    	if(err || !user) return res.redirect('/error?errCode=1002');

		    	//generate a new password, bunch of random characters
		    	newPass = (Math.random() + 1).toString(36);

			    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			    	if(err) return res.redirect('/error?errCode=1100');

				        // hash the password along with our new salt:
				        bcrypt.hash(newPass, salt, function(err, hash) {
				        	if(err) return res.redirect('/error?errCode=1101');

				        	//update db
				        	collection.update({email : req.body.email}, {$set:{Pass : hash}}, function(){});
							
				        });
			    });

				var mailOptions = {
				    from: "Fred Foo <foo@blurdybloop.com>", // sender address
				    to: req.body.email, // list of receivers
				    subject: "Password Reset from InterdisciplinaryProgramming", // Subject line
				    text: newPass // body
				};

				// send mail with defined transport object
				smtpTransport.sendMail(mailOptions, function(error, response){
				    if(error) return res.redirect('/error?errCode=1300');
				    else{
				        console.log("Message sent: " + response.message);
				    }

				    // if you don't want to use this transport object anymore, uncomment following line
				    //smtpTransport.close(); // shut down the connection pool, no more messages
				});

				res.redirect('/')
			});
		});
	});
});

//validate and register the new password
app.post('/updatePassword', function(req, res){

	connect(function(err, db) {
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

		    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		    	if(err) return res.redirect('/error?errCode=1100');

		    	//make sure the password was entered the same way twice
		    	if(req.body.pass != req.body.repass) return res.render('changePassword.jade');

		        // hash the password along with our new salt:
		        bcrypt.hash(req.body.pass, salt, function(err, hash) {
		        	if(err) return res.redirect('/error?errCode=1101');

	        		//register new password in the db:
	        		collection.update({email : req.user.email}, {$set:{Pass : hash}}, function(){
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
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

			//find the user
			collection.findOne({ email: req.user.email }, function(err, user){

		    	if(err || !user) return res.redirect('/error?errCode=1002');

		    	//logout
		    	req.logout();

		    	//dump user from DB and return to landing page:
		    	collection.remove({email : user.email}, true, function(){
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
		if(err) return res.redirect('/error?errCode=1000');

		db.collection('Users', function(er, collection) {
			if(er) return res.redirect('/error?errCode=1001');

			//find the user to get their email - this way email is never exposed in the browser
			collection.findOne({ _id: ObjectID.createFromHexString(req.body.uniqueID) }, function(err, user){
				if(err) return res.redirect('/error?errCode=1003');

				var mailOptions = {
				    from: "Interdisciplinary Programming <noreply@interdisciplinaryprogramming.com>", // sender address
				    to: user.email + ', ' + req.user.email, // list of receivers
				    subject: req.body.subject, // Subject line
				    text: req.body.body // body
				};

				// send mail with defined transport object
				smtpTransport.sendMail(mailOptions, function(error, response){
					if(error) return res.redirect('/error?errCode=1300');
				    else{
				        console.log("Message sent: " + response.message);
				    }

				    // if you don't want to use this transport object anymore, uncomment following line
				    //smtpTransport.close(); // shut down the connection pool, no more messages
				});

				//make a note in the initiating user's database that they've now contacted this user
				collection.findOne({_id: ObjectID.createFromHexString(req.user._id+'')}, function(err, user){
					if(err) return res.redirect('/error?errCode=1003');
			    	collection.update(	{email : user.email}, 
			    						{$addToSet:{hasContacted : req.body.uniqueID} }, 
			    						function(){
											return res.redirect('/userMatches?page=0');									
			    						});
				});

			});
		});
	});
});
