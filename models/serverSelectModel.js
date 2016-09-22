var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var serverSelectSchema = mongoose.Schema({
  proxyServername: {
    type: String
  },
  serverName:{
    type:String
  }
});

var serverSelect = module.exports = mongoose.model('serverSelect', serverSelectSchema);

module.exports.getServerList = function(server, callback){
	var query = {};
	serverSelect.find(query, callback);
}

module.exports.saveServers = function(server,callback){
    server.save(callback);
}
