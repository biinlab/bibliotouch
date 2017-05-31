var queue = require('queue');
var request = require('request');
var sharp  = require('sharp');
var fs = require('fs');

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
    this.q = queue({
        concurrency : 15,
        autostart : true,
        timeout : 5000
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

var getFromIsbnOnAmazonSecretApi = function(isbn){
    let type = 'isbn';
    let cleanedCode = isbn.replace(/[^0-9]/g,'');
    if(cleanedCode.length == 13) {
        cleanedCode = convertISBN(isbn);
    } else if(cleanedCode != 10){
        return;
    }
    let url = `http://images.amazon.com/images/P/${cleanedCode}`

    console.log(`${cleanedCode} : Start ${type} search`);
    
    createDownloadDir();
    let req = request(url);
    let jpeg = req.pipe(sharp().jpeg());
    jpeg.metadata().then(function(metadata){
        if(metadata.width != 1 && metadata.height != 1){
            jpeg.pipe(fs.createWriteStream(`./covers/${type}/${isbn}.jpg`));
            jpeg.pipe(sharp().resize(56).jpeg())
                .pipe(fs.createWriteStream(`./covers/${type}/${isbn}-56.jpg`));
        }
    }).catch(function(err){

    })
                
}

CoverDownloader.prototype.dlCover = function(idObject){
    if(idObject.isbn) {
        this.q.push(function () {
            //downloadFromCode(idObject.isbn, 'isbn');
            getFromIsbnOnAmazonSecretApi(idObject.isbn);
        });
    } else if (idObject.issn) {
        /*
        this.q.push(function () {
            downloadFromCode(idObject.issn, 'issn');
        });*/
    }
}



module.exports = new CoverDownloader();