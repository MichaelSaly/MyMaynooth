var express = require('express');
var todoController = require('./controllers/mainController');

var app = express();

//set up templete engine
app.set('view engine', 'ejs');
app.enable('trust proxy');

//static files
app.use(express.static('./public'));

//fire controllers
todoController(app);

//listen to port
app.listen(8080);
console.log('You are listening to port 8080');