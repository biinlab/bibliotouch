var winston = require('winston');

winston.configure({
    transports: [
      new (winston.transports.File)({ filename: 'bibliotouch-rejects.log' })
    ]
  });

module.exports = winston;