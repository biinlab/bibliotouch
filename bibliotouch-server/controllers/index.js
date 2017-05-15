var express = require('express');
var Logger = require('../helpers/logger');

var router = express.Router();

router.use('/search', require('./search'));
router.use('/autocomplete', require('./autocomplete'));

router.get('/', function(req, res, next){
    var response = 'Yo!';
    res.send(response);
});

module.exports = router;