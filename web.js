// web.js
var express = require("express");
var logfmt = require("logfmt");
var mongo = require('mongodb');
var app = express();

app.use(logfmt.requestLogger());
app.use(express.static(__dirname + 'index.html'));

app.get('/', function(req, res) {
  res.send("<input type='text'></input>");
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
/*
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://heroku_app17567162:epvq4e1ccopjjpu2o3l2pvaifo@ds041228.mongolab.com:41228/heroku_app17567162';

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(er, collection) {
    collection.insert({'HERP': 'DERP'}, {safe: true}, function(er,rs) {
    });
  });
});
*/