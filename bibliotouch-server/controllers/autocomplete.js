var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');

var router = express.Router();

router.get('/:query', function(req, res){
    let matchOption = {
        limit : 5,
        type : 'count',
        beginsWith : req.params.query
    };

    index.match(matchOption)
        .then(function(matches){
            res.type('application/json');
            res.send(JSON.stringify(matches));
        });
});

module.exports = router;