var XmlStream = require('xml-stream');
var parseXmlString = require('xml2js').parseString;
var request = require('request-promise-native');
var fs = require('fs');
var path = require('path');
var Logger = require('../../helpers/logger');
var config = require('config');
var BiblioItems = require('./biblioitems');
var coverDownloader = require('../../helpers/coverDownloader');
var authorityManager = require('../../models/authorities');

var Readable = require('stream').Readable;

var batchSize = 3000;
var maxOAIPMHExports = 3000;
var kohaTags = config.get('Bibliotouch.koha.kohaTags');
var lastUpdateFilename = 'data/lastUpdate.json';
var oaipmhEndpoint = config.get('Bibliotouch.koha.oaipmhEndpoint');
var weirdWordRegex = /([\w]*[áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]+[\w]*([áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]+[\w]*)*)/g;
var weirdA = /[áàâäãåÁÀÂÄÃÅ]/g;
var weirdC = /[çÇ]/g;
var weirdE = /[éèêëÉÈÊË]/g;
var weirdI = /[íìîïÍÌÎÏ]/g;
var weirdN = /[ñÑ]/g;
var weirdO = /[óòôöõÓÒÔÖÕ]/g;
var weirdU = /[úùûüÚÙÛÜ]/g;
var weirdY = /[ýÿÝŸ]/g;
var weirdAE = /[æÆ]/g;
var weirdOE = /[œŒ]/g;

var KohaImporter = function() {
    BiblioItems.sync().catch(function (err) {
        console.log(err);
        Logger.log('error',err);
    });
}


var getNormalizedWords = function(biblioObject){
    let normalizedWords = [];
    JSON.stringify(biblioObject).replace(weirdWordRegex,function(match){
        let normalizedWord = match
                                .replace(weirdA,'a')
                                .replace(weirdAE,'ae')
                                .replace(weirdC,'c')
                                .replace(weirdE,'e')
                                .replace(weirdI,'i')
                                .replace(weirdN,'n')
                                .replace(weirdO,'o')
                                .replace(weirdOE,'oe')
                                .replace(weirdU,'u')
                                .replace(weirdY,'y');
        if(normalizedWords.indexOf(normalizedWord) == -1){
            normalizedWords.push(normalizedWord);
        }
    });
    return normalizedWords;
}

var updateLastUpdateFile = function(date){
    let updateDate = date ||new Date();
    let importDate = {
        lastUpdate : updateDate.getTime()
    };

    fs.writeFile(lastUpdateFilename, JSON.stringify(importDate), function(err){
        if (err) {
            Logger.log('error',err);
        }
    });
}

var getMostRecentTimestamp = function(oldTimeStamp, newTimeStamp){
    if(oldTimeStamp < newTimeStamp){
        oldTimeStamp = newTimeStamp
    }
    return oldTimeStamp;
}

KohaImporter.prototype.import = function(){
    let self = this;
    var mostRecentTimeStamp = new Date(1970,00,01);
    async function importPromise(resolve, reject){
        var recordStream = new Readable( {objectMode: true} )
        
        let nbDocs;
        try{
            nbDocs = await BiblioItems.count();
        } catch(e){
            reject(e);
            Logger.log('error',e);
            return;
        }
        let nbToProcess = nbDocs;
        let nbProcessed = 0;
        authorityManager.flushAuthorities();

        while (nbToProcess > 0) {
            let nbToRetrieve = nbToProcess >= batchSize ? batchSize : nbToProcess;
            nbToProcess -= nbToRetrieve;

            let instances;
            try{
                instances = await BiblioItems.findAll({limit:nbToRetrieve, offset:nbProcessed});
            } catch(e){
                console.log(e);
            }
            for (var index = 0; index < instances.length; index++) {
                var instance = instances[index];
                let record = {};
                try{
                    let jsonRecord = await new Promise(function(resolve, reject){
                        parseXmlString(instance.get('marcxml'),function(err, result){
                            if(err){
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        })
                    });
                    record = await self.parseRecordObject(jsonRecord.record);
                    let mostRecentTimeStamp2 = getMostRecentTimestamp(mostRecentTimeStamp, instance.get('timestamp'));//Weird behaviour
                    mostRecentTimeStamp = mostRecentTimeStamp2;
                    recordStream.push(record);
                } catch(e){
                    console.log(e);
                }
                
            }
            nbProcessed += nbToRetrieve;
        }
        recordStream.push(null);

        updateLastUpdateFile(mostRecentTimeStamp);
        authorityManager.saveAuthorities();

        resolve(recordStream);
    }
    return new Promise(importPromise);
}

KohaImporter.prototype.update = function(){
    var self = this;
    
    async function updatePromise(resolve, reject){
        var recordStream = new Readable( {objectMode: true} )
        let importDate = require('../../'+lastUpdateFilename);
        let lastUpdate = new Date(importDate.lastUpdate);
        let today = new Date();
        let lastUpdateString = `${lastUpdate.getUTCFullYear()}-${(lastUpdate.getUTCMonth()+1) < 10 ? '0'+(lastUpdate.getUTCMonth()+1) : (lastUpdate.getUTCMonth()+1)}-${lastUpdate.getUTCDate() < 10 ? '0'+lastUpdate.getUTCDate() : lastUpdate.getUTCDate()}`;
        let todayString = `${today.getUTCFullYear()}-${(today.getUTCMonth()+1) < 10 ? '0'+(today.getUTCMonth()+1) : (today.getUTCMonth()+1)}-${today.getUTCDate() < 10 ? '0'+today.getUTCDate() : today.getUTCDate()}`
        let index = 0;
        let newRecords = 0;
        let nbProcessed = maxOAIPMHExports;

        let info = 'Update started';
        Logger.log('info', info);
        console.log(info);

        while (nbProcessed == maxOAIPMHExports) {
            let updateUrl = oaipmhEndpoint+`/request?verb=ListRecords&resumptionToken=marcxml/${index}/${lastUpdateString}/${todayString}/`;
            console.log(`Requesting ${updateUrl}`);
            var data = {};
            try{
                data = await request(updateUrl)
                await new Promise(function(resolve, reject){
                        parseXmlString(data, async function (err, result) {
                            if(!err){
                                //If no new record, ListRecords[0] is empty
                                if(result['OAI-PMH'].ListRecords[0].record == undefined){
                                    nbProcessed = maxOAIPMHExports-1;
                                    resolve();
                                    return;
                                }
                                let nbDocs = result['OAI-PMH'].ListRecords[0].record.length;
                                nbProcessed = nbDocs;
                                for (var index = 0; index < nbDocs; index++) {
                                    var element = result['OAI-PMH'].ListRecords[0].record[index];
                                    let record = await self.parseRecordObject(element.metadata[0].record[0]);
                                    recordStream.push(record);
                                    newRecords++;
                                }
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
            } catch(e){
                    Logger.log('error',e);
            }
            index += nbProcessed;
        }

        console.log(`Records updated : ${newRecords}`);
        recordStream.push(null);

        
        updateLastUpdateFile();
        authorityManager.saveAuthorities();


        resolve(recordStream);
        
    }

    return new Promise(updatePromise);
}

KohaImporter.prototype.parseRecordObject = function(record){

    //Helper functions
    var retrieveTextFromMultipleSubfields = function(datafield, codes, separator) {
        var returnValue=null;
        separator = (separator === undefined) ? ' ' : separator;
        datafield.subfield.forEach(function(subfield){
            if(codes.indexOf(subfield.$.code) != -1){
                if(subfield._){
                    if(returnValue===null){
                        returnValue = '';
                    } else {
                        returnValue += separator;
                    }
                    returnValue += subfield._;
                }
            }
        });
        return returnValue;
    }

    var retrieveMultipleTextsFromMultipleSubfields = function(datafield, codes) {
        var returnValue=[];
        datafield.subfield.forEach(function(subfield){
            if(codes.indexOf(subfield.$.code) > -1){
                if(subfield._){
                    returnValue.push(subfield._);
                }
            }
        });
        return returnValue;
    }

    var getTextFromSubfields = function (datafield, tag, separator) {
        if(tag.tag.indexOf(datafield.$.tag) === -1){
            return null;
        }else {
            return retrieveTextFromMultipleSubfields(datafield, tag.code, separator);
        }
    }

    var getMultipleTextsFromSubfields = function (datafield, tag) {
        if(tag.tag.indexOf(datafield.$.tag) === -1){
            return null;
        }else {
            return retrieveMultipleTextsFromMultipleSubfields(datafield, tag.code);
        }
    }

    //Core method
    return new Promise(function(resolve, reject){
        if(record != null){
            //console.log(result);
            let id = null;
            let isbn = null;        //010a
            let issn = null;        //011a
            let ismn = null;        //013a N
            let ean = null;         //073a N
            let title = null;       //200a
            let editor = null;      //210c
            let datePub = null;     //210d                  -- rarely clean
            let nbPages = null;     //215a                  -- rarely clean
            let note = null;        //300a N
            let noteBioIndex = null;//320a N
            let thesisInfo = null;  //328abcde N
            let thesisUrl = null;   //328u N
            let description = null; //330a
            let table = [];         //359b N
            let collection = null;  //410t N
            let uniformTitle = null;//500a N
            let formTitle = null;   //503a N
            let authorities = [];   //600-607,616ajxy   -- several
            let mainAuthorities = [];
            let freeIndex = [];     //610[a] N          -- several
            let cdu = [];           //675[a] N          -- several
            let dewey = null;       //676a N
            let lcc = null;         //680a+b N
            let otherClass = null;  //686a+2 N
            let authors = [];       //700a+b,701a+b,702a+b,710a+b,711a+b,712a+b  -- can be of multiple occurence


            record.datafield.forEach(function(datafield){
                
                let authorityObject = {
                    sub : [],
                    geo : [],
                    form : []
                };

                let tmp_isbn = getTextFromSubfields(datafield, kohaTags.isbn);
                isbn = tmp_isbn ? tmp_isbn : isbn;

                let tmp_issn = getTextFromSubfields(datafield, kohaTags.issn);
                issn = tmp_issn ? tmp_issn : issn;

                let tmp_ismn = getTextFromSubfields(datafield, kohaTags.ismn);
                ismn = tmp_ismn ? tmp_ismn : ismn;

                let tmp_ean = getTextFromSubfields(datafield, kohaTags.ean);
                ean = tmp_ean ? tmp_ean : ean;

                let tmp_title = getTextFromSubfields(datafield, kohaTags.title);
                title = tmp_title ? tmp_title : title;

                let tmp_editor = getTextFromSubfields(datafield, kohaTags.editor);
                editor = tmp_editor ? tmp_editor : editor;

                let tmp_datePub = getTextFromSubfields(datafield, kohaTags.datePub);
                datePub = tmp_datePub ? tmp_datePub : datePub;

                let tmp_nbPages = getTextFromSubfields(datafield, kohaTags.nbPages);
                nbPages = tmp_nbPages ? tmp_nbPages : nbPages;

                let tmp_note = getTextFromSubfields(datafield, kohaTags.note);
                note = tmp_note ? tmp_note : note;

                let tmp_noteBioIndex = getTextFromSubfields(datafield, kohaTags.noteBioIndex);
                noteBioIndex = tmp_noteBioIndex ? tmp_noteBioIndex : noteBioIndex;

                let tmp_thesisInfo = getTextFromSubfields(datafield, kohaTags.thesisInfo);
                thesisInfo = tmp_thesisInfo ? tmp_thesisInfo : thesisInfo;

                let tmp_thesisUrl = getTextFromSubfields(datafield, kohaTags.thesisUrl);
                thesisUrl = tmp_thesisUrl ? tmp_thesisUrl : thesisUrl;

                let tmp_description = getTextFromSubfields(datafield, kohaTags.description);
                description = tmp_description ? tmp_description : description;

                let tmp_table = getMultipleTextsFromSubfields(datafield, kohaTags.table);
                Array.prototype.push.apply(table, tmp_table);

                let tmp_collection = getTextFromSubfields(datafield, kohaTags.collection);
                collection = tmp_collection ? tmp_collection : collection;

                let tmp_uniformTitle = getTextFromSubfields(datafield, kohaTags.uniformTitle);
                uniformTitle = tmp_uniformTitle ? tmp_uniformTitle : uniformTitle;

                let tmp_formTitle = getTextFromSubfields(datafield, kohaTags.formTitle);
                formTitle = tmp_formTitle ? tmp_formTitle : formTitle;

                let tmp_mainAuthority = getTextFromSubfields(datafield, kohaTags.mainAuthority);
                if(tmp_mainAuthority){
                    authorityObject.main = tmp_mainAuthority;
                    mainAuthorities.push(tmp_mainAuthority);
                }

                let tmp_subAuthority = getMultipleTextsFromSubfields(datafield, kohaTags.subAuthority);
                Array.prototype.push.apply(authorityObject.sub, tmp_subAuthority);

                let tmp_geoAuthority = getMultipleTextsFromSubfields(datafield, kohaTags.geoAuthority);
                Array.prototype.push.apply(authorityObject.geo,tmp_geoAuthority);

                let tmp_dateAuthority = getTextFromSubfields(datafield, kohaTags.dateAuthority);
                tmp_dateAuthority ? authorityObject.date = tmp_dateAuthority : null;

                let tmp_formAuthority = getMultipleTextsFromSubfields(datafield, kohaTags.formAuthority);
                Array.prototype.push.apply(authorityObject.form, tmp_formAuthority);

                let tmp_freeIndex = getMultipleTextsFromSubfields(datafield, kohaTags.freeIndex);
                Array.prototype.push.apply(freeIndex, tmp_freeIndex);

                let tmp_cdu = getTextFromSubfields(datafield, kohaTags.cdu);
                tmp_cdu ? cdu.push(tmp_cdu) : null;
                
                let tmp_dewey = getTextFromSubfields(datafield, kohaTags.dewey);
                dewey = tmp_dewey ? tmp_dewey : dewey;

                let tmp_lcc = getTextFromSubfields(datafield, kohaTags.lcc);
                lcc = tmp_lcc ? tmp_lcc : lcc;

                let tmp_otherClass = getTextFromSubfields(datafield, kohaTags.otherClass);
                otherClass = tmp_otherClass ? tmp_otherClass : otherClass;

                let tmp_author = getTextFromSubfields(datafield, kohaTags.authors);
                tmp_author ? authors.push(tmp_author) : null;

                //If authorityObject has main, we add it to authorities
                if(authorityObject.main){
                    authorities.push(authorityObject);
                    //Here we should add content of auhtorityObject to Authority module
                }
            });

            //Remove duplicates from authorities
            /*
            let authorities_uniq = authorities.filter(function(elem, index,self){
                return index==self.indexOf(elem);
            });
            */

            //Find Koha id of the record
            record.controlfield.forEach(function(controlfield){
                if(controlfield.$.tag == '001'){
                    id = controlfield._;
                }
            });

            if(id == null){
                reject('No ID found.');
                return;
            }

            //Reference record in authority tree
            authorityManager.addBook(id, authorities);


            var bibliodocument = {
                id : id,
                isbn : isbn,
                issn : issn,
                ismn : ismn,
                ean : ean,
                title : title,
                editor : editor,
                datePub : datePub,
                nbPages : nbPages,
                note : note,
                noteBioIndex : noteBioIndex,
                thesisInfo : thesisInfo,
                thesisUrl : thesisUrl,
                description : description,
                table : table,
                collection : collection,
                uniformTitle : uniformTitle,
                formTitle : formTitle,
                authorities : authorities,
                mainAuthorities : mainAuthorities,
                freeIndex : freeIndex,
                cdu : cdu,
                dewey : dewey,
                lcc : lcc,
                otherClass : otherClass,
                authors : authors
            }

            //Do not download covers yet - Do downlaod
            coverDownloader.dlCover(bibliodocument);

            bibliodocument.normalizedWords = getNormalizedWords(bibliodocument);

            resolve(bibliodocument);
        } else {
            let cause = 'Marcxml is null';
            Logger.log('info',cause);
            reject(cause);
        }
    });
}

module.exports = KohaImporter;