/**
 * Main Express controller
 * 
 */

var express = require('express');
var Logger = require('../helpers/logger');

var router = express.Router();

router.use('/search', require('./search'));
router.use('/autocomplete', require('./autocomplete'));
router.use('/themes', require('./themesController'));
router.use('/total-hits', require('./totalHits'));
router.use('/cors-bypass/availability', require('./corsBypass'));

module.exports = router;