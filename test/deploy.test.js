'use strict';

var path = require('path');
var assert = require('power-assert');
var tools = require('..');

describe('deploy', function() {

  this.timeout(30*1000);

  it('should deploy from directory', function(done) {
    tools.deployFromDirectory(path.join(__dirname, 'fixture/pkg1'), {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    })
    .then(function(res) {
      assert(res.success === true, res.errors);
      assert(res.done === true);
      assert(res.status === 'Succeeded');
      assert(res.numberComponentErrors === 0);
      assert(res.numberComponentsDeployed === 1);
      assert(res.numberComponentsTotal === 1);
      done();
    })
    .catch(done);
  });

  it('should deploy from directory with several errors', function(done) {
    tools.deployFromDirectory(path.join(__dirname, 'fixture/pkg2'), {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    })
    .then(function(res) {
      assert(res.success === true);
      assert(res.done === true);
      assert(res.status === 'SucceededPartial');
      assert(res.numberComponentErrors === 1);
      assert(res.numberComponentsDeployed === 1);
      assert(res.numberComponentsTotal === 2);
      done();
    })
    .catch(done);
  });


});
