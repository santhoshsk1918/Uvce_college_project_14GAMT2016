var express = require('express');
var routes = express.Router();

var cloudDatabase = require('../models/cloudModel');

routes.get('/addData',function(req,res){
  res.render('addData',{"pageType":"newData"});
});

routes.post('/addData',function(req,res){

  var dataKeyword = req.body.dataKeyword;
  var datavalue = req.body.data;

  req.checkBody('dataKeyword', 'Please Enter Keyword').notEmpty();

  var errors = req.validationErrors();
  var formData = {
    dataKeyword: dataKeyword,
    data:datavalue
  }
  if(errors){
    res.render('addData',{
      errors:errors,
      Data:formData,
      "pageType":"newData"
    });
  }else{
    cloudDatabase.getCloudDatabaseforKeyWord(dataKeyword,function(err,data){
      if(err) throw err;
      if(data){
        var newServerData = new cloudDatabase({
          keyword: dataKeyword,
          data:datavalue,
          cloudPopularity:0,
          lastAccessedDate:Date.now()
        });
        cloudDatabase.saveCloudDatabase(newServerData,function(err,data){
          req.flash('success_msg', 'added Success Fully');
          res.render('index');
        });
      }else{
        res.render('addData',{
          errors:errors,
          dataError:{"msg":"Key word already present please search the key word"},
          "pageType":"newData"
        });
      }
    });
  }
});


routes.get('/searchData',function(req,res){
  console.log(req.query.searchField);
});

module.exports = routes;
