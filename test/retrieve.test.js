'use strict';

var path = require('path');
var assert = require('power-assert');
var tools = require('..');

describe('retrieve', function() {

  this.timeout(30*1000);

  it('should retrieve by package names', function(done) {
    tools.retrieveByPackageNames([ 'JSforceRetrievePackage1', 'JSforceRetrievePackage2' ], {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    })
    .then(function(res) {
      assert(res.status === 'Succeeded');
      assert(res.fileProperties.length > 0);
      assert(typeof res.zipFile === 'string');
      done();
    })
    .catch(done);
  });

  it('should retrieve by types', function(done) {
    tools.retrieveByTypes('ApexClass:*;ApexTrigger:*;ApexPage', {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    })
    .then(function(res) {
      assert(res.status === 'Succeeded');
      assert(res.fileProperties.length > 0);
      assert(typeof res.zipFile === 'string');
      done();
    })
    .catch(done);
  });

  it('should retrieve by package.xml', function(done) {
    tools.retrieveByPackageXML(path.join(__dirname, 'fixture/pkg1/package.xml'), {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    })
    .then(function(res) {
      assert(res.status === 'Succeeded');
      assert(res.fileProperties.length > 0);
      assert(typeof res.zipFile === 'string');
      done();
    })
    .catch(done);
  });

});
