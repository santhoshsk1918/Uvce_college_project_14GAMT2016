var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var cloudDatabaseSchema = mongoose.Schema({
    keyWord: {
    type: String,
    index:true
  },
  serverName:{
    type:String
  },
  cloudPopularity:{
    type:Number
  },
  lastAccessedDate:{
    type:Date
  }
});

var cloudDatabase = module.exports = mongoose.model('cloudDatabase', cloudDatabaseSchema);

module.exports.getCloudDatabaseList = function(server, callback){
	var query = {};
	serverSelect.find(query, callback).sort({cloudPopularity:1});
}

module.exports.getCloudDatabaseforKeyWord = function(keyword, callback){
	var query = {keyWord:keyWord};
	serverSelect.find(query, callback);
}
