var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var serverDatabaseSchema = mongoose.Schema({
    keyword: {
    type: String,
    index:true
  },
  data:{
    type:String
  },
  serverPopularity:{
    type:Number
  },
  lastAccessedDate:{
    type:Date
  },
  serverId:{
    type:String
  }
});

var serverDatabase = module.exports = mongoose.model('serverDatabase', serverDatabaseSchema);

module.exports.getServerCacheList = function(serverId,callback){
    var query = {serverId:serverId};
    serverDatabase.find(query,callback);
}

module.exports.saveToServer = function(newServerData,callback){
    newServerData.save(callback);
}

module.exports.updateServerData = function(id,updatedServerData,callback){
    var query = {_id:id}
    serverDatabase.findOneAndUpdate(query,{$set:{updateServerData}},callback);
}

module.exports.getServerDatabaseonKeyword = function(keyword,serverId, callback){
	var query = {$and:[{keyword:keyword},{serverId:serverId}]};
	serverDatabase.find(query, callback);
}
