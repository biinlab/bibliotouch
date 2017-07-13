var Sequelize = require('sequelize');
var config = require('config');


/**
 * Read config file
 */
var dbconfig = config.get('Bibliotouch.koha.kohadbconfig');
var dbuser = dbconfig.user;
var dbpwd = dbconfig.pwd;
var dbhost  = dbconfig.host;
var dbport = dbconfig.port;
var dbname = dbconfig.dbname;


/**
 * DB connexion
 */
module.exports = new Sequelize(`mysql://${dbuser}:${dbpwd}@${dbhost}:${dbport}/${dbname}`);