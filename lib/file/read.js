'use strict';

const fs = require('fs');

module.exports.readFileAsArrayBuffer = function(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (error, data) => {
      if (error) {
        reject(error);
      } else {
        const buffer = new Uint8Array(data).buffer;
        resolve(buffer);
      }
    });
  });
};
