var express = require('express');
var routes = express.Router();
var log4js = require('log4js');
var moment = require('moment');


var cloudDatabase = require('../models/cloudModel');
var serverDatabase =require('../models/serverModel');

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/fwdas.log', category: 'fwdas' }
  ]
});

var logger = log4js.getLogger('fwdas');


routes.get('/addData',ensureAuthenticated,checkServer,function(req,res){
  res.render('addData',{"pageType":"newData"});
});

routes.post('/addData',ensureAuthenticated,checkServer,function(req,res){

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
          lastAccessedDate:moment().format('llll')
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


routes.get('/searchData',ensureAuthenticated,checkServer,function(req,res){
  console.time("responseTime");

  var start = new Date();
  var hrstart = process.hrtime();

  var searchKeyword = req.query.searchField;
  var serverId =req.session.passport.server

  serverDatabase.getServerDatabaseonKeyword(searchKeyword,serverId,function(err,serverData){
    if(err) throw err;
    if(serverData.length > 0){
      console.log();
      logger.debug("Data Found in the server");
      serverData[0].serverPopularity = serverData[0].serverPopularity + 1;
      serverData[0].lastAccessedDate = moment().format('llll');
      serverDatabase.saveToServer(serverData[0],function(err,cloudDatabase){
        if(err) throw err;
      });
      cloudDatabase.getCloudDatabaseforKeyWord(searchKeyword,function(err,cloudData){
        if(err) throw err;
        if(cloudData.length > 0){
          cloudData[0].cloudPopularity = cloudData[0].cloudPopularity + 1;
          cloudDatabase.saveCloudDatabase(cloudData[0],function(err,cloudData){
            if(err) throw err;
          });
        }else{
          logger.error('Issue for data object[found in server not found in ]' + searchKeyword);
        }

      });

      res.render('addData',{"pageType":"searchData","returnData":serverData[0]});


    }else{
      cloudDatabase.getCloudDatabaseforKeyWord(searchKeyword,function(err,cloudData){
        if(err) throw err;
        if(cloudData.length > 0){
          logger.debug("Data found in cloud database");
          var serverData = new serverDatabase({
            keyword: searchKeyword,
            data:cloudData[0].data,
            serverPopularity:1,
            lastAccessedDate:moment().format('llll')
          })
          serverDatabase.saveToServer(serverData,function(err,serverData){
            if(err) throw err;
            logger.debug("Server Data Saved");
          });
          // cloudData.cloudPopularity = cloudData.cloudPopularity + 1;
          console.log(cloudData[0].cloudPopularity);

          var cloudPopularity = cloudData[0].cloudPopularity + 1;
          cloudData[0].cloudPopularity = cloudPopularity;
          console.log(cloudPopularity);
          cloudDatabase.saveCloudDatabase(cloudData[0],function(err,cloudData){
            if(err) throw err;
          });
          res.render('addData',{"pageType":"searchData","returnData":cloudData[0]});
        }else{
          logger.debug("No Data found even in cloud database")
        }
      });
    }

    var end = new Date() - start,
    hrend = process.hrtime(hrstart);
    logger.info(hrend[1]/1000000 + "ms Response Time");

    console.log(hrend[1]/1000000 + "ms");
  });
});


function ensureAuthenticated(req, res, next){
  // console.log(req.session.passport.server + "SErver");
  if(req.isAuthenticated()){
    return next();
  } else {
    //req.flash('error_msg','You are not logged in');
    res.redirect('/users/login');
  }
}

function checkServer(req,res,next){
  var server =  req.session.passport.server
  if(typeof server == 'undefined' || server == ""){
    res.redirect("/serverSelect");
  }else{
    return next();
  }
}
module.exports = routes;
