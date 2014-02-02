/*
 * USER Model
 */



(function(userModel, undefined){
    userModel.getMostRecent = function(res){
		// Fetch 'most recent' content for rendering
		// TODO: This is tightly coupled to the home page by passing in res rather than using callback
		mongo.Db.connect(mongoUri, function(err, db) {
			db.collection('SiteCache', function(er, collection) {	    	
		    	collection.findOne( {name: 'MostRecentCache'}, function(err, cache){    		
		    		res.render('home.jade', {developer: cache.mostRecentDeveloper, scientist: cache.mostRecentScientist});
		    	});
		    });
		});
    }
})(app.userModel = app.userModel || {});

