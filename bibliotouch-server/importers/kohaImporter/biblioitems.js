var Sequelize = require('sequelize');
var kohaDb = require('./kohaDb');

/**
 * DB Schema creation
 */

var BiblioItems = kohaDb.define('biblioitems', {
  biblioitemnumber: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      field: 'biblioitemnumber'
  },
  biblionumber: {
      type: Sequelize.INTEGER,
      field: 'biblionumber'
  },
  timestamp: {
      type: Sequelize.DATE,
      field: 'timestamp'
  },
  marcxml: {
      type: Sequelize.TEXT,
      field: 'marcxml'
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

BiblioItems.removeAttribute('createdAt');
BiblioItems.removeAttribute('updatedAt');



module.exports = BiblioItems;