var express = require('express');
var routes = express.Router();
var io = require('../app').app;
var server = require('../app').server;

var serverSelect = require('../models/serverSelectModel');

//Redirect to Home page

routes.get('/',ensureAuthenticated,checkServer,function(req,res){
  var server =  req.session.passport.server
  if(typeof server == 'undefined' || server == ""){
    res.redirect('/serverSelect');
  }else{
    res.render('index');

  }
});

routes.get('/serverSelect',ensureAuthenticated,function(req,res){
  serverSelect.getServerList(null,function(err,serverList){
    if(err) throw err;
    // console.log(serverList);
    res.render('serverSelect',{serverSelect:serverList});
  });
});

routes.post('/serverSelect',ensureAuthenticated,function(req,res){
  req.session.passport.server = req.body.serverId;
  res.render('index');
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
