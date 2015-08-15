'use strict';

module.exports = {
  connect: require('./connect'),

  deployFromZipStream: require('./deploy').deployFromZipStream,
  deployFromFileMapping: require('./deploy').deployFromFileMapping,
  deployFromDirectory: require('./deploy').deployFromDirectory,
  checkDeployStatus: require('./deploy').checkDeployStatus,
  reportDeployResult: require('./deploy').reportDeployResult,

  retrieve: require('./retrieve').retrieve,
  retrieveByTypes: require('./retrieve').retrieveByTypes,
  retrieveByPackageNames: require('./retrieve').retrieveByPackageNames,
  retrieveByPackageXML: require('./retrieve').retrieveByPackageXML,
  checkRetrieveStatus: require('./retrieve').checkRetrieveStatus,
  reportRetrieveResult: require('./retrieve').reportRetrieveResult,
  extractZipContents: require('./retrieve').extractZipContents
};
