
var fs = require('fs');
var Logger = require('../helpers/logger');

var authoritiesFile = 'data/authorities.json';

var mainLength = 0;
var authorities = {};
authorities.nbMain = 0;
authorities.nbBooks = 0;
authorities.books = [];

var Authorities = function(){
    this.loadAuthorities();
}

Authorities.prototype.saveAuthorities = function(){
    fs.writeFile(authoritiesFile, JSON.stringify(authorities), function(err){
        if (err) {
            Logger.log('error',err);
        }
    });
}

Authorities.prototype.loadAuthorities = function(){
    try{
        authorities = require('../'+authoritiesFile);
        console.log('Authorities succesfully loaded');
    } catch(e){
        let msg = 'Error while loading authorities.';
        console.log(msg);
        Logger.log('error', msg);
    }
}

Authorities.prototype.addMain = function(mainAuth){
    if(!authorities[mainAuth]){
        authorities[mainAuth] = {};
        authorities[mainAuth].nbSub = 0;
        authorities[mainAuth].nbBooks = 0;
        authorities[mainAuth].books = [];
        authorities.nbMain++;
    }
}

Authorities.prototype.addSub = function(main, sub){
    this.addMain(main);
    if(!authorities[main][sub]){
        authorities[main][sub] = {};
        authorities[main][sub].nbSubSub = 0;
        authorities[main][sub].nbBooks = 0;
        authorities[main][sub].books = [];
        authorities[main].nbSub++;
    }
}

Authorities.prototype.addSubSub = function(main, sub, subsub){
    this.addSub(main, sub);
    if(!authorities[main][sub][subsub]){
        authorities[main][sub][subsub] = {};
        authorities[main][sub][subsub].nbBooks = 0;
        authorities[main][sub][subsub].books = [];
        authorities[main][sub].nbSubSub++;
    }
}

Authorities.prototype.addBook = function(book, authorityList){
    
    let vedetteTree = {};

    if(authorityList.length == 0){
        authorities.books.push(book);
    }

    authorityList.forEach(function(authority){
        //Tête de vedette > sous vedettes > chronologie > geographie > forme
        let vedettes = [];
        if(authority.main) {
            vedettes.push(authority.main);
        }
        Array.prototype.push.apply(vedettes, authority.sub);
        if(authority.date){
            vedettes.push(authority.date);
        }
        Array.prototype.push.apply(vedettes, authority.geo);
        Array.prototype.push.apply(vedettes, authority.form);

        switch(vedettes.length){
            case 0 :
                authorities.books.push(book);
                break;
            case 1 :
                vedetteTree[vedettes[0]] = {};
                this.addMain(vedettes[0]);
                authorities[vedettes[0]].books.push(book);
                break;
            case 2 :
                vedetteTree[vedettes[0]] = {};
                vedetteTree[vedettes[0]][vedettes[1]] = {};
                this.addSub(vedettes[0],vedettes[1]);
                authorities[vedettes[0]][vedettes[1]].books.push(book);
                break;
            default :
                vedetteTree[vedettes[0]] = {};
                vedetteTree[vedettes[0]][vedettes[1]] = {};
                vedetteTree[vedettes[0]][vedettes[1]][vedettes[2]] = {};
                this.addSubSub(vedettes[0],vedettes[1],vedettes[2]);
                authorities[vedettes[0]][vedettes[1]][vedettes[2]].books.push(book);
        }
    }, this);

    for(var vedette in vedetteTree){
        authorities[vedette].nbBooks++;
        for(var ssvedette in vedetteTree[vedette]){
            authorities[vedette][ssvedette].nbBooks++;
            for(var ssssvedette in vedetteTree[vedette][ssvedette]){
                authorities[vedette][ssvedette][ssssvedette].nbBooks++;
            }
        }
    }
    authorities.nbBooks++;

}

module.exports = new Authorities();