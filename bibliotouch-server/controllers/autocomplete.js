var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');
var bodyParser = require('body-parser');

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
        limit : 5,
        type : 'count',
        beginsWith : beginsWith,
        field: field
    };

    index.match(matchOption)
        .then(function(matches){
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
        limit : 5,
        type : 'count',
        beginsWith : beginsWith,
        field: field
    };

    index.match(matchOption)
        .then(function(matches){
            res.json(matches);
        });
})

module.exports = router;