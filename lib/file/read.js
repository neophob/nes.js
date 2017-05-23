'use strict';

const fs = require('fs');

module.exports.readFileAsBuffer = function(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};
