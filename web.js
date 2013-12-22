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
	res.render('index.jade');
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
			collection.find({Language == req.body.wants}).toArray(function(err, robos){

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
			collection.find().toArray(function(err, dinos){

				var matches = [];

				for(var i=0; i<dinos.length; i++)
					if(req.body.wants == dinos[i].Feature)
						matches[matches.length] = dinos[i].Name								

				if(matches.length == 0)
					res.render('dinoReport.jade', {name: '404: NO DINOS FOUND, CONTACT YOUR DINO PROVIDER'})
				else if (matches.length == 1)
					res.render('dinoReport.jade', {name: matches[0]+' satisfies all criteria.'})
				else
					res.render('dinoReport.jade', {name: 'TOO MANY MATCHES, DINO OVERFLOW'})

			});
		});
	});

});

app.post('/home', function(req, res) {
	res.render('index.jade');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});