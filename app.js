// Require installed npm modules
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const passport = require("passport")
const session = require('express-session')
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const findOrCreate = require("mongoose-findorcreate")

const app = express(); // Create a Express APP

app.set("view engine", "ejs"); // ejs setup using express
app.use(express.static("public")); // This command will instruct our App to use Static files such as CSS, images
app.use(bodyParser.urlencoded({extended: true})); // Instructing our app to use required body parser module
app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect("mongodb://127.0.0.1:27017/userDB")


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id, username:profile.displayName }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home")
});

app.route("/login")
    .get(function (req, res) {
    res.render("login")
})
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, function (err) {
            if (err){
                console.log(err)
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route("/register")
    .get(function (req, res) {
    res.render("register")
})
    .post(function (req, res) {
        User.register({username: req.body.username}, req.body.password, function (err, user) {
            if (err){
                console.log("err")
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, function (){
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route("/logout")
    .get(function (req, res) {
        req.logout()
        res.redirect("/")
    })

app.route("/secrets")
    .get(function (req, res){
        User.find({"secret": {$ne: null}}, function (err, foundUser) {
            if (err){
                console.log(err)
            } else {
                if (foundUser)
                res.render("secrets", {usersWithSecrets: foundUser})
            }
        })
    })

app.route('/auth/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }));

app.route('/auth/google/secrets')
    .get(passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
        res.redirect("/secrets")
    })

app.route("/submit")
    .get(function (req, res) {
        if (req.isAuthenticated()){
            res.render("submit")
        } else {
            res.redirect("/login")
        }
    })
    .post(function (req, res) {
        const submittedSecret = req.body.secret
        console.log(req.user.id)
        User.findById(req.user.id, function (err, foundUser) {
            if (err){
                console.log(err)
            } else{
                if (foundUser){
                    foundUser.secret = submittedSecret
                    foundUser.save(function () {
                        res.redirect("/secrets")
                    })
                }
            }
        })
    })

app.listen(process.env.PORT || 3000, function () { //process.env.PORT is code used for Heroku to deploy app.
    console.log("Server is up and running");
})
