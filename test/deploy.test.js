'use strict';

var path = require('path');
var assert = require('power-assert');
var tools = require('..');

describe('deploy', function() {

  this.timeout(30*1000);

  it('should deploy from directory', function(done) {
    tools.deployFromDirectory(path.join(__dirname, 'fixture/pkg1'), {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
      logger: console
    })
    .then(function(res) {
      assert(res.success === true, res.errors);
      assert(res.done === true);
      assert(res.response);
      assert(res.response.numberComponentErrors === 0);
      assert(res.response.numberComponentsDeployed === 1);
      assert(res.response.numberComponentsTotal === 1);
      done();
    })
    .catch(done);
  });

  it('should deploy from directory with several errors', function(done) {
    tools.deployFromDirectory(path.join(__dirname, 'fixture/pkg2'), {
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
      logger: console
    })
    .then(function(res) {
      assert(res.success === false);
      assert(res.errors && res.errors.length === 1);
      assert(res.done === true);
      assert(res.response);
      assert(res.response.status === 'SucceededPartial');
      assert(res.response.numberComponentErrors === 1);
      assert(res.response.numberComponentsDeployed === 1);
      assert(res.response.numberComponentsTotal === 2);
      done();
    })
    .catch(done);
  });


});
