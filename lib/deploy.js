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
      if (typeof options[prop] !== 'undefined') { deployOpts[prop] = options[prop]; }
    });
    return conn.metadata.deploy(zipStream, deployOpts).complete({ details: true });
  });
};

/**
 *
 */
function deployFromFileMapping(mapping, options) {
  var archive = archiver('zip');
  archive.bulk(mapping);
  archive.finalize();
  return deployFromZipStream(archive, options);
}

/**
 *
 */
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
function checkDeployStatus(processId, options) {
  return connect(options).then(function(conn) {
    return conn.metadata.checkDeployStatus(processId, { details: true });
  });
}

/**
 *
 */
function reportDeployResult(res, logger, verbose) {
  var message =
    res.success ? 'Deploy Succeeded' + (res.status === 'SucceededPartial' ? ' Patially.' : '.') :
    res.done ? 'Deploy Failed.' :
    'Deploy Not Completed Yet.';
  logger.log(message);
  logger.log('');
  logger.log('Id: ' + res.id);
  logger.log('Status: ' + res.status);
  logger.log('Success: ' + res.success);
  logger.log('Done: ' + res.done);
  logger.log('Number Component Errors; ' + res.numberComponentErrors);
  logger.log('Number Components Deployed: ' + res.numberComponentsDeployed);
  logger.log('Number Components Total: ' + res.numberComponentsTotal);
  logger.log('Number Test Errors; ' + res.numberTestErrors);
  logger.log('Number Tests Completed: ' + res.numberTestsCompleted);
  logger.log('Number Tests Total: ' + res.numberTestsTotal);
  reportDeployResultDetails(res.details, logger, verbose);
}

function reportDeployResultDetails(details, logger, verbose) {
  if (details) {
    console.log('');
    var failures = asArray(details.componentFailures);
    if (failures) {
      if (failures.length > 0) {
        logger.log('Failures:');
      }
      failures.forEach(function(f) {
        logger.log(' - ' + f.problemType + ' on ' + f.fileName + ' : ' + f.problem);
      });
    }
    if (verbose) {
      var successes = asArray(details.componentSuccesses);
      if (successes.length > 0) {
        logger.log('Successes:');
      }
      successes.forEach(function(s) {
        var flag =
          String(s.changed) === 'true' ? '(M)' :
          String(s.created) === 'true' ? '(A)' :
          String(s.deleted) === 'true' ? '(D)' :
          '(~)';
        logger.log(' - ' + flag + ' ' + s.fileName + (s.componentType ? ' ['+s.componentType+']' : ''));
      });
    }
  }
}

function asArray(arr) {
  if (!arr) { return []; }
  if (Object.prototype.toString.apply(arr) !== '[object Array]') { arr = [ arr ]; }
  return arr;
}


/**
 *
 */
module.exports = {
  deployFromZipStream: deployFromZipStream,
  deployFromFileMapping: deployFromFileMapping,
  deployFromDirectory: deployFromDirectory,
  checkDeployStatus: checkDeployStatus,
  reportDeployResult: reportDeployResult
};
