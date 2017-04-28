var XmlStream = require('xml-stream');
var parseXmlString = require('xml2js').parseString;
var request = require('request-promise-native');
var fs = require('fs');
var path = require('path');
var Logger = require('../../helpers/logger');
var config = require('config');
var BiblioItems = require('./biblioitems');

var Readable = require('stream').Readable

var batchSize = 3000;
var maxOAIPMHExports = 3000;
var kohaTags = config.get('Bibliotouch.koha.kohaTags');
var lastUpdateFilename = 'lastUpdate.json';
var oaipmhEndpoint = `http://cataloguebib.enssib.fr/cgi-bin/koha/oai.pl`;

var KohaImporter = function() {
    BiblioItems.sync().catch(function (err) {
        console.log(err);
        Logger.log('error',err);
    });
}

KohaImporter.prototype.import = function(){
    let self = this;
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
                    recordStream.push(record);
                } catch(e){
                    console.log(e);
                }
                
            }
            nbProcessed += nbToRetrieve;
        }
        recordStream.push(null);

        let importDate = {
            lastUpdate : Date.now()
        };

        fs.writeFile(lastUpdateFilename, JSON.stringify(importDate), function(err){
            if (err) {
                Logger.log('error',err);
            }
        })

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
                    reject(e);
            }
            index += nbProcessed;
        }

        console.log(`Records updated : ${newRecords}`);
        recordStream.push(null);

        
        let newImportDate = {
            lastUpdate : Date.now()
        };

        fs.writeFile(lastUpdateFilename, JSON.stringify(newImportDate), function(err){
            if (err) {
                Logger.log('error',err);
            }
        });


        resolve(recordStream);
        
    }

    return new Promise(updatePromise);
}

KohaImporter.prototype.parseRecordObject = function(record){

    //Helper functions
    var retrieveTextFromMultipleSubfields = function(datafield, codes, separator) {
        var returnValue=null;
        separator = (typeof separator === 'undefined') ? ' ' : separator;
        datafield.subfield.forEach(function(subfield){
            if(codes.indexOf(subfield.$.code) != -1){
                if(returnValue===null){
                    returnValue = '';
                } else {
                    returnValue += separator;
                }
                returnValue += subfield._;
            }
        });
        return returnValue;
    }

    var retrieveMultipleTextsFromMultipleSubfields = function(datafield, codes) {
        var returnValue=[];
        datafield.subfield.forEach(function(subfield){
            if(codes.indexOf(subfield.$.code) > -1){
                returnValue.push(subfield._);
            }
        });
        return returnValue;
    }

    //Datafield extractors
    var getTitle = function(datafield){
        if(kohaTags.title.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.title.code);
        }
    }

    var getIsbn = function(datafield){
        if(kohaTags.isbn.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.isbn.code);
        }
    }

    var getIssn = function(datafield){
        if(kohaTags.issn.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.issn.code);
        }
    }

    var getAuthor = function(datafield){
        if(kohaTags.authors.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.authors.code);
        }
    }

    var getNbPages = function(datafield){
        if(kohaTags.nbPages.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.nbPages.code);
        }
    }

    var getDescription = function(datafield){
        if(kohaTags.description.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.description.code);
        }
    }

    var getEditor = function(datafield){
        if(kohaTags.editor.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.editor.code);
        }
    }

    var getDatePub = function(datafield){
        if(kohaTags.datePub.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveTextFromMultipleSubfields(datafield, kohaTags.datePub.code);
        }
    }

    var getAuthorities = function(datafield){
        if(kohaTags.authority.tag.indexOf(datafield.$.tag) === -1){
            return null;
        } else {
            return retrieveMultipleTextsFromMultipleSubfields(datafield, kohaTags.authority.code);
        }
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
            let freeIndex = [];     //610[a] N          -- several
            let cdu = [];           //675[a] N          -- several
            let dewey = null;       //676a N
            let lcc = null;         //680a+b N
            let otherClass = null;  //686a+2 N
            let authors = [];       //700a+b,701a+b,702a+b,710a+b,711a+b,712a+b  -- can be of multiple occurence


            record.datafield.forEach(function(datafield){
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

                let tmp_authorities = getMultipleTextsFromSubfields(datafield, kohaTags.authorities);
                Array.prototype.push.apply(authorities,tmp_authorities);

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

                /*
                switch (datafield.$.tag) {
                    case '200':
                        title = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '010':
                        isbn = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '011' :
                        issn = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '700' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '701' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '702' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '215' :
                        nbPages = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '330' :
                        description = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '210' :
                        editor = retrieveTextFromSubfield(datafield,'c');
                        datePub = retrieveTextFromSubfield(datafield,'d');
                        break;
                    case '600' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '601' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '602' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '603' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '604' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '605' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '606' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '607' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '608' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '616' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '617' :
                        Array.prototype.push.apply(authorities,retrieveMultipleTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    default:
                        break;
                }
                */
            });

            //Remove duplicates from authorities
            let authorities_uniq = authorities.filter(function(elem, index,self){
                return index==self.indexOf(elem);
            })

            
            record.controlfield.forEach(function(controlfield){
                if(controlfield.$.tag == '001'){
                    id = controlfield._;
                }
            });

            if(id == null){
                reject('No ID found.');
                return;
            }

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
                authorities : authorities_uniq,
                freeIndex : freeIndex,
                cdu : cdu,
                dewey : dewey,
                lcc : lcc,
                otherClass : otherClass,
                authors : authors
            }
            resolve(bibliodocument);
        } else {
            let cause = 'Marcxml is null';
            Logger.log('info',cause);
            reject(cause);
        }
    });
}

KohaImporter.prototype.parseXmlToJson = function() {

    //Helper functions
    var retrieveTextFromSubfield = function(datafield, code) {
        var returnValue=null;
        datafield.subfield.forEach(function(subfield){
            if(subfield.$.code == code){
                returnValue = subfield.$text;
            }
        });
        return returnValue;
    }

    var retrieveTextsFromMultipleSubfields = function(datafield, codes) {
        var returnValue=[];
        datafield.subfield.forEach(function(subfield){
            if(codes.indexOf(subfield.$.code) > -1){
                returnValue.push(subfield.$text);
            }
        });
        return returnValue;
    }

    return new Promise(function(resolve, reject){

        var readStream = fs.createReadStream(path.join(__dirname, '../oai9.xml'));
        var writeStream = fs.createWriteStream(path.join(__dirname, '../index_caca.str'));
        var xml = new XmlStream(readStream);
        let nbDocumentsImported = 0;

        xml.collect('datafield');   //We collect all datafield of record
        xml.collect('subfield');    //We collect all subfield of datafield

        xml.on('endElement: record', function (record) {

            if(record.datafield === undefined){
                return;
            }

            let title = null;       //200a
            let isbn = null;        //010a
            let issn = null;        //011a
            let authors = [];       //700a+b,701a+b,702a+b  -- can be of multiple occurence
            let nbPages = null;     //215a                  -- rarely clean
            let description = null; //330a
            let editor = null;      //210c
            let datePub = null;     //210d                  -- rarely clean
            let authorities = [];   //600-608,616,617ajxy   -- several

            record.datafield.forEach(function(datafield){
                switch (datafield.$.tag) {
                    case '200':
                        title = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '010':
                        isbn = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '011' :
                        issn = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '700' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '701' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '702' :
                        authors.push(retrieveTextFromSubfield(datafield,'a')
                            + ' '
                            + retrieveTextFromSubfield(datafield,'b'));
                        break;
                    case '215' :
                        nbPages = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '330' :
                        description = retrieveTextFromSubfield(datafield,'a');
                        break;
                    case '210' :
                        editor = retrieveTextFromSubfield(datafield,'c');
                        datePub = retrieveTextFromSubfield(datafield,'d');
                        break;
                    case '600' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '601' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '602' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '603' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '604' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '605' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '606' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '607' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '608' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '616' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    case '617' :
                        Array.prototype.push.apply(authorities,retrieveTextsFromMultipleSubfields(datafield, ['a','j','x','y']));
                        break;
                    default:
                        break;
                }
            });

            var bibliodocument = {
                title : title,
                isbn : isbn,
                issn : issn,
                authors : authors,
                nbPages : nbPages,
                description : description,
                editor : editor,
                datePub : datePub,
                authorities : authorities
            }
            
            writeStream.write(JSON.stringify(bibliodocument)+'\n');
            ++nbDocumentsImported;

        });

        xml.on('endElement: ListRecords', function (element) {
            writeStream.end();
            console.log(`${nbDocumentsImported} documents imported.`);
            Logger.log('info',`${nbDocumentsImported} documents imported.`);
            resolve();
        })

        xml.on('error', function(message) {
                Logger.log('error', 'Problem while reading Koha XML export', message);
                reject(message);
        });
    });
};

module.exports = KohaImporter;