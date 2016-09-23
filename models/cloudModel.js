var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var cloudDatabaseSchema = mongoose.Schema({
    keyword: {
    type: String,
    index:true
  },
  data:{
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

module.exports.saveCloudDatabase = function(newServerData, callback){
	newServerData.save(callback);
}

module.exports.getCloudDatabaseList = function(server, callback){
	var query = {};
	cloudDatabase.find(query, callback).sort({cloudPopularity:1});
}

module.exports.getCloudDatabaseforKeyWord = function(keyword, callback){
	var query = {keyword:keyword};
	cloudDatabase.find(query, callback);
}
