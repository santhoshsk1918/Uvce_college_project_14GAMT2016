var express = require('express');
var routes = express.Router();

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/userModel');

//Register
routes.get('/register',function(req,res){
  res.render('register')
});

//Login
routes.get('/login',function(req,res){
  res.render('login')
});

routes.post('/register',function(req,res){

  var otherErrors;

  var registrationError = [];

  //Getting Variables from form
  var buType = req.body.buType;
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  //Validation of form fields
  //  req.checkBody('buType','Please Select who u are??').matches('Buyer').matches('AavishkAdmin').matches('Seller');
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(user){
      otherErrors = {msg:"Username Already Exists"}
      registrationError.push(otherErrors);


      var errors = req.validationErrors();
      // console.log(errors);

      var formData = {
        name: name,
        usertype:buType,
        email:email,
        username: username,
        password: password,
        password2:password2
      }


      if(errors.length > 0 || registrationError.length > 0){
        res.render('register',{
          errors:errors,
          registrationError:registrationError,
          Data:formData
        });
      } else{
        var newUser = new User({
          name: name,
          usertype:buType,
          email:email,
          username: username,
          password: password
        });

        // console.log(newUser);

        User.createUser(newUser, function(err, user){
          if(err) throw err;
          // console.log(user);
        });

        req.flash('success_msg', 'You are registered and can now login');

        res.redirect('/users/login');
      }
    }
  });

});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});

      }

      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

  routes.post('/login', passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

  routes.get('/logout', function(req, res){
    req.logout();

    req.flash('success_msg', 'You are logged out');

    res.redirect('/users/login');
  });

  module.exports = routes;
