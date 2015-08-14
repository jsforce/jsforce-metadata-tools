'use strict';

module.exports = {
  connect: require('./connect'),
  deployFromZipStream: require('./deploy').deployFromZipStream,
  deployFromFileMapping: require('./deploy').deployFromFileMapping,
  deployFromDirectory: require('./deploy').deployFromDirectory,
  checkDeployStatus: require('./deploy').checkDeployStatus,
  reportDeployResult: require('./deploy').reportDeployResult
};
