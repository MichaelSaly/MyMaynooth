var bodyParser = require('body-parser');

var firebase = require("firebase");
require("firebase/database");
require("firebase/auth");

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


    app.get('/', function(req, res){
        console.log('GET index');

        if(firebase.auth().currentUser) {
            
            res.redirect('/home');
        } else {

            res.render('index', {
                title: "Home",
                loggedInState: firebase.auth().currentUser
            });
        }
    });

    app.get('/register', function(req, res){
        console.log('GET register');

        if(firebase.auth().currentUser) {
            
            res.redirect('/home');
        } else {

            res.render('register', {
                title: "Register",
                loggedInState: firebase.auth().currentUser
            });
        }
    });

    app.post('/register', urlencodedParser, function(req, res){
        console.log('POST register');

        var _name = req.body._name;
        var _email = req.body._email;
        var _password = req.body._password;
        var _password2 = req.body._password2;
        var _degree = req.body._degree;
        var _age = req.body._age;

        if(_password != _password2) //TODO (validation)
            passwordNotMatch(); //TODO
        else {
            firebase.auth().createUserWithEmailAndPassword(_email, _password).catch(function(error) {
                console.log(error.message); //TODO (user alreasdy exists?)
                var errorMessage = error.message;
            }).then(function(){
                firebase.auth().signInWithEmailAndPassword(_email, _password).catch(function(error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log("login failed. reason: ");
                    console.log(errorMessage);
                }).then(function(){
                    userRef.child(firebase.auth().currentUser.uid).set({
                        name: _name,
                        email: _email,
                        password: _password,
                        degree: _degree,
                        age: _age,
                        registered: Date(),
                        lastLogIn: Date(),
                        accountType: 'user'
                    });

                    res.redirect('home');
                });
            });
        }
    });

    function passwordNotMatch() {
        console.log("passwords do not match");
    }

    app.get('/login', function(req, res){
        console.log('GET login');

        if(firebase.auth().currentUser) {
                
            res.redirect('/home');
        } else {

            res.render('login', {
                title: "Login",
                login: true,
                loggedInState: firebase.auth().currentUser
            });
        }
    });

    app.post('/login', urlencodedParser, function(req, res){
        console.log('POST login');    

        var _email = req.body._email;
        var _password = req.body._password;

        firebase.auth().signInWithEmailAndPassword(_email, _password).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("login failed. reason: ");
            console.log(errorMessage);
        }).then(function(){
            userRef.child(firebase.auth().currentUser.uid).update({lastLogIn: Date()});

            res.redirect('home');
        });
    });

    app.get('/home', function(req, res){
        console.log('GET home');

        if(firebase.auth().currentUser) {            
            res.render('home', {
                title: "Home",
                loggedInState: firebase.auth().currentUser
            });
        } else {

            res.redirect('login');
        }
    });

    app.get('/logout', function(req, res){
        console.log('GET logout');

        firebase.auth().signOut();

        res.render('index', {
            title: "Logged Out",
            loggedInState: firebase.auth().currentUser
        });
    });

    app.get('/admin', function(req, res){
        console.log('GET admin');

        res.render('admin', {
            title: "Administrative section",
            loggedInState: firebase.auth().currentUser
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
    
    app.get('/events', function(req, res){
        console.log('GET events');

        if(firebase.auth().currentUser) {
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
                    data: eSnapData,
                    loggedInState: firebase.auth().currentUser
                });
            });    
        } else {

            res.redirect('login');
        }
    });

    app.get('/event/:e', function(req, res) {
        console.log("GET event " + req.params.e);

        if(firebase.auth().currentUser) {
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
                    loggedInState: firebase.auth().currentUser
                });
            });
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

    app.get('/eg', function(req, res){
        res.render('eg', {
            title: "Home",
            loggedInState: firebase.auth().currentUser
        });
    });
};


/*
Ideas: timout log out
popular posts
*/

