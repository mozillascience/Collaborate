// web.js
var express = require("express");
var logfmt = require("logfmt");
var mongo = require('mongodb');
var app = express();

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://heroku_app20467917:j5f8u413gre79i0o24km87ut0b@ds059898.mongolab.com:59898/heroku_app20467917';

//app.use(logfmt.requestLogger());
app.use(express.static(__dirname));
app.use(express.bodyParser());

app.get('/', function(req, res) {
  //res.redirect("/index.html");
  res.render('index', {title:'plzWork'});
});

app.post('/', function(req, res){
	console.log('testing app.post')
	console.log(req.body)
	res.render('index', {title:'plzWork'});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});




mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(er, collection) {
    collection.insert({'HERP': 'DERP'}, {safe: true}, function(er,rs) {
    });
  });
});
