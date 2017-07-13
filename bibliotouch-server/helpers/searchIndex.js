const JSONStream = require('JSONStream');
const fs = require('fs');
var path = require('path');
var searchIndex = require('search-index');
var Logger = require('./logger');
var coverDownloader = require('./coverDownloader');


var searchIndexOption = {
    stopwords: require('stopword').fr,
    fieldOptions : {
        nbPages : {
            searchable : false
        }
    }
};


/**
 * Module wrapping search-index APIs with Promises
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module searchIndex
 */
/** @constructor */
var Search = function(){
    this.index = null;
};

/**
 * Init the search-index
 * 
 * @returns {Promise}
 */
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

/**
 * Flush the index
 * 
 * @returns {Promise}
 */
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

/**
 * Reads a JSON file and fill the index using it
 * (unused)
 * 
 * @returns {Promise}
 */
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

/**
 * Fills the index from a stream of documents
 * 
 * @param {Stream} stream 
 * @returns {Promise}
 */
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

/**
 * Search Documents using a query object or Array
 * 
 * @param {Object} query 
 * @returns {Promise}
 */
Search.prototype.search = function(query){
    let self = this;
    let results = [];
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }

        self.index.search(query)
            .on('data',function(doc){
                doc.document.hasCover = coverDownloader.hasCover(doc.id);
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

/**
 * Returns the number of documents correspondinf to the given query
 * 
 * @param {Object} query 
 * @returns {Promise}
 */
Search.prototype.totalHits = function(query){
    let self = this;
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }

        self.index.totalHits(query, function(err,counts){
            if(err){
                reject(err);
            } else {
                resolve(counts);
            }
        })
    });
}

/**
 * Retrieve documents for the given ids Array
 * 
 * @param {Array} ids 
 * @returns {Promise}
 */
Search.prototype.get = function(ids){
    let self = this;
    let docs = [];
    return new Promise(async function(resolve, reject){
        if(!self.index){
            await self.initIndex();
        }

        self.index.get(ids).on('data', function(doc){
            doc.hasCover = coverDownloader.hasCover(doc.id);
            docs.push(doc);
        }).on('end', function(){
            resolve(docs);
        }).on('error', function(err){
            reject(err);
        })
    })
}

/**
 * Returns autosuggestion results for a given word
 * 
 * @param {String} query 
 * @returns {Promise} 
 */
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