var queue = require('queue');
var request = require('request');
var sharp  = require('sharp');
var fs = require('fs');
var Logger = require('./logger');
var index = require('./searchIndex');


var coversFile = 'data/covers.json';
var covers = {};

function convertISBN(isbn)
{
	isbn = isbn.replace(/[-\s]/g,"").toUpperCase();
	var isbnnum = isbn;
	var isbn10exp = /^\d{9}[0-9X]$/;
	var isbn13exp = /^\d{13}$/;
	var isbnlen = isbnnum.length;
	var total = 0;

	// Preliminary validation
	if (isbnlen == 0) {
       	return null;
   	}


   	if (!(isbn10exp.test(isbnnum)) && !(isbn13exp.test(isbnnum))) {
		return null;
    }

	// Validate & convert a 10-digit ISBN
	if (isbnlen == 10) {
		// Test for 10-digit ISBNs:
		// Formulated number must be divisible by 11
		// 0234567899 is a valid number
		for (var x=0; x<9; x++) { 
			total = total+(isbnnum.charAt(x)*(10-x)); 
		}

		// check digit
		z = isbnnum.charAt(9);
		if (z == "X") { z = 10; }

		// validate ISBN
		if ((total+z*1) % 11 != 0) {   // modulo function gives remainder
			z = (11 - (total % 11)) % 11;
			if (z == 10) { z = "X"; }
			return null;
		}
		else {
			// convert the 10-digit ISBN to a 13-digit ISBN
			isbnnum = "978"+isbnnum.substring(0,9);
			total = 0;
			for (var x=0; x<12; x++) {
				if ((x % 2) == 0) { y = 1; }
				else { y = 3; }
				total = total+(isbnnum.charAt(x)*y);
			}		
			z = (10 - (total % 10)) % 10;
		}		
	}

	// Validate & convert a 13-digit ISBN
	else { 
		// Test for 13-digit ISBNs
		// 9780234567890 is a valid number
		for (var x=0; x<12; x++) {
			if ((x % 2) == 0) { y = 1; }
			else { y = 3; }
			total = total+(isbnnum.charAt(x)*y);
		}

		// check digit
		z = isbnnum.charAt(12);

		// validate ISBN		
		if ((10 - (total % 10)) % 10 != z) {   // modulo function gives remainder
			z = (10 - (total % 10)) % 10; 
			return null;
		}
		else {
			// convert the 13-digit ISBN to a 10-digit ISBN
			if ((isbnnum.substring(0,3) != "978")) {
				return null;
			}
			else {
				isbnnum = isbnnum.substring(3,12);
				total = 0;
				for (var x=0; x<9; x++) {
					total = total+(isbnnum.charAt(x)*(10-x));
				}
				z = (11 - (total % 11)) % 11;
				if (z == 10) { z = "X"; } 
			}
		}
	}
	return isbnnum+z;
}//convertISBN(form)


var CoverDownloader = function () {
    let self = this;
    this.q = queue({
        concurrency : 15,
        autostart : true,
        timeout : 5000
    });

    this.loadCoversFile();

    this.q.on('error', function (err) {
        console.log(err);
    });

    this.q.on('end', function (){
        self.saveCoversFile()
    })
}

/**
 * Save the covers dictionnary to the disk
 * 
 */
CoverDownloader.prototype.saveCoversFile = function(){
    fs.writeFile(coversFile, JSON.stringify(covers), function(err){
        if (err) {
            Logger.log('error',err);
        }
    });
}

/**
 * Tries to load the covers dictionnary if it exists
 * 
 */
CoverDownloader.prototype.loadCoversFile = function(){
    try{
        covers = require('../'+coversFile);
        console.log('Covers file succesfully loaded');
    } catch(e){
        let msg = 'Error while loading covers file.';
        console.log(msg);
        Logger.log('error', msg);
    }
}

/**
 * Create download directories if nonexistant
 * 
 */
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

/**
 * Tries to download a book cover
 * 
 * @param {any} code 
 * @param {any} type 
 */
var downloadFromCode = function (code, type) {
    let cleanedCode = code.replace(/[^0-9]/g,'');
    let url = `https://www.googleapis.com/books/v1/volumes?q=${type}:${cleanedCode}`;
    /*
    let url;
    if(type == 'isbn'){
        url  = `http://api.lib.sfu.ca/covers/redirect?isn=&issn=&isbn=${cleanedCode}&size=l`;
    } else {
        url  = `http://api.lib.sfu.ca/covers/redirect?isn=&issn=${cleanedCode}&isbn=&size=l`
    }
    */
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

/**
 * Tries to request a book cover image from Amazon, if available resizes it and save it on the disk.
 * 
 * @param {Object} book - The book we want to get the cover
 */
var getFromIsbnOnAmazonSecretApi = function(book){
    let type = 'isbn';
    let cleanedCode = book.isbn.replace(/[^0-9]/g,'');
    if(cleanedCode.length == 13) {
        cleanedCode = convertISBN(book.isbn);
    } else if(cleanedCode != 10){
        return;
    }
    let url = `http://images.amazon.com/images/P/${cleanedCode}`

    //console.log(`${cleanedCode} : Start ${type} search`);
    
    createDownloadDir();
    let req = request(url);
    let jpeg = req.pipe(sharp().jpeg());
    jpeg.metadata().then(function(metadata){
        if(metadata.width != 1 && metadata.height != 1){
            covers[book.id] = true;
            jpeg.pipe(fs.createWriteStream(`./covers/${type}/${book.isbn}.jpg`));
            jpeg.pipe(sharp().resize(56).jpeg())
                .pipe(fs.createWriteStream(`./covers/${type}/${book.isbn}-56.jpg`));
            jpeg.pipe(sharp().resize(100).jpeg())
                .pipe(fs.createWriteStream(`./covers/${type}/${book.isbn}-100.jpg`));
        }
    }).catch(function(err){
    })
                
}

/**
 * Downloads a cover
 * 
 * @param {Object} book - The book whose cover we want to download
 */
CoverDownloader.prototype.dlCover = function(book){
    if(book.isbn) {
        this.q.push(function () {
            //downloadFromCode(book.isbn, 'isbn');
            getFromIsbnOnAmazonSecretApi(book);
        });
    } else if (book.issn) {
        /*
        this.q.push(function () {
            downloadFromCode(book.issn, 'issn');
        });*/
    }
}

/**
 * Returns if the book with the given id has a correponding cover
 * 
 * @param {string} id - The book id
 * @returns {Boolean} - If the cover is available
 */
CoverDownloader.prototype.hasCover = function(id) {
    return covers[id] ? true : false;
}


module.exports = new CoverDownloader();