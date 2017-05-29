var express = require('express');
var Logger = require('../helpers/logger');

var router = express.Router();

router.use('/search', require('./search'));
router.use('/autocomplete', require('./autocomplete'));
router.use('/themes', require('./themesController'));

module.exports = router;