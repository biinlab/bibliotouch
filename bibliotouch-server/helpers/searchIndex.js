const JSONStream = require('JSONStream');
const fs = require('fs');
var path = require('path');
var searchIndex = require('search-index');
var Logger = require('./logger');


var searchIndexOption = {
    stopwords: require('stopword').fr,
    fieldOptions : {
        nbPages : {
            searchable : false
        }
    }
};


var Search = function(){
    this.index = null;
};

Search.prototype.initIndex = function(){
    let self = this;
    return new Promise(function(resolve, reject){
        if(!self.index){
            searchIndex(searchIndexOption, function(err, newIndex) {
                if(!err){
                    self.index = newIndex;
                    resolve();
                } else {
                    let cause = 'Index initialization failed';
                    console.log(cause);
                    Logger.log('error', cause, err);
                    reject(err);
                }
            });
        } else {
            resolve();
        }
    });
}

Search.prototype.flushIndex = function(){
    let self = this;
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }
        self.index.flush(function(err){
            if(err){
                Logger.log('error', err);
                reject(err);
            } else {
                console.log('Search index flushed');
                Logger.log('info', 'Search index flushed.');
                resolve();
            }
        })
    });
}

Search.prototype.fillIndexFromFile = function(){
    let self = this;
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }
        fs.createReadStream(path.join(__dirname, '../index.str'))
            .pipe(JSONStream.parse())
            .pipe(self.index.defaultPipeline())  // vectorize
            .pipe(self.index.add())
            .on('data', function(d) {
                // this function needs to be called if you want to listen for the end event
            })
            .on('end',function(){
                console.log('Index created.');
                resolve();
            })
            .on('error',function(error){
                reject(error);
            });
            
    });
}

Search.prototype.fillIndexFromStream = function(stream){
    let self = this;
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }
        if(!stream){
            let cause = 'Input stream is null.';
            reject(cause);
            Logger.log('error',cause);
        }
        stream.pipe(self.index.defaultPipeline())  // vectorize
            .pipe(self.index.add())
            .on('data', function(d) {
                // this function needs to be called if you want to listen for the end event
            })
            .on('end',function(){
                console.log('Index created.');
                resolve();
            })
            .on('error',function(error){
                reject(error);
            });
            
    });
}

Search.prototype.search = function(query){
    let self = this;
    let results = [];
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }

        self.index.search(query)
            .on('data',function(doc){
                results.push(doc);
            })
            .on('end',function(bleh){
                resolve(results);
            })
            .on('error',function(err){
                reject(err);
            });
    });
    
}

Search.prototype.match = function(query){
    let self = this;
    let results = [];

    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }
        self.index.match(query)
                    .on('data', function(match){
                        results.push(match);
                    })
                    .on('end', function(){
                        resolve(results);
                    })
                    .on('error', function(err){
                        reject(err);
                    });
    })
}

module.exports = new Search();