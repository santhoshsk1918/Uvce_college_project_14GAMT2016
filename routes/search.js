var express = require('express');
var routes = express.Router();
var log4js = require('log4js');
var moment = require('moment');
var async = require('async');


var cloudDatabase = require('../models/cloudModel');
var serverDatabase =require('../models/serverModel');
var serverSelect = require('../models/serverSelectModel');


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
          // req.flash('success_msg', 'added Success Fully');
          res.render('index',{'success_msg':'added Successfully'});
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
            lastAccessedDate:moment().format('llll'),
            serverId:serverId
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
          res.render('addData',{"pageType":"searchData","error_msg":"Data for keyword not Found"});
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
routes.post('/editData',ensureAuthenticated,checkServer,function(req,res){
  var searchKeyword = req.body.dataKeyword;
  var datavalue = req.body.data;
  cloudDatabase.getCloudDatabaseforKeyWord(searchKeyword,function(err,cD){
    if(err) throw err;
    if(cD.length > 0){
      cD[0].data = datavalue;
      res.render('addData',{"pageType":"editData","returnData":cD[0]});
    }
  });
});


routes.post('/saveEditData',ensureAuthenticated,checkServer,function(req,res){
  var searchKeyword = req.body.dataKeyword;
  var datavalue = req.body.data;
  cloudDatabase.getCloudDatabaseforKeyWord(searchKeyword,function(err,cD){
    if(err) throw err;
    if(cD.length > 0){
      cD[0].data = datavalue;
      cloudDatabase.saveCloudDatabase(cD[0],function(err,data){
        logger.info("Data Updated");
      });
    }
  });
  cloudDatabase.getCloudDatabaseforKeyWord(searchKeyword,function(err,cD){

    if(err) throw err;
    if(cD.length > 0){
      var cloudData = cD[0];
      cloudDatabase.getCloudDatabaseList(null,function(err,cDatas){
        if(err) throw e;

        var cloudDataLength = cDatas.length + 1;

        var method = "";

        //assuming that "ro{p}" to be equal to 0.2 [edit  vs search Ratio]
        var ro = 0.2;

        //assuming that "k" shew index equals 0.75
        var shew = 0.75;

        //assuming total records in cloud is 300
        var sc = 300;

        var ic =25;

        var index;

        for(var i=0;i<cloudDataLength-1;i++){
          if(cDatas[i].keyword == searchKeyword){
            if((i/sc) <= (ro*shew*(sc/cloudDataLength))){
              logger.info("Invalidation and Push");
              serverSelect.getServerList(null,function(err,serverList){
                if(err) throw e;
                for(var s=0;s<serverList.length;s++){
                  serverDatabase.getServerDatabaseonKeyword(searchKeyword,serverList[s]._id,function(err,data){
                    if(err) throw err;
                    if(data.length > 0){
                      data[0].data = datavalue;
                      serverDatabase.saveToServer(data[0]);
                    }else{
                      logger.error("Issue Fetching the object for cloud populrity serverSelect")
                    }
                  });
                }
              });
              res.redirect("/");

            }
          }
        }
        serverSelect.getServerList(null,function(err,serverList){
          if(err) throw e;
          for(var s=0;s<serverList.length;s++){
            // console.log(serverList[s]._id);
            var serverIds = serverList[s]._id;
            serverDatabase.getServerDatabaseonKeyword(searchKeyword,serverList[s]._id,function(err,serverData){
              if(err) throw err;
              if(serverData.length > 0){

                serverDatabase.getServerCacheList(serverIds,function(err,serverDatas){
                  for(var j = 0; j<serverDatas.length;j++){
                    if(serverDatas[j].keyword == searchKeyword){
                      if((j/ic) <= (shew*(sc/cloudDatabase))){
                        serverData[0].data = datavalue;
                        serverDatabase.saveToServer(serverData[0]);
                      }else{
                        serverDatabase.removeServerData(serverData[0]);
                      }
                    }
                  }
                });
              }
            });

          }


        });
        res.redirect("/");
      });
    }else{
      logger.error("Some Issue finding data object Eddited");
    }
  })
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
