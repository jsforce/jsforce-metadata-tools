'use strict';

var fs = require('fs');
var fstream = require('fstream');
var path = require('path');
var stream = require('readable-stream');
var jsforce = require('jsforce');
var archiver = require('archiver');
var unzip = require('unzip');
var xml2js = require('xml2js');
var Promise = jsforce.Promise;
var connect = require('./connect');

var RETRIEVE_OPTIONS =
  "apiVersion,packageNames,singlePackage,specificFiles,unpackaged".split(',');

/* @private */
function noop() {}

/**
 *
 */
function retrieve(options) {
  var logger = options.logger || { log: noop };
  return connect(options).then(function(conn) {
    logger.log('Retrieving from server...');
    conn.metadata.pollTimeout = options.pollTimeout || 60*1000; // timeout in 60 sec by default
    conn.metadata.pollInterval = options.pollInterval || 5*1000; // polling interval to 5 sec by default
    var req = {};
    RETRIEVE_OPTIONS.forEach(function(prop) {
      if (typeof options[prop] !== 'undefined') { req[prop] = options[prop]; }
    });
    return conn.metadata.retrieve(req).complete({ details: true });
  });
};

/**
 *
 */
function retrieveByTypes(typeList, options) {
  var types = typeList.split(/\s*;\s*/)
    .filter(function(p) { return p; })
    .map(function(p) {
      var pair = p.split(/\s*:\s*/);
      var name = pair[0];
      var members = pair[1] ? pair[1].split(/\s*,\s*/) : ['*'];
      return { name: name, members: members };
    })
  options.unpackaged = { types: types };
  return retrieve(options);
}

/**
 *
 */
function retrieveByPackageNames(packageNames, options) {
  options.packageNames = packageNames;
  return retrieve(options);
}

/**
 *
 */
function retrieveByPackageXML(xmlFilePath, options) {
  return new Promise(function(resolve, reject) {
    fs.readFile(xmlFilePath, 'utf-8', function(err, data) {
      if (err) { reject(err); } else { resolve(data); }
    });
  }).then(function(data) {
    return new Promise(function(resolve, reject) {
      xml2js.parseString(data, { explicitArray: false }, function(err, dom) {
        if (err) { reject(err); } else { resolve(dom); }
      });
    });
  }).then(function(dom) {
    delete dom.Package.$;
    options.unpackaged = dom.Package;
    return retrieve(options);
  });
}


/**
 *
 */
function checkRetrieveStatus(processId, options) {
  var logger = options.logger || { log: noop };
  return connect(options).then(function(conn) {
    logger.log('Retrieving previous request result from server...');
    return conn.metadata.checkRetrieveStatus(processId, { details: true });
  });
}

/**
 *
 */
function reportRetrieveResult(res, logger, verbose) {
  var message =
    res.success ? 'Retrieve Succeeded.' :
    res.done ? 'Retrieve Failed.' :
    'Retrieve Not Completed Yet.';
  logger.log(message);
  logger.log('');
  logger.log('Id: ' + res.id);
  logger.log('Status: ' + res.status);
  logger.log('Success: ' + res.success);
  logger.log('Done: ' + res.done);
  if (verbose) {
    reportRetreiveFileProperties(res.fileProperties, logger);
  }
}

function asArray(arr) {
  if (!arr) { return []; }
  if (Object.prototype.toString.apply(arr) !== '[object Array]') { arr = [ arr ]; }
  return arr;
}

function reportRetreiveFileProperties(fileProperties, logger) {
  fileProperties = asArray(fileProperties);
  if (fileProperties.length > 0) {
    logger.log('');
    logger.log('Files:');
    fileProperties.forEach(function(f) {
      logger.log(' - ' + f.fileName + (f.type ? ' ['+f.type+']' : ''));
    });
  }
}

/**
 *
 */
function extractZipContents(zipFileContent, dirMapping, logger, verbose) {
  console.log('');
  return new Promise(function(resolve, reject) {
    var waits = [];
    var zipStream = new stream.PassThrough();
    zipStream.end(new Buffer(zipFileContent, 'base64'));
    zipStream
      .pipe(unzip.Parse())
      .on('entry', function(entry) {
        var filePaths = entry.path.split('/');
        var packageName = filePaths[0];
        var directory = dirMapping[packageName] || dirMapping['*'];
        if (directory) {
          var restPath = filePaths.slice(1).join('/');
          var realPath = path.join(directory, restPath);
          waits.push(new Promise(function(rsv, rej) {
            logger.log('Extracting: ', realPath);
            entry.pipe(
                fstream.Writer({
                  type: entry.type,
                  path: realPath
                })
              )
              .on('finish', rsv)
              .on('error', rej);
          }));
        } else {
          entry.autodrain();
        }
      })
      .on('finish', function() {
        setTimeout(function() {
          Promise.all(waits).then(resolve, reject);
        }, 1000);
      })
      .on('error', reject);
  });
}


/**
 *
 */
module.exports = {
  retrieve: retrieve,
  retrieveByTypes: retrieveByTypes,
  retrieveByPackageNames: retrieveByPackageNames,
  retrieveByPackageXML: retrieveByPackageXML,
  checkRetrieveStatus: checkRetrieveStatus,
  reportRetrieveResult: reportRetrieveResult,
  extractZipContents: extractZipContents
};
