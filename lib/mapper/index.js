'use strict';

const mapper0 = require('./type0.nrom.js');

module.exports.getMapper = function(mapperId) {
  switch(mapperId) {
    case 0:
      return mapper0;
    default:
      throw new Error('MAPPER_TYPE_NOT_SUPPORTED');
  }
};
