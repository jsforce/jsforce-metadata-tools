'use strict';

var path = require('path');
var jsforce = require('jsforce');
var archiver = require('archiver');
var Promise = jsforce.Promise;
var connect = require('./connect');

var DEPLOY_OPTIONS =
  "allowMissingFiles,autoUpdatePackage,checkOnly,ignoreWarnings,performRetrieve,purgeOnDelete,rollbackOnError,runAllTests,runTests,singlePackage,testLevel".split(',');

/* @private */
function noop() {}

/**
 *
 */
function deployFromZipStream(zipStream, options) {
  var logger = options.logger || { log: noop };
  return connect(options).then(function(conn) {
    logger.log('Deploying to server...');
    conn.metadata.pollTimeout = options.pollTimeout || 60*1000; // timeout in 60 sec by default
    conn.metadata.pollInterval = options.pollInterval || 5*1000; // polling interval to 5 sec by default
    var deployOpts = {};
    DEPLOY_OPTIONS.forEach(function(prop) {
      if (options[prop]) { deployOpts[prop] = options[prop]; }
    });
    return conn.metadata.deploy(zipStream, deployOpts).complete({ details: true });
  })
  .then(function(res) {
    if (res.status !== 'Succeeded') {
      var message = 'Deploy failed.';
      if (res.status === 'SucceededPartial') {
        message = 'Deploy partially successful.';
      }
      logger.log(message);
      return {
        success: false,
        errors: _extractFailuresFromResponse(res),
        done: res.done,
        response: res
      };
    } else {
      logger.log('Deploy successful.');
      return {
        success: true,
        done: res.done,
        response: res
      };
    }
  })
  .catch(function(err) {
    logger.log('Unexpected Error in deployment')
    return {
      success: false,
      errors: [ err ]
    };
  });
};

/**
 * @private
 */
function _extractFailuresFromResponse(res) {
  if (res.details) {
    var failures = res.details.componentFailures;
    if (!failures) { return; }
    if (!failures.length) { failures = [ failures ]; }
    return failures.map(function(f) {
      return {
        message: f.problemType + ' on ' + f.fileName + ' : ' + f.problem,
        detail: f
      };
    });
  }
}

/**
 *
 */
function deployFromFileMapping(mapping, options) {
  var archive = archiver('zip');
  archive.bulk(mapping);
  archive.finalize();
  return deployFromZipStream(archive, options);
}

function deployFromDirectory(packageDirectoryPath, options) {
  return deployFromFileMapping({
    expand: true,
    cwd: path.join(packageDirectoryPath, '..'),
    src: [ path.basename(packageDirectoryPath) + '/**' ],
  }, options);
}

/**
 *
 */
module.exports = {
  deployFromZipStream: deployFromZipStream,
  deployFromFileMapping: deployFromFileMapping,
  deployFromDirectory: deployFromDirectory
};
