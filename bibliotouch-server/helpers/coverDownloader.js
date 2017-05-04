var queue = require('queue');
var request = require('request');
var sharp  = require('sharp');
var fs = require('fs');

var CoverDownloader = function () {
    this.q = queue({
        concurrency : 15,
        autostart : true,
        timeout : 30000
    });

    this.q.on('error', function (err) {
        console.log(err);
    });
}

var createDownloadDir = function () {
    let covers = './covers';
    if (!fs.existsSync(covers)){
        fs.mkdirSync(covers);
    }
    let issn = './covers/issn';
    if (!fs.existsSync(issn)){
        fs.mkdirSync(issn);
    }
    let isbn = './covers/isbn';
    if (!fs.existsSync(isbn)){
        fs.mkdirSync(isbn);
    }

}

var downloadFromCode = function (code, type) {
    let cleanedCode = code.replace(/[^0-9]/g,'');
    //let url = `https://www.googleapis.com/books/v1/volumes?q=${type}:${cleanedCode}`;
    let url;
    if(type == 'isbn'){
        url  = `http://api.lib.sfu.ca/covers/redirect?isn=&issn=&isbn=${cleanedCode}&size=l`;
    } else {
        url  = `http://api.lib.sfu.ca/covers/redirect?isn=&issn=${cleanedCode}&isbn=&size=l`
    }
    console.log(`${cleanedCode} : Start ${type} search`);
    request(url, function(error, response, body){
        if(!error){
            let parsedBody = JSON.parse(body);
            console.log(`${cleanedCode} : search done, items : ${parsedBody.totalItems}`);
                console.log(parsedBody);
            if(parsedBody.totalItems > 0){
                if(parsedBody.items[0].volumeInfo.imageLinks != undefined){
                    createDownloadDir();
                    let cleanedThumbUrl = parsedBody.items[0].volumeInfo.imageLinks.thumbnail.replace(/&edge=curl/g,'');
                    let req = request(cleanedThumbUrl);
                    req.pipe(sharp().jpeg())
                        .pipe(fs.createWriteStream(`./covers/${type}/${cleanedCode}.jpg`));
                    req.pipe(sharp().resize(54).jpeg())
                        .pipe(fs.createWriteStream(`./covers/${type}/${cleanedCode}-54.jpg`));
                }
            }
        } else { 
            console.log(error);
        }
    })
};

CoverDownloader.prototype.dlCover = function(idObject){
    if(idObject.isbn) {
        this.q.push(function () {
            downloadFromCode(idObject.isbn, 'isbn');
        });
    } else if (idObject.issn) {
        this.q.push(function () {
            downloadFromCode(idObject.issn, 'issn');
        });
    }
}



module.exports = new CoverDownloader();