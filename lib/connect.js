'use strict';

var jsforce = require('jsforce');
var Promise = jsforce.Promise;

var CONNECTION_CONFIG_PROPS =
  "loginUrl,serverUrl,sessionId,accessToken,instanceUrl,refreshToken,clientId,clientSecret,redirectUri,logLevel,version".split(',');

/**
 *
 */
function connect(options) {
  var conn;
  return Promise.resolve().then(function() {
    if (options.connection) {
      conn = jsforce.registry.getConnection(options.connection);
      if (!conn) {
        throw new Error('No connection named "' + options.connection + '" in registry');
      }
    } else {
      var config = {};
      CONNECTION_CONFIG_PROPS.forEach(function(prop) {
        if (options[prop]) { config[prop] = options[prop]; }
      });
      conn = new jsforce.Connection(config);
      if (options.username && options.password) {
        return conn.login(options.username, options.password);
      } else {
        return conn.identity().catch(function(err) {
          throw new Error(
            'Credential to salesforce server is not found in options.\n' +
            'Specify "username" and "password" in options, or give any other credentials.'
          );
        });
      }
    }
  })
  .then(function() {
    if (options.logger) {
      var logger = options.logger;
      return conn.identity().then(function(identity) {
        logger.log('Logged in as: ' + identity.username);
        return conn;
      });
    }
    return conn;
  });
};

/**
 *
 */
module.exports = connect;
