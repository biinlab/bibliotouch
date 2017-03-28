var express = require('express');
var Record = require('../models/record');
var Logger = require('../helpers/logger');

var router = express.Router();

router.get('/', function(req, res, next){
    var response = "";
    Record.findAll().then(function(records){
        records.forEach(function(element) {
            console.log(element.get().title);
            response += element.get().title;
        }, this);
    }, function (error) {
        response = 'Problem when retrieving records';
        Logger.log('error', 'Problem when retrieving Record', error);
    }).then(function(){
        res.send(response);
    });
});

module.exports = router;