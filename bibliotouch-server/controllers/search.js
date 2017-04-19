var express = require('express');
var Logger = require('../helpers/logger');
var index = require('../helpers/searchIndex');

var router = express.Router();

router.get('/:query', function(req, res){
    var response = '';
    index.search(req.params.query)
        .then(function(results){
            for (var index = 0; index < results.length; index++) {
                var document = results[index];
                response += JSON.stringify(document)+'\n';
            }
            res.send(response);
        });
});

module.exports = router;