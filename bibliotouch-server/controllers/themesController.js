var express = require('express');
var sw = require('stopword');
var Logger = require('../helpers/logger');
var Themes = require('../models/themes');
var index = require('../helpers/searchIndex');
var authorities = require('../models/authorities');

var router = express.Router();

router.get('/', function(req, res){
    res.type('application/json');
    res.send(JSON.stringify(Themes.getThemes()));
});

router.get('/:theme', function(req, res){
    res.type('application/json');
    if(Themes.getThemes()[req.params.theme] != null){
        res.send(JSON.stringify(Themes.getThemes()[req.params.theme]));
    } else {
        res.send(JSON.stringify(Themes.getEmptyTheme()));
    }
});

router.get('/:theme/books', function(req, res){
    res.type('application/json');
    if(Themes.getThemes()[req.params.theme] != null){
        let idsToRetrieve = [];
        Themes.getThemes()[req.params.theme].vedettes.forEach(function(vedette) {
            Array.prototype.push.apply(idsToRetrieve, authorities.getAuthorities()[vedette].books)
        });

        let uniqueIds = idsToRetrieve.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        })

        index.get(uniqueIds)
                .then(function(books){
                    res.send(JSON.stringify(books));
                });
    } else {
        res.send(JSON.stringify([]));
    }
});

module.exports = router;