var express = require('express');
var controllers = require('./controllers');
var KohaImporter = require('./importers/kohaImporter/kohaImporter');
var indexer = require('./helpers/searchIndex');
var parseArgs = require('minimist');


var argv = parseArgs(process.argv.slice(2));


var app = express();
var serverPort = argv.port ? argv.port : 8080;

app.use(controllers);



var importer;
if(argv.adapter == 'koha'){
    importer = new KohaImporter();
}else {
    //By default we return KohaImporter
    importer = new KohaImporter();
}

async function flush(){
    await indexer.flushIndex()
        .then(function(){
            //Import records from SIGB
            return importer.import();
        }).then(function(stream){
            return indexer.fillIndexFromStream(stream);
        })
}

if(argv.flush){
    flush().then(function(){
        return importer.update();
    })
} else {
    importer.update();
    app.listen(serverPort, function () {
        console.log(`Server running on port ${serverPort}`);
    });
}

module.exports = app;