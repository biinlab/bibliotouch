var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');

var router = express.Router();

router.get('/:query', function(req, res){
    let queryObject = {};
    queryObject.query = {
        AND : { '*' : [req.params.query] }
    };
    queryObject.pageSize = 400;

    index.search(queryObject)
        .then(function(results){
            res.type('application/json');
            res.send(JSON.stringify(results));
        });
});

module.exports = router;