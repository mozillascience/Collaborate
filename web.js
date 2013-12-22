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
			collection.insert({'Name': req.body.Name, 'Diet': req.body.diet, 'Feature': req.body.feature}, {safe: true}, function(er,rs) {});
		});
	});

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('mydocs', function(er, collection) {
			collection.find({}, function(err, stuff){
				stuff.toArray(function(err, docs){
					var content = [];
					for(var i=0; i<docs.length; i++)
						content[i] = docs[i].Name;

					console.log(content);
				});
			});
		});
	});

	res.render('trololo.jade', {trololo: 'Jade Ahoy!'})

});

app.post('/roboSubmit', function(req, res){

	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('robos', function(er, collection) {
			collection.insert({'Name': req.body.Name, 'Locomotion': req.body.locomotion, 'Language': req.body.language}, {safe: true}, function(er,rs) {});
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

				console.log(dinos.length)

				mongo.Db.connect(mongoUri, function(err, db) {
					db.collection('robos', function(er, collection) {
						collection.find().toArray(function(err, robos){

							console.log(dinos.length)
							console.log(robos.length)

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