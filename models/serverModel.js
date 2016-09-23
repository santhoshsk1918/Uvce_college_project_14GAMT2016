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
  serverPopularity:{
    type:Number
  },
  lastAccessedDate:{
    type:Date
  }
});

var cloudDatabase = module.exports = mongoose.model('cloudDatabase', cloudDatabaseSchema);
