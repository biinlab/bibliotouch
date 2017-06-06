var express = require('express');
var compression = require('compression');
var controllers = require('./controllers');
var KohaImporter = require('./importers/kohaImporter/kohaImporter');
var indexer = require('./helpers/searchIndex');
var parseArgs = require('minimist');
var schedule = require('node-schedule');
var config = require('config');
var fs = require('fs');


var argv = parseArgs(process.argv.slice(2));


var app = express();
var serverPort = argv.port ? argv.port : 8080;

app.use(compression());
app.use(controllers);
app.use('/', express.static('../bibliotouch-front'));
app.use('/covers', express.static('./covers'));

//Initialize data directory
fs.mkdir('data', err => console.log('Did not create "data" directory'));

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
    //Start update and then schedule updates
    importer.update().then(function () {
        let cron = config.get('Bibliotouch.updateTime.cron');
        schedule.scheduleJob(cron, function(){
            importer.update();
        })
    });
    indexer.initIndex();
    //Start server app
    app.listen(serverPort, function () {
        console.log(`Server running on port ${serverPort}`);
    });
}

module.exports = app;