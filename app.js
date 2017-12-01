var express = require('express');
var todoController = require('./controllers/mainController');

var app = express();

//set up templete engine
app.set('view engine', 'ejs');

//static files
app.use(express.static('./public'));

var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({secret: 'anystringoftext',
				 saveUninitialized: true,
				 resave: true}));

//fire controllers
todoController(app);

//listen to port
app.listen(8080);
console.log('You are listening to port 8080');