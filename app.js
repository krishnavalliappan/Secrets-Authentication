// Require installed npm modules
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express(); // Create a Express APP

app.set("view engine", "ejs"); // ejs setup using express

app.use(express.static("public")); // This command will instruct our App to use Static files such as CSS, images

app.use(bodyParser.urlencoded({extended: true})); // Instructing our app to use required body parser module

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = new mongoose.model("User", userSchema)

app.get("/", function (req, res) {
    res.render("home")
});

app.route("/login")
    .get(function (req, res) {
    res.render("login")
})
    .post(function (req, res) {
        const username = req.body.username
        const password = (req.body.password)
        User.findOne({email: username}, function (err, user) {
            if (err) {
                console.log(err)
            } else {
                if (user) {
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (result === true) {
                            res.render("secrets")
                        }
                    })
                }
            }
        })
    })

app.route("/register")
    .get(function (req, res) {
    res.render("register")
})
    .post(function (req, res) {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            const user = new User({
                email: req.body.username,
                password: hash
            })
            user.save(function (err){
                if (err){
                    console.log(err)
                }else {
                    res.render("secrets")
                }
            })
        })
    })

app.listen(process.env.PORT || 3000, function () { //process.env.PORT is code used for Heroku to deploy app.
    console.log("Server is up and running");
})
