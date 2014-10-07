var ObjectID = require('mongodb').ObjectID;                 // tool for reconstructing mongo-style ids out of their hex encodings

/*
 * GET Requests
 */

app.get('/', function(req, res){
  req.session.cookie.path = req.originalUrl;
  connect(function(err, db) {
    db.collection('projects', function(er, collection) {
      collection.find({}).toArray(function(err, results){
        res.render('index.jade', {loggedIn: !!req.user,
                                  projects: results,
                                  user : req.user || undefined});
      });
    });
  });
});

app.get('/collaborate', function(req,res){
  req.session.cookie.path = req.originalUrl;
  connect(function(err, db) {
    db.collection('projects', function(er, collection) {
      collection.find({}).toArray(function(err, results){
        res.render('index.jade', {loggedIn: !!req.user,
                                  projects: results,
                                  user : req.user || undefined});
      });
    });
  });
})

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


// about page
app.get('/collaborate/about', function(req, res) {
  req.session.cookie.path = req.originalUrl;
  res.render('about.jade', {loggedIn: !!req.user,
                            user : req.user || undefined});
});

function isUser(element, id){
  return element && (element.login == this || element.githubId == this);
}

function removeUser(array, id){
  var match = array.filter(isUser, id);
  if(match){
    array.splice(array.indexOf(match[0]), 1);
  }
  return array;
}

function canEdit(project, user){
  return (user && ((user.githubId == project.lead.githubId) || (user.githubId == process.env.ADMIN)));
}


//edit project page
app.get('/projects/:route/edit', function(req, res){
  ensureAuthenticated(req, res, function(){
    connect(function(err, db) {
      db.collection('projects', function(er, collection) {
          collection.findOne( {route: req.params.route}, function(err, project){
            var args = (project.github.repo) ? {user: project.github.user } : {org: project.github.user},
                vars = {
                          title: project.title,
                          imageName: '/static/img/' + project.imageName,
                          subjects: project.subjects,
                          languages: project.languages,
                          lead: project.lead,
                          institute: project.institute,
                          who: project.who || project.summary,
                          what: project.what,
                          tweetable: project.tweetable || project.who || project.summary,
                          repo: project.repoURL,
                          page: project.pageURL,
                          moreInfo: project.moreinfo,
                          goals: project.goals,
                          loggedIn: !!req.user,
                          user: req.user,
                          route: project.route,
                          wanted: project.wanted,
                          inactive: project.inactive
                        };

            if(canEdit(project, req.user)){
              res.render('project/edit.jade', vars);
            } else {
              res.status(403).end();
            }
          });
      });
    });
  });
});


//save project page
app.post('/projects/:route/save', function(req, res){
  connect(function(err, db) {
    db.collection('projects', function(er, collection) {
        collection.findOne( {route: req.params.route}, function(err, project){
          var args = (project.github.repo) ? {user: project.github.user } : {org: project.github.user};
          if(canEdit(project, req.user)){
            //update project
            project.title = req.body.title;
            project.subjects = req.body.subjects;
            project.languages = req.body.languages;
            project.lead.name = req.body.lead;
            project.institute = req.body.institute;
            project.who = req.body.who;
            project.what = req.body.what;
            project.tweetable = req.body.tweetable;
            project.repoURL = req.body.repoURL;
            project.pageURL = req.body.pageURL;
            project.moreinfo = req.body.moreInfo;
            project.goals = req.body.goals;
            project.wanted = req.body.wanted;
            project.inactive = req.body.inactive;

            collection.update({route: req.params.route}, project, {w:1}, function(err, proj){
              if(err) console.log(err);
              res.send();
            });
          } else {
            res.status(403).end();
          }

        });
    });
  });
});


//view project page
app.get('/projects/:route', function(req, res){
  req.session.cookie.path = req.originalUrl;
  connect(function(err, db) {
    db.collection('projects', function(er, collection) {
        collection.findOne( {route: req.params.route}, function(err, project){
          if(!project){
            res.status(404).end();
          } else {
            var args = (project.github.repo) ? {user: project.github.user } : {org: project.github.user},
                vars = {
                          title: project.title,
                          imageName: '/static/img/' + project.imageName,
                          subjects: project.subjects,
                          languages: project.languages,
                          lead: project.lead,
                          institute: project.institute,
                          who: project.who || project.summary,
                          what: project.what,
                          tweetable: project.tweetable || project.who || project.summary,
                          repo: project.repoURL,
                          page: project.pageURL,
                          moreInfo: project.moreinfo,
                          goals: project.goals,
                          type: (project.github.repo) ? 'repo' : 'org',
                          loggedIn: !!req.user,
                          user: req.user,
                          route: project.route,
                          wanted: project.wanted,
                          inactive: project.inactive,
                          canEdit: canEdit(project, req.user)
                        };
            if(project.contributors) {
              vars.local_contrib = project.contributors;
              if(req.user){
                var match = vars.local_contrib.filter(isUser, req.user.githubId);
                if(match.length > 0) {
                  vars.member = true;
                  vars.canLeave = true;
                }
              }
            }
            if(req.user) vars.user = req.user;
            // WHY IS IT SOMETIMES LINKED TO A REPO AND SOMETIMES AN ORG??!??!
            if(project.github.repo) {
              args.repo = project.github.repo;
              github.repos.getContributors(args, function(err, r){
                if(err) console.log(err);
                if(r) vars.contributors = r;
                args.path = '';
                if(r && req.user){
                  var match = r.filter(isUser, req.user.githubId);
                  if(match.length > 0)  vars.member = true;
                }
                github.repos.getContent(args, function(err, r){
                  if(r) vars.content = r;
                  res.render('project/project.jade', vars);
                })
              });
            } else {
              github.orgs.getPublicMembers(args, function(err, r){
                if(r) vars.contributors = r;
                if(r && req.user){
                  var match = r.filter(isUser, req.user.githubId);
                  if(match.length > 0) {
                    vars.member = true;
                  }
                }
                github.repos.getFromOrg(args, function(err, r){
                  if(r) vars.content = r;
                  res.render('project/project.jade', vars);
                })
              });
            }
          }
        });
    });
  });
});



app.get('/projects', function(req, res){
  req.session.cookie.path = req.originalUrl;
  connect(function(err, db) {
    db.collection('projects', function(er, collection) {
      collection.find( {}).toArray(function(err, results){
        res.render('index.jade', {loggedIn: !!req.user,
                                  projects: results,
                                  user : req.user || undefined});
        });
    });
  });

});



////////////////////////////////////////////////////////
//post requests/////////////////////////////////////////
////////////////////////////////////////////////////////


app.get('/auth/github',
  passport.authenticate('github', { scope: 'public_repo,user'}));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect to referrer.
    res.redirect(req.session.cookie.path || (req.headers && req.headers.referer) || '/');
  });

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/github')
}


app.get('/projects/:route/leave', function(req, res){
  ensureAuthenticated(req, res, function(){
    connect(function(err, db) {
      db.collection('projects', function(er, collection) {
          collection.findOne( {route: req.params.route}, function(err, project){
            if(project.contributors){
              project.contributors = removeUser(project.contributors, req.user.githubId);
              collection.update({route: req.params.route}, project, {w:1}, function(err, proj){
                if(err) console.log(err);
                res.send();
              });
            }else{
              res.send();
            }
          });
      });
    });
  });
});

app.post('/projects/:route/join', function(req, res){
  ensureAuthenticated(req, res, function(){
    connect(function(err, db) {
      db.collection('projects', function(er, collection) {
          collection.findOne( {route: req.params.route}, function(err, project){
            var args = (project.github.repo) ? {user: project.github.user } : {org: project.github.user},
                contributors = project.contributors || [];

            contributors.push(req.user);
            project.contributors = contributors;
            collection.update({route: req.params.route}, project, {w:1}, function(err, proj){
              console.log(proj);
              if(err) console.log(err);
              res.send();
            });

            if(project.github.repo){
              args.repo = project.github.repo;
              if(req.body.star === 'true'){
                github.repos.star(args, function(err, r){
                  if(err) console.log(err);
                });
              }
              if(req.body.fork === 'true'){
                github.repos.fork(args, function(err, r){
                  if(err) console.log(err);
                });
              }
              args.title = req.user.name + ": new volunteer via Mozilla Science Lab Collaborate";
              args.body = req.body.text + "<p><br><blockquote>This issue was created by @" + req.user.githubId + " via <a href='http://collaborate.mozillascience.org'>Mozilla Science Lab Collaborate</a></blockquote></p>";
              args.labels = ['New Volunteer'];
              github.issues.create(args, function(err, r){
                  if(err) console.log(err);
              });
            }
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
            collection.update(  {email : user.email},
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
                collection.insert({  'route':route,
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
