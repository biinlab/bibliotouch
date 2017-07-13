/**
 * Express controller returning autosuggestions
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module autocomplete
 */

var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');
var bodyParser = require('body-parser');
var uniq = require('uniq');

var jsonParser = bodyParser.json();

var router = express.Router();

router.get('/:query',jsonParser, function(req, res){

    let beginsWith='';
    let field='';

    if(req.body.query){
        beginsWith = req.body.query.text;
        field = req.body.query.field;
    } else {
        beginsWith = req.params.query;
        field = '*';
    }

    let matchOption = {
        limit : 3,
        type : 'ID',
        beginsWith : beginsWith,
        field: field,
        threshold: 2
    };

    index.match(matchOption)
        .then(function(matches){
            //We only want to transmit the number of books, not the list
            if(matches.length > 0) {
                for(let i = 0 ; i < matches.length ; i++){
                    uniq(matches[i][1]);
                    matches[i][1] = matches[i][1].length;
                }
            }
            res.json(matches);
        });
});

router.post('/', jsonParser, function (req, res) {

    let beginsWith='';
    let field='';

    if(req.body.query){
        beginsWith = req.body.query.text;
        field = req.body.query.field;
    } else {
        beginsWith = req.params.query;
        field = '*';
    }

    let matchOption = {
        limit : 3,
        type : 'ID',
        beginsWith : beginsWith,
        field: field,
        threshold: 2
    };

    index.match(matchOption)
        .then(function(matches){
            //We only want to transmit the number of books, not the list
            if(matches.length > 0) {
                for(let i = 0 ; i < matches.length ; i++){
                    uniq(matches[i][1]);
                    matches[i][1] = matches[i][1].length;
                }
            }
            res.json(matches);
        });
})

module.exports = router;