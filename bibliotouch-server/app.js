var express = require('express');
var controllers = require('./controllers');

var app = express();
var serverPort = 8080;

app.use(controllers);

app.listen(serverPort, function () {
    console.log(`Server running on port ${serverPort}`)    
})

module.exports = app;