'use strict';

module.exports = {
  connect: require('./connect'),
  deployFromZipStream: require('./deploy').deployFromZipStream,
  deployFromFileMapping: require('./deploy').deployFromFileMapping,
  deployFromDirectory: require('./deploy').deployFromDirectory,
};
