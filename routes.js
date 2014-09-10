require('./models/users.js');

/*
 * GET Requests
 */

app.get('/', function(req, res){
	app.userModel.getMostRecent(req, res);
});

//show login page
app.get('/login', function(req, res) {
	var loginError = null;

	if(req.query.loginError == 1)
		loginError = 'Whooops!  Bad user / pass combo, try again plz:';

	res.render('auth/login.jade', {loggedIn: !!req.user, loginMessage: loginError})
});

//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
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
	if(req.query.errCode == 1004)
		errorMessage = 'Error 1004: Failed to write user to database.'
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

	res.render('error.jade', {loggedIn: !!req.user, errorMessage: errorMessage});
})

//show registration page
app.get('/register', function(req, res){
	res.render('registration/register.jade', {loggedIn: !!req.user, disciplines: disciplines, languages: languages, affiliations: affiliations, user:{}});
});

//show page to confirm profile deletion
app.get('/requestDeleteProfile', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('user/confirmDeleteProfile.jade', {loggedIn: !!req.user,});
});

//show a page of search results
app.get('/searchResults', function(req, res){
	res.render('search/searchResults.jade', { loggedIn: !!req.user,
										searchResults: req.session.searchBuffer,
										page: req.query.page,
										hasContacted: ((!!req.user) ? req.user.hasContacted : []) } );
});

//user profile page
app.get('/userProfile', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('user/userProfile.jade', {loggedIn: !!req.user, user: req.user, disciplines: disciplines, languages: languages,  affiliations:affiliations});

});

//show the first 10 user matches, with links to subsequnt batches of 10
app.get('/userMatches', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
			//build query object first:
			var query = {scientist: req.user.developer, affiliation: {$in: req.user.affiliation} };
			if(req.user.discipline.indexOf('Any Discipline') == -1 )
				query.discipline = {$in: req.user.discipline};
			if(req.user.language.indexOf('Any Language') == -1 )
				query.language = {$in: req.user.language};
			//scientist not offering money only matches volunteer devs
			if(req.user.scientist && !req.user.isPaid)
				query.isPaid = false;
			//developer demanding money only matches scientists offering money
			if(req.user.developer && req.user.isPaid)
				query.isPaid = true;
	    	collection.find( query ).toArray(function(err, matches){
	    		req.session.matchBuffer = matches.sort(helpers.sortByTimestamp);
	    		res.render('user/userMatches.jade', { loggedIn: !!req.user,
	    										match: matches,
	    										page: req.query.page,
	    										nPages: Math.ceil(req.session.matchBuffer),
	    										hasContacted: req.user.hasContacted});
	    	});
	    });
	});
});


//search page
app.get('/userSearch', function(req, res){
	res.render('search/userSearch.jade', {loggedIn: !!req.user, languages: languages, disciplines: disciplines, affiliations: affiliations});
});

//view another user's profile
app.get('/profile/:uName', function(req, res){
	//don't let a non-logged in person in:
	//if(!req.user)
	//	return res.redirect('/login');

	connect(function(err, db) {
		db.collection('Users', function(er, collection) {
	    	collection.findOne( {uName: req.params.uName}, function(err, user){
	    		res.render('user/profile.jade', {loggedIn: !!req.user, user: user});
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
	    		res.render('user/contactUser.jade', {loggedIn: !!req.user, user: user});
	    	});
		});
	});
});

//go to the change password form
app.get('/changePasswordForm', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	return res.render('user/changePassword.jade', {loggedIn: !!req.user});

});

//go to the password recovery page
app.get('/forgotPass', function(req, res){
	//don't let a non-logged in person in:
	if(!req.user)
		return res.redirect('/login');

	res.render('auth/recoverPassword.jade', {loggedIn: !!req.user});

});

//view project page
app.get('/projects/:route', function(req, res){

	connect(function(err, db) {
		db.collection('projects', function(er, collection) {
	    	collection.findOne( {route: req.params.route}, function(err, project){

				res.render('project/project.jade', {
													title: project.title,
													imageName: '/static/img/' + project.imageName,
													subjects: project.subjects,
													languages: project.languages,
													paid: project.paid == true,
													lead: project.lead,
													institute: project.institute,
													//summaryText: project.summary,
													who: project.who,
													what: project.what,
													repo: project.repoURL,
													page: project.pageURL,
													moreInfo: project.moreinfo,
													goals: project.goals
												});
	    	});
		});
	});
});

app.get('/defineProject', function(req, res){

	res.render('project/regForm.jade', {});

});

app.get('/projects', function(req, res){

	connect(function(err, db) {
		db.collection('projects', function(er, collection) {
			collection.find( {}).toArray(function(err, results){
/*
	    		console.log(results)
	    		res.redirect('/');
*/
				res.render('projectList.jade', {projects: results});

	    	});
		});
	});

});

app.get('/contact', function(req, res){

	res.render('contact.jade', {});

});

////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////

//validate login attempt
app.post('/login', passport.authenticate('local', { successRedirect: '/userMatches?page=0', failureRedirect: '/login?loginError=1'}) );

//show registration page with email filled in
app.post('/register', function(req, res){
	res.render('registration/register.jade', {loggedIn: !!req.user, disciplines: disciplines, languages: languages, affiliations: affiliations, user:{}, email: req.body.email});
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

		    		//scrub the links provided into something sensible:
		    		var linkTable = helpers.buildLinkTable(req.body.linkDescription, req.body.link);

		    		if(accounts.length != 0){
		    			res.render('registration/register.jade', {	loggedIn: !!req.user,
		    														disciplines: disciplines,
		    														languages: languages,
		    														affiliations: affiliations,
		    														emailError: true,
		    														user:{	language: req.body.language,
		    																discipline: req.body.discipline,
		    																profession: req.body.profession,
		    																affiliation: req.body.affiliation,
		    																otherLang: req.body.otherLang,
		    																otherDisc: req.body.otherDisc,
		    																name: req.body.uName,
		    																projectDescription: req.body.projectDescription,
																			linkDescription : linkTable[0],
																			link : linkTable[1]
		    															}
		    														});
		    			return;
					}

					//reject new account if username is already taken
			    	collection.find({uName: req.body.uName}).toArray(function(err, accounts){
			    		if(err) return res.redirect('/error?errCode=1002');

			    		if(accounts.length != 0){
			    			res.render('registration/register.jade', {	loggedIn: !!req.user,
			    														disciplines: disciplines,
			    														languages: languages,
			    														affiliations: affiliations,
			    														uNameError: true,
			    														email:req.body.email,
			    														user:{	language: req.body.language,
			    																discipline: req.body.discipline,
			    																profession: req.body.profession,
			    																affiliation: req.body.affiliation,
		    																	otherLang: req.body.otherLang,
		    																	otherDisc: req.body.otherDisc,
			    																name: req.body.uName,
			    																projectDescription: req.body.projectDescription,
																				linkDescription : linkTable[0],
																				link : linkTable[1]
			    															}
			    														});
			    			return;
						}

				        // hash the password along with our new salt:
				        bcrypt.hash(req.body.pass, salt, function(err, hash) {
				        	if(err) return res.redirect('/error?errCode=1101');

				        	var lang=[], disc=[];
				        	//build language and discipline arrays
				        	if(req.body.language)
				        		lang = lang.concat(req.body.language);
				        	if(req.body.otherLang)
				        		lang = lang.concat(cleanCase(req.body.otherLang));
				        	if(req.body.discipline)
				        		disc = disc.concat(req.body.discipline);
				        	if(req.body.otherDisc)
				        		disc = disc.concat(cleanCase(req.body.otherDisc));

			        		//register new user in the db:
							collection.insert({	'uName':req.body.uName,
												'email': req.body.email,
												'Pass': hash,
												'scientist': req.body.profession == 'scientist',
												'developer': req.body.profession == 'developer',
												'hasContacted': [],
												'discipline': disc,
												'language': lang,
												'affiliation': req.body.affiliation,
												'isPaid': req.body.isPaid == 'yes',
												'otherLang': cleanCase(req.body.otherLang),
												'otherDisc': cleanCase(req.body.otherDisc),
												'description': req.body.projectDescription,
												'timeCreated': Date.now(),
												'linkDescription' : linkTable[0],
												'link' : linkTable[1],
												'agreeTOS' : req.body.agreeToTerms == 'agreed'
											}, {safe: true}, function(err,response) {
												if(err){
													console.log(err);
													return res.redirect('/error?errCode=1004');
												}
												//log the new user in:
												collection.findOne({email: req.body.email}, function(err, user){
													if(err || !user) return res.redirect('/error?errCode=1002');

													req.login(user, function(err) {
													    if(err){
													    	console.log(err)
													    	console.log(user)
													  		return res.redirect('/error?errCode=1102');
													    }

													  return res.redirect('/userMatches?page=0');;
													});
												});
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
				var lang=[], disc=[], linkTable;

		    	if (err || !user) return res.redirect('/error?errCode=1002');

	        	//build language and discipline arrays
	        	if(req.body.language)
	        		lang = lang.concat(req.body.language);
	        	if(req.body.otherLang)
	        		lang = lang.concat(cleanCase(req.body.otherLang));
	        	if(req.body.discipline)
	        		disc = disc.concat(req.body.discipline);
	        	if(req.body.otherDisc)
	        		disc = disc.concat(cleanCase(req.body.otherDisc));

				//scrub the link table into something sensible
				if(req.body.linkDescription)
				  	linkTable = helpers.buildLinkTable(req.body.linkDescription, req.body.link)
				else
					linkTable = [[],[]];

		    	//update the local user object
		    	req.user.scientist = req.body.profession=='scientist';
		    	req.user.developer = req.body.profession=='developer';
		    	req.user.discipline = disc || req.user.discipline;
		    	req.user.language = lang || req.user.language;
		    	req.user.otherLang = cleanCase(req.body.otherLang) || req.user.otherLang;
		    	req.user.otherDisc = cleanCase(req.body.otherDisc) || req.user.otherDisc;
		    	req.user.affiliation = req.body.affiliation,
				req.user.isPaid	= req.body.isPaid == 'yes',
		    	req.user.description = req.body.projectDescription;
		    	req.user.linkDescription = linkTable[0];
		    	req.user.link = linkTable[1];

	    		//need to make sure that either the user hasn't changed their
	    		//email, or they've changed it to something not otherwise in the
	    		//database
	    		collection.findOne({ email: req.body.email }, function(err, user2){

	    			if(err) return res.redirect('/error?errCode=1002');

	    			if(!user2 || req.user.email == req.body.email){
	    				//email checks out - update the DB

				    	collection.update(	{_id: ObjectID.createFromHexString(user._id+'')},
				    						{$set:{	scientist : req.body.profession=='scientist',
				    								developer : req.body.profession=='developer',
				    								discipline : disc,
				    								language : lang,
				    								otherLang : cleanCase(req.body.otherLang),
				    								otherDisc : cleanCase(req.body.otherDisc),
				    								affiliation : req.body.affiliation,
				    								isPaid : req.body.isPaid == 'yes',
				    								email : req.body.email,
				    								description: req.body.projectDescription,
				    								linkDescription: linkTable[0],
				    								link: linkTable[1]
				    							}
				    						},
				    						function(){
												return res.redirect('/userMatches?page=0');
				    						});

	    			} else{
	    				//update failed - need to inform user
	    				return res.render('user/userProfile.jade', {loggedIn: !!req.user, user: req.user, disciplines:disciplines, languages:languages, affiliations:affiliations, emailError: true})
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
			if(req.body.language && (req.body.language.indexOf('Any Language') == -1) ){
				query.language = req.body.language;
			    query.language.concat(cleanCase(req.body.otherLang)); //also tack on the freeform field
			} else if(req.body.otherLang)
				query.language = [cleanCase(req.body.otherLang)]; //just the freeform field
			if(req.body.discipline && (req.body.discipline.indexOf('Any Discipline') == -1) ){
				query.discipline = req.body.discipline;
				query.discipline.concat(cleanCase(req.body.otherDisc));
			} else if(req.body.otherDisc)
				query.discipline = [cleanCase(req.body.otherDisc)];
			if(req.body.affiliation)
				query.affiliation = req.body.affiliation;
			//just has arrays stuck into language, discipline and affiliation, wrap in object
			if(query.language)
				query.language = {$in: query.language}
			if(query.discipline)
				query.discipline = {$in: query.discipline}
			if(query.affiliation)
				query.affiliation = {$in: query.affiliation}
			//looking for a scientist with money:
			if(scientist && req.body.moneyConstraint)
				query.isPaid = true;
			//looking for a volunteer developer:
			if(!scientist && req.body.moneyConstraint)
				query.isPaid = false;

	    	collection.find(query).toArray(function(err, matches){
	    		if(err) return res.redirect('/error?errCode=1200');

	    		req.session.searchBuffer = matches.sort(helpers.sortByTimestamp);
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
		    	if(req.body.pass != req.body.repass) return res.render('changePassword.jade', {loggedIn: !!req.user});

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

app.post('/emailIP', function(req, res){

	var mailOptions = {
	    from: req.body.email, // sender address
	    to: 'mills.wj@gmail.com', // list of receivers
	    cc: req.body.email,
	    subject: 'Hello from Interdisciplinary Programming!', // Subject line
	    text: req.body.body // body
	};

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error) return res.redirect('/error?errCode=1300');
	    else{
	        res.redirect('/');
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
});
/*
app.post('/defineProject', function(req, res){
	var route = req.body.route,
		title = req.body.title,
		imageName = req.body.imageName,
		subjects = req.body.subjects.split(','),
		languages = req.body.languages.split(','),
		paid = (req.body.paid) ? true : false,
		lead = req.body.lead,
		institute = req.body.institute,
		summary = req.body.summary,
		requirements = req.body.requirements,
		repoURL = req.body.repoURL,
		pageURL = req.body.pageURL,
		moreinfo = req.body.moreinfo,
		goals = req.body.goals.split(',');

	connect(function(err, db) {

		db.collection('projects', function(er, collection) {

			db.collection('admin', function(er, admin) {
				admin.findOne({ 'name':'pass' }, function(err, entry){

					bcrypt.compare(req.body.pass, entry.pw, function(err, isMatch) {
						console.log(isMatch);
						if(!isMatch) return res.redirect('/defineProject');

						//reject new page if route already taken
				    	collection.find({route: route}).toArray(function(err, projects){
				    		if(projects.length != 0){
				    			return res.redirect('/defineProject');
				    		} else {

					    		//register new user in the db:
								collection.insert({	'route':route,
													'title':title,
													'imageName':imageName,
													'subjects':subjects,
													'languages':languages,
													'paid': paid,
													'lead': lead,
													'institute': institute,
													'summary': summary,
													'requirements': requirements,
													'repoURL': repoURL,
													'pageURL': pageURL,
													'moreinfo': moreinfo,
													'goals': goals
												}, {safe: true}, function(err,response) {
													return res.redirect('/');
												});
							}
						});
					});
				});
			});
		});
	});
});
*/
