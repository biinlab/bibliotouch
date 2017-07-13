/**
 * Express controller returning search results
 * We have to provide GET and POST because some libraries don't allow a body in a GET request
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module search
 */

var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();

var router = express.Router();

router.get('/:query',jsonParser, function(req, res){
    let queryObject = {};
    
    if(req.body.query){
        queryObject.query = JSON.parse(req.body.query);
    } else {
        queryObject.query = {
            AND : { '*' : [req.params.query] }
        };
    }
    
    queryObject.pageSize = 400;

    index.search(queryObject)
        .then(function(results){
            res.json(results);
        });
});

router.post('/',jsonParser, function(req, res){
    let queryObject = {};
    
    if(req.body.query){
        queryObject.query = JSON.parse(req.body.query);
    } else {
        queryObject.query = {
            AND : { '*' : [req.params.query] }
        };
    }
    
    queryObject.pageSize = 400;

    index.search(queryObject)
        .then(function(results){
            res.json(results);
        });
});

module.exports = router;