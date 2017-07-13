var fs = require('fs');
var sw = require('stopword');
var Logger = require('../helpers/logger');
var Authorities = require('./authorities');

var themesFile = 'data/themes.json';

var themes;
var sortable;
var lastThemeDefinition;


/**
 * Module identifying and saving Themes from a set of Authorities
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module themes
 * @constructor
 */
var Themes = function(){
    this.defineThemes();
    lastThemeDefinition = new Date();
}


/**
 * Get Authorities from Authorities module and generates a list of themes.
 * Only keep the themes whose title appear at least 10 times.
 * 
 */
Themes.prototype.defineThemes = function(){
    
    themes = {};
    sortable = [];
    var stringToWrite = '', stringToWriteBinPack = '';
    var minOcc = 10;
    let authorities = Authorities.getAuthorities();

    for(var vedette in authorities){
        let vedette_inter = vedette
                    .replace(/[;._,\(\)]/g,'')
                    .replace(/ - /g,'')
                    .replace(/\w'/g,'')
                    .toLowerCase();
        let mots = sw.removeStopwords(sw.removeStopwords(vedette_inter.split(' '), sw.fr));
        mots.forEach(function(item){
            if(!themes[item]){
                themes[item] = {
                    occ : 1,
                    vedettes : [vedette],
                    name : item
                };
            } else {
                themes[item].occ++;
                themes[item].vedettes.push(vedette);
            }
        },this);
    }

    //Remove plurals of existing words
    for(var key in themes){
        if(key.endsWith('s') && key.length > 1 && themes[key.slice(0,-1)] != undefined){
            themes[key.slice(0,-1)].occ += themes[key].occ;
            Array.prototype.push.apply(themes[key.slice(0,-1)].vedettes, themes[key].vedettes);
            delete themes[key];
        }
    }
    
    //Remove basic masculine form of existing words
    for(var key in themes){
        if(key.endsWith('e') && key.length > 1 && themes[key.slice(0,-1)] != undefined){
            themes[key].occ += themes[key.slice(0,-1)].occ;
            Array.prototype.push.apply(themes[key].vedettes, themes[key.slice(0,-1)].vedettes);
            delete themes[key.slice(0,-1)];
        }
    }

    //Remove themes with less than 10 occ, else get number of books
    for(var key in themes){
        if(themes[key].occ < minOcc){
            delete themes[key];
        } else {
            themes[key].nbBooks = this.getNbBooksInTheme(key);
        }
    }

    //DEBUG FILES
    /*
    for (var key in themes){
        sortable.push([key, themes[key].occ, themes[key].nbBooks]);
    }

    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    sortable.forEach(function(item){
        stringToWrite += item[0]+';'+item[1]+'\n';
    }, this);

    sortable.forEach(function(item){
        let larg = Math.trunc((Math.sqrt(item[2])+1)*1.2);
        let haut = Math.trunc(item[2]/larg)+1;
        if(larg == NaN){
            console.log(item);
        }
        stringToWriteBinPack += larg+'x'+Math.trunc(haut*1.333)+'\n';
    }, this);


    fs.writeFile('data/pouet3.csv', stringToWrite, err => console.log('File written'));
    fs.writeFile('data/pouet3.txt', stringToWriteBinPack, err => console.log('File written'));
    fs.writeFile(themesFile, JSON.stringify(themes), err => console.log('File written'));
    */
}

/**
 * Returns the number of books for a given theme
 * 
 * @param {String} theme - The theme we are investigating
 * @returns {Number} - The number of books of the given theme
 */
Themes.prototype.getNbBooksInTheme = function(theme){
    let idsToRetrieve = [];

    themes[theme].vedettes.forEach(function(vedette) {
        Array.prototype.push.apply(idsToRetrieve, Authorities.getAuthorities()[vedette].books)
    });

    let uniqueIds = idsToRetrieve.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    })

    return uniqueIds.length;
}

/**
 * Returns the list of themes.
 * If there is more than 24 hours since last time the theme list was updated, we trigger an update.
 * 
 * @returns {Object} - The list of themes
 */
Themes.prototype.getThemes = function(){
    var hours = Math.abs(new Date() - lastThemeDefinition) / 36e5;
    if(hours >= 24){
        this.defineThemes();
    }
    return themes;
}

/**
 * Returns an empty theme object, may be useful in some cases
 * 
 * @returns {Object} - Empty theme object
 */
Themes.prototype.getEmptyTheme = function(){
    return {
        occ : 0,
        vedettes : [],
        nbBooks : 0
    }
}

module.exports = new Themes();