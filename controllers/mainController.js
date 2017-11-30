var bodyParser = require('body-parser');

var firebase = require("firebase");
require("firebase/database");
require("firebase/auth");

var admin = require('firebase-admin');
var serviceAccount = require('../mymaynooth-53d4d-firebase-adminsdk-asw9a-f944c34d26.json');
var firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://mymaynooth-53d4d.firebaseio.com'
});

var config = {
    apiKey: "AIzaSyCmwykvFY_2SYwgRFhYbeZCiy79ab4-p4Y",
    authDomain: "mymaynooth-53d4d.firebaseapp.com",
    databaseURL: "https://mymaynooth-53d4d.firebaseio.com",
    projectId: "mymaynooth-53d4d",
    storageBucket: "",
    messagingSenderId: "674746588332"
};

firebase.initializeApp(config);
var database = firebase.database();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = function(app) {

    var userRef = firebase.database().ref('Users');
    var dealsRef = firebase.database().ref('Deals');
    var eventsRef = firebase.database().ref('Events');

    var userInfo = {};
    var li = function (req, res, next) {
        if(!loggedIn) {
            next();
        } else {
            firebase.auth().signInWithEmailAndPassword(currentPeopleLoggedIn[key].email, currentPeopleLoggedIn[key].password).then( function(data) {
                userRef.child(firebase.auth().currentUser.uid).on('value', function(snapshot) {
                    userInfo.name = snapshot.val().name;

                    next();
                }); 
            });
        }
    }

    function lo() {
        firebase.auth().signOut();
    }

    var loggedIn = false;
    var key;
    function checkifloggedin(ip) {
        for(var i = 0; i < currentPeopleLoggedIn.length+1; i++) {
            if(i == currentPeopleLoggedIn.length) {
                return false;
            }

            if(currentPeopleLoggedIn[i].ip == ip) {
                key = i;
                admin.auth().verifyIdToken(currentPeopleLoggedIn[i].token).then(function() {
                    //TODO
                    console.log('todo verify token');
                }).catch(function(error) {
                    console.log(error);
                });
                return true;
            }
        }   
    }

    var currentPeopleLoggedIn = [{}];
    app.post('/checkifloggedin', urlencodedParser, function(req, res){
        console.log('POST checkifloggedin');

        admin.auth().verifyIdToken(req.body.token).then(function(decodedToken) {
            currentPeopleLoggedIn.push({
                'uid': decodedToken.uid,
                'ip': req.ip,
                'token': req.body.token,
                'email': req.body.email,
                'password': req.body.password
            });
        }).catch(function(error) {
            console.log(error);
        });
        
        res.redirect('home');
    });
    
    app.get('/', function(req, res){
        console.log('GET index');
        loggedIn = checkifloggedin(req.ip);

        if(loggedIn) {

            res.redirect('home');
        } else {
            
            res.render('index', {
                title: "Home",
                loggedIn: loggedIn
            });
        }
    });

    app.get('/register', function(req, res){
        console.log('GET register');
        loggedIn = checkifloggedin(req.ip);

        if(loggedIn) {
            
            res.redirect('/home');
        } else {

            res.render('register', {
                title: "Register",
                loggedIn: loggedIn,
                error: '0'
            });
        }
    });

    app.post('/register', urlencodedParser, function(req, res){
        console.log('POST register');
        var registerSuccess = true;

        var _name = req.body._name;
        var _email = req.body._email;
        var _password = req.body._password;
        var _password2 = req.body._password2;
        var _degree = req.body._degree;
        var _age = req.body._age;

        if(_password != _password2) {//TODO (validation)
            res.render('register', {
                title: "Register",
                loggedIn: loggedIn,
                error: "Password do not match."
            })
        }
        else {
            firebase.auth().createUserWithEmailAndPassword(_email, _password).catch(function(error) {
                registerSuccess = false;
                console.log(error.message); //TODO (user alreasdy exists?)
                var errorMessage = error.message;

                res.render('register', {
                    title: "Register",
                    loggedIn: loggedIn,
                    error: error.message
                })
            }).then(function(){
                if(registerSuccess) {
                firebase.auth().signInWithEmailAndPassword(_email, _password).catch(function(error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log("login failed. reason: ");
                    console.log(errorMessage);
                }).then(function(){
                    userRef.child(firebase.auth().currentUser.uid).set({
                        email: _email,
                        password: _password,
                        degree: _degree,
                        age: _age,
                        registered: Date(),
                        lastLogIn: Date(),
                        accountType: 'user',
                        name: _name
                    });

                    res.render('login', {
                        title: "Login",
                        loggedIn: loggedIn,
                        registerSuccessMessage: "1"
                    }
                );
                });
                }
                lo();
            });
        }
    });

    function passwordNotMatch() {
        console.log("passwords do not match");
    }

    app.get('/login', function(req, res){
        console.log('GET login');
        loggedIn = checkifloggedin(req.ip);

        if(loggedIn) {

            res.redirect('home');
        } else {

            res.render('login', {
                title: "Login",
                loggedIn: loggedIn,
                registerSuccessMessage: ""
            });
        }
    });

    app.post('/login', urlencodedParser, function(req, res){
        console.log('POST login');
        res.redirect('login');
    });

    app.get('/home', li, function(req, res){
        console.log('GET home');
        loggedIn = checkifloggedin(req.ip);

        if(loggedIn) {

            res.render('home', {
                title: "Home",
                loggedIn: loggedIn,
                name: userInfo.name
            });
        } else {

            res.redirect('login');
        }
    });

    app.get('/logout', function(req, res){
        console.log('GET logout');

        for(var i = 1; i < currentPeopleLoggedIn.length; i++) {
            if(currentPeopleLoggedIn[i].ip == req.ip) {
                currentPeopleLoggedIn.splice(i, 1);
            }
        }

        loggedIn = false;

        res.render('index', {
            title: 'Logged Out',
            loggedIn: 0
        });
    });

    app.get('/admin', function(req, res){
        console.log('GET admin');

        res.render('admin', {
            title: "Administrative section",
            loggedIn: loggedIn
        });
    });

    app.post('/add/deal', urlencodedParser, function(req, res){
        console.log('POST add deal');    

        var _Dstore = req.body._Dstore;
        var _Dname = req.body._Dname;
        var _Dprice = req.body._Dprice;
        var _Dcategory = req.body._Dcategory;

        dealsRef.push({
            store: _Dstore,
            name: _Dname,
            price: _Dprice,
            category: _Dcategory,
            addedBy: "emptyForNow",
            dateAdded: Date()
        });

        res.redirect('admin');
    });

    app.post('/add/entertainment', urlencodedParser, function(req, res){
        console.log('POST add entertainment event');    

        var _Ename = req.body._Ename;
        var _Elocation = req.body._Elocation;
        var _Edescription = req.body._Edescription;
        var _Eprovider = req.body._Eprovider;
        var _Egenre = req.body._Egenre;

        eventsRef.push({
            name: _Ename,
            location: _Elocation,
            description: _Edescription,
            provider: _Eprovider,
            genre: _Egenre,
            addedBy: "emptyForNow",
            dateAdded: Date(),
            viewed: 0
        });

        res.redirect('../admin');
    });
    
    app.get('/events', li, function(req, res){
        console.log('GET events');
        loggedIn = checkifloggedin(req.ip);
        if(loggedIn) {
            var eSnapData = [];
            eventsRef.once("value").then(function(snap) {
                snap.forEach(function(childSnap){
                    eSnapData.push({
                        name: childSnap.val().name,
                        genre: childSnap.val().genre,
                        description: childSnap.val().description,
                        location: childSnap.val().location,
                        provider: childSnap.val().provider
                    });
                });
    
                res.render('events', {
                    title: "Events",
                    loggedIn: loggedIn,
                    data: eSnapData
                });
            }); 
        lo();   
        } else {

            res.redirect('login');
        }
    });

    app.get('/event/:e', li, function(req, res) {
        console.log("GET event " + req.params.e);
        loggedIn = checkifloggedin(req.ip);
        if(loggedIn) {
            console.log('here');
            var eSnapData = {};
            eventsRef.orderByChild("name").equalTo(req.params.e).on("child_added", function(snap) {
                eSnapData = ({
                    name: snap.val().name,
                    genre: snap.val().genre,
                    description: snap.val().description,
                    location: snap.val().location,
                    provider: snap.val().provider,
                });
                eventsRef.child(snap.key).update({
                    viewed: snap.val().viewed + 1
                });

                res.render('event-item', {
                    title: req.params.e,
                    data: eSnapData,
                    loggedIn: loggedIn
                });
            });
        lo();
        } else {

            res.redirect('../login');
        }
    });

    app.get('/deals', function(req, res){
        console.log('GET deals');

        if(firebase.auth().currentUser) {
            var dSnapData = [];
            dealsRef.once("value").then(function(snap) {
                snap.forEach(function(childSnap){
                    dSnapData.push({
                        name: childSnap.val().name,
                        price: childSnap.val().price,
                        category: childSnap.val().category,
                        store: childSnap.val().store
                    });
                });
    
                res.render('deals', {
                    title: "Deals",
                    data: dSnapData,
                    loggedInState: firebase.auth().currentUser
                });
            });    
        } else {

            res.redirect('login');
        }
    });

    app.get('/deal/:d', function(req, res) {
        console.log("GET event " + req.params.d);

        if(firebase.auth().currentUser) {
            var dSnapData = {};
            dealsRef.orderByChild("name").equalTo(req.params.d).on("child_added", function(snap) {
                dSnapData = ({
                    name: snap.val().name,
                    price: snap.val().price,
                    category: snap.val().category,
                    store: snap.val().store
                });
                dealsRef.child(snap.key).update({
                    viewed: snap.val().viewed + 1
                });

                res.render('deal-item', {
                    title: req.params.d,
                    data: dSnapData,
                    loggedInState: firebase.auth().currentUser
                });
            });
        } else {

            res.redirect('../login');
        }
    });

    // app.get('/bootstrap.min.css.map', function(req, res){
    //     res.send('ok');
    // });
    // app.get('/bootstrap.min.js.map', function(req, res){
    //     res.send('ok');
    // });
};


/*
Ideas: timout log out
popular posts
*/

