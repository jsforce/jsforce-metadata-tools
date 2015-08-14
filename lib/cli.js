var fs = require('fs');
var commander = require('commander');
var jsforce = require('jsforce');
var tools = require('./index');
var pkg = require('../package.json');
var Promise = jsforce.Promise;

function acceptConnectionOptions(program) {
  program.option('-u, --username [username]', 'Salesforce username')
         .option('-p, --password [password]', 'Salesforce password (and security token, if available)')
         .option('-c, --connection [connection]', 'Connection name stored in connection registry')
         .option('-l, --loginUrl [loginUrl]', 'Salesforce login url')
         .option('--sandbox', 'Login to Salesforce sandbox');
}

function acceptCommonOptions(program) {
  program.option('--slient', 'Don\'t output logs to stdout')
         .option('--verbose', 'Output execution detail log')
         .version(pkg.version);
}

function readOptions(program) {
  var options = {};
  "username,password,connection,loginUrl,pollInterval,pollTimeout".split(',').forEach(function(prop) {
    if (program[prop]) { options[prop] = program[prop]; }
  });
  if (program.sandbox) {
    options.loginUrl === 'https://test.salesforce.com';
  }
  if (program.dryRun) {
    options.checkOnly = true;
  }
  if (!program.silent) {
    options.logger = console;
  }
  return options;
}

function deploy() {
  var program = new commander.Command();
  acceptConnectionOptions(program);
  program.option('-D, --directory [directory]', 'Local directory path of the package to deploy')
         .option('-P, --package [package]', 'File path of the package zip file to deploy')
         .option('--pid [pid]', 'Process ID of previous deployment to check status')
         .option('--dry-run', 'Dry run. Same as --checkOnly')
         .option('--checkOnly', 'Whether Apex classes and triggers are saved to the organization as part of the deployment')
         .option('--testLevel [testLevel]', 'Specifies which tests are run as part of a deployment (NoTestRun/RunSpecifiedTests/RunLocalTests/RunAllTestsInOrg)')
         .option('--runTests [runTests]', 'A list of Apex tests to run during deployment (commma separated)', function(l){ return l.split(','); })
         .option('--pollTimeout [pollTimeout]', 'Polling timeout in millisec (default is 60000ms)', parseInt)
         .option('--pollInterval [pollInterval]', 'Polling interval in millisec (default is 5000ms)', parseInt)
  acceptCommonOptions(program);
  program.parse(process.argv);
  var options = readOptions(program);
  (
    program.package ? tools.deployFromZipStream(fs.createReadStream(program.package), options) :
    program.directory ? tools.deployFromDirectory(program.directory, options) :
    program.pid ? tools.checkDeployStatus(program.pid, options) :
    Promise.reject(
      new Error('Please set --package or --directory option to specify deploying package content, or set --pid for deployment process')
    )
  )
  .then(function(res) {
    console.log('');
    console.log('===================');
    tools.reportDeployResult(res, console, program.verbose);
    console.log('===================');
    if (!res.success) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(function(err) {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = {
  deploy: deploy
};
