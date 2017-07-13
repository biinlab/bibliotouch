# Bibliotouch

## Requirements

*Developed and tested with :*
* *Server :*
    * NodeJS 7.9
    * NPM 4.2.0
    * Mysql 5.7
    * Windows 10
    * Ubuntu 16.04.2
* *Browser :*
    * Firefox 53 - Best compromise
    * Chrome 58 - Strugges to handle elegantly huge number of HTMLElements
    * Edge 40 - Touch events and some CSS features are buggy or disabled by default, otherwise it's OK

## Installation

### Setup database for first import
Bibliotouch initial document import (from Koha) is looking for a mysql database with credentials corresponding to the config file found in `bibliotouch-server/config`.

The db should have a table `BIBLIOITEMS` (corresponding to an export of the Koha database we are based on).

*All the following commands are run from the root folder*
### Front packages installation
`npm --prefix ./bibliotouch-front/ install`

### Front building
`npm --prefix ./bibliotouch-front/ run build`

### Server installation
`npm --prefix ./bibliotouch-server/ install`

### Server initial import
`npm --prefix ./bibliotouch-server/ run flush`
This will empty the index when run and then is going to look for a mysql server to import documents from. Once the import from the mysql server is done it is going to update its records using the Koha OAIPMH url given in the config file.

### Server test
`npm --prefix ./bibliotouch-server/ test`
This will run the Express server and check that the homepage is showing

### Server start
`npm --prefix ./bibliotouch-server/ start`
This will start the web server and a bunch of processes to make sure the index is kept updated.
1. Update from the Koha OAIPMH endpoint (using the date from `data/lastUpdate.json` file)
    1. Authorities tree (`models/authorities.js`) is going to be updated
    2. Themes (`models/themes.js`) are recalculated
2. Set a cron job (editable in config file) to update again
3. Start the Express server

The website is then available on [http://localhost:8080](http://localhost:8080)

If you want to change the listening port, get into `package.json` file and change the start script by adding `--port [YOURPORT]` to the command line.

*Example :* `"start": "node app.js --port 1234"`

## Main frameworks and libraries
### Backend
* Node 7.9
* Express 4.15
* Sequelize 3.30
* search-index 0.9.16 - Any change of version may break the software, *avoid at all cost 0.9.17*
* *For the complete list refer to `bibliotouch-server/package.json` file*

### Frontend
* Vue 2.3
* vue-router 2.5
* browserify 14.3
* *For the complete list refer to `bibliotouch-front/package.json` file*

## Advanced
### Modify MARCXML Mappings
The current MARCXML mapping reflects the the current use by the library of [ENSSIB](http://www.enssib.fr/) which mostly respects the standard which can be found at [bnf.fr](http://www.bnf.fr/fr/professionnels/anx_formats/a.unimarc_manuel_format_bibliographique.html#SHDC__Attribute_BlocArticle19BnF). However you might want to tune the mappings for your own use case. It is possible however huge changes may have you to modify some code.

#### Simple mapping modification
Go to `config/default.json` and look for `koha.kohaTags`, there you can find the default mappings in use.

**For example** : if you want to set the mapping for dewey classification value from 676.a to 677.a+b

Current default values :

    "dewey" : {
        "tag" : ["676"],
        "code": ["a"]
    },

modify it to make it look like this :

    "dewey" : {
        "tag" : ["677"],
        "code": ["a","b"]
    },

#### Several tags or codes edge case
Sometimes you want to map several tags or codes to a same value. The are two ways to handle this :

- Concatene all the stuff in one string
- Get an array of the different elements

To tune this behavior you *have to* get your hands dirty and get into the code. Look for `importers/kohaImporter/kohaImporter.js` and the function `parseRecordObject` which holds all the logic.

### Add a new MARCXML field
You are up to a great adventure ! First get familiar with what is explained in [Modify MARCXML Mappings](#modify-marcxml-mappings). Then look for `importers/kohaImporter/kohaImporter.js` and the function `parseRecordObject`.

## REST API

The API sometimes accept structured search query objects in the body, please refer to [search-index documentation](https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md) for further details.

### /search/`:query`

Perform a search on the search-index with a given query.

#### GET
**Parameters** : 
- In URL : `/search/query-string`
- In body : `/search`

**Response format** : `JSON`
*Example :* http://localhost:8080/search/livre will return search results for the keyword 'livre' on all fields

*Example :* http://localhost:8080/search whith the following in the body

    [
        {
            AND: {             
            'title': ['reagan'], 
            'body':  ['ussr']
            },
            NOT: {
            'body':  ['usa']
            }
        }
    ]

will return search results corresponding to the query.

#### POST
Same as GET.

### /autocomplete/`:string`

Returns autocompletion suggestions for a given string

#### GET
**Parameters** : 
- In URL : `/autocomplete/query-string`
- In body : `/autocomplete`

**Response format** : `JSON`
*Example :* http://localhost:8080/autocomplete/livre will return autocomplete suggestions for the string 'livre'

*Example :* http://localhost:8080/autocomplete whith the following in the body

    livre

will return autocomplete suggestions for the string 'livre'

#### POST
Same as GET.

### /themes

Returns the list of all the themes

#### GET

**Response format** : `JSON`
*Example :* http://localhost:8080/themes will return the list of themes

### /themes/`:themeid`

Returns the theme object corresponding to `:themeid`, returns an empty object if `themeid` unknown.

#### GET

**Response format** : `JSON`
*Example :* http://localhost:8080/themes/informatique will return the theme object with id 'informatique'

### /themes/`:themeid`/books

Returns the theme list of documents that are part of the theme corresponding to `:themeid`

#### GET

**Response format** : `JSON`
*Example :* http://localhost:8080/themes/informatique/books will return the list of books from the theme with id 'informatique'

### /total-hits/`:query`

Perform a search on the search-index with a given query and returns the number of results found.

#### GET
**Parameters** : 
- In URL : `/total-hits/query-string`
- In body : `/total-hits`

**Response format** : `JSON`
*Example :* http://localhost:8080/total-hits/livre will return the number of  results for the keyword 'livre' on all fields

*Example :* http://localhost:8080/total-hits whith the following in the body

    [
        {
            AND: {             
            'title': ['reagan'], 
            'body':  ['ussr']
            },
            NOT: {
            'body':  ['usa']
            }
        }
    ]

will return the number of results corresponding to the query.

#### POST
Same as GET.

### /cors-bypass/availability/`:biblioitemnumber`

Returns a description of the item identified by `:biblioitemnumber` from the Koha REST API, with additionnal informations regarding the disponibility of the item.

#### GET

**Response format** : `JSON`
*Example :* http://localhost:8080/cors-bypass/availability/92943 will return the the description of the item with number `:92943`.