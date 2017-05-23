var express = require('express');
var Logger = require('../helpers/logger');
var Themes = require('../models/themes');

var router = express.Router();

router.get('/', function(req, res){
    res.type('application/json');
    res.send(JSON.stringify(Themes.getThemes()));
});

module.exports = router;