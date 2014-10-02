function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;
  var userSchema = new Schema({
    'name': String,
    'email': String,
    'githubId': String,
    'twitterId': String,
    'company': String,
    'token': String,
    'avatar_url': String
  });

  mongoose.model('Users', userSchema);
  fn();
}

exports.defineModels = defineModels;
