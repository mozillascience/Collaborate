/*
 * USER Model
 */



(function(userModel, undefined){
    userModel.getMostRecent = function(req, res){
		// Fetch 'most recent' content for rendering
		// TODO: This is tightly coupled to the home page by passing in res rather than using callback
		/*
		connect(function(err, db) {
			db.collection('SiteCache', function(er, collection) {	    	
		    	collection.findOne( {name: 'MostRecentCache'}, function(err, cache){    		
		    		res.render('index.jade', {loggedIn: !!req.user, developer: cache.mostRecentDeveloper, scientist: cache.mostRecentScientist});
		    	});
		    });
		});
		*/
		res.render('index.jade', {}); //no need for db stuff for static pilot page
    }
})(app.userModel = app.userModel || {});

