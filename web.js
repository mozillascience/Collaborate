// web.js
var express = require("express");
var logfmt = require("logfmt");
var mongo = require('mongodb');
var app = express();

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917';

app.set('views', __dirname + '/views');
app.use(express.static(__dirname));
app.use(express.bodyParser());

app.get('/', function(req, res) {
	res.render('index');
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
			collection.find().toArray(function(err, robos){

				var matches = [];

				for(var i=0; i<robos.length; i++)
					if(req.body.Wants == robos[i].Language)
						matches[matches.length] = robos[i].Name								

				if(matches.length == 0)
					res.render('dinoReport.jade', {name: 'Sorry friend, no one matches your dino demands :('})
				else if (matches.length == 1)
					res.render('dinoReport.jade', {name: matches[0]+' is perfect for you!'})
				else
					res.render('dinoReport.jade', {name: 'there are so many matches you dont even know'})

			});
		});
	});

	//res.render('trololo.jade', {trololo: 'Jade Ahoy!'})

});

app.post('/roboSubmit', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('robos', function(er, collection) {
			collection.insert({'Name': req.body.Name, 'Language': req.body.language, 'Wants':req.body.wants}, {safe: true}, function(er,rs) {});
		});
	});

	res.render('trololo.jade', {trololo: 'Jade Ahoy!'})

});






app.post('/create', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('mydocs', function(er, collection) {
			collection.insert({'Name': req.body.Name, 'Race': req.body.Race, 'Occupation': req.body.Occupation}, {safe: true}, function(er,rs) {});
		});
	});

	res.redirect('/');

});

app.post('/report', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('dinos', function(er, collection) {
			collection.find().toArray(function(err, dinos){

				mongo.Db.connect(mongoUri, function(err, db) {
					db.collection('robos', function(er, collection) {
						collection.find().toArray(function(err, robos){

							var content = [];

							for(var i=0; i<dinos.length; i++)
								content[i] = dinos[i].Name;

							for(i=dinos.length; i<dinos.length+robos.length; i++)
								content[i] = robos[i - dinos.length].Name;

							console.log(content);										

						});
					});
				});				

			});
		});
	});

	res.render('trololo.jade', {trololo: 'Jade Ahoy!'})
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});