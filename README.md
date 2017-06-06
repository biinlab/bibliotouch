# Bibliotouch

## Requirements

*Developed and tested with :*
* *Server :*
    * NodeJS 7.9
    * NPM 4.2.0
    * Mysql 5.7
    * Windows 10
* *Browser :*
    * Firefox 53
    * Chrome 58
    * Edge 40

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

### Server test
`npm --prefix ./bibliotouch-server/ test`

### Server start
`npm --prefix ./bibliotouch-server/ start`

The website is then available on [http://localhost:8080](http://localhost:8080)

## Main frameworks and libraries used
### Backend
* Node 7.9
* Express 4.15
* Sequelize 3.30
* search-index 0.9.16
* *For the complete list refer to `bibliotouch-server/package.json` file*

### Frontend
* Vue 2.3
* vue-router 2.5
* browserify 14.3
* *For the complete list refer to `bibliotouch-front/package.json` file*