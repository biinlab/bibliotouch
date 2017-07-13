var Sequelize = require('sequelize');
var db = require('./db');

/**
 * DB Schema creation
 */

var Record = db.define('record', {
  title: {
    type: Sequelize.STRING
  },
  datePublished: {
    type: Sequelize.DATE
  },
  isbn: {
      type: Sequelize.STRING
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});


Record.sync();

module.exports = Record;