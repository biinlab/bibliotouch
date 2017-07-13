/**
 * Express controller requesting Koha REST API endpoint without CORS complication
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module corsBypass
 */

var express = require('express');
var Logger = require('../helpers/logger');
var bodyParser = require('body-parser');
var request = require('request-promise-native');
var config = require('config');


var kohaRestAPI = config.get('Bibliotouch.koha.restApiEndpoint');


var jsonParser = bodyParser.json();

var router = express.Router();

router.get('/:query',jsonParser, function(req, res){
    
    request(kohaRestAPI + '/biblio/' + req.params.query)
        .then(function(body){
            res.contentType('application/json');
            res.send(body);
        });
});

module.exports = router;