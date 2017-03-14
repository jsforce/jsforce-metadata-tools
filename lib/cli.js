var fs = require('fs');
var path = require('path');
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
  program.option('--verbose', 'Output execution detail log')
         .version(pkg.version);
}

function readOptions(program) {
  var options = {};
  "username,password,connection,loginUrl,pollInterval,pollTimeout".split(',').forEach(function(prop) {
    if (typeof program[prop] !== 'undefined') { options[prop] = program[prop]; }
  });
  if (program.sandbox) {
    options.loginUrl = 'https://test.salesforce.com';
  }
  options.logger = console;
  return options;
}

function readDeployOptions(program) {
  var options = readOptions(program);
  "testLevel,runTests,ignoreWarnings,rollbackOnError".split(',').forEach(function(prop) {
    if (typeof program[prop] !== 'undefined') { options[prop] = program[prop]; }
  });
  if (program.dryRun) {
    options.checkOnly = true;
  }
  return options;
}

function readRetrieveOptions(program) {
  var options = readOptions(program);
  "apiVersion".split(',').forEach(function(prop) {
    if (typeof program[prop] !== 'undefined') { options[prop] = program[prop]; }
  });
  return options;
}


function parseList(a) {
  return a.split(/\s*,\s*/);
}

function showInvalidOptionError(message, program) {
  console.error('');
  console.error('  Error: Invalid option.' + (message || ''));
  program.help();
  process.exit(1);
}

/**
 *
 */
function deploy() {
  var program = new commander.Command();
  acceptConnectionOptions(program);
  program.option('-D, --directory [directory]', 'Local directory path of the package to deploy')
         .option('-Z, --zipFile [zipFile]', 'Input file path of ZIP archive of metadata files to deploy')
         .option('--pid [pid]', 'Process ID of previous deployment to check status')
         .option('--dry-run', 'Dry run. Same as --checkOnly')
         .option('--checkOnly', 'Whether Apex classes and triggers are saved to the organization as part of the deployment')
         .option('--testLevel [testLevel]', 'Specifies which tests are run as part of a deployment (NoTestRun/RunSpecifiedTests/RunLocalTests/RunAllTestsInOrg)')
         .option('--runTests [runTests]', 'A list of Apex tests to run during deployment (commma separated)', parseList)
         .option('--ignoreWarnings', 'Indicates whether a warning should allow a deployment to complete successfully (true) or not (false).')
         .option('--rollbackOnError', 'Indicates whether any failure causes a complete rollback (true) or not (false)')
         .option('--pollTimeout [pollTimeout]', 'Polling timeout in millisec (default is 60000ms)', parseInt)
         .option('--pollInterval [pollInterval]', 'Polling interval in millisec (default is 5000ms)', parseInt)
  acceptCommonOptions(program);
  program.parse(process.argv);
  var options = readDeployOptions(program);
  if (!program.zipFile && !program.directory && !program.pid) {
    return showInvalidOptionError(
      'Please set --directory or --zipFile option to specify deploying package content, or set --pid for previous deployment process ID.',
      program
    );
  }
  (
    program.zipFile ? tools.deployFromZipStream(fs.createReadStream(program.zipFile), options) :
    program.directory ? tools.deployFromDirectory(program.directory, options) :
    program.pid ? tools.checkDeployStatus(program.pid, options) :
    Promise.reject(new Error('Invalid Options'))
  )
  .then(function(res) {
    console.log('');
    tools.reportDeployResult(res, console, program.verbose);
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

/**
 *
 */
function retrieve() {
  var program = new commander.Command();
  acceptConnectionOptions(program);
  program.option('-D, --directory [directory]',
                 'Directory path to extract the retrieved metadata files. ' +
                 'Should be a list (comma-separated) if there are multiple entries in packageNames',
                 parseList)
         .option('-Z, --zipFile [zipFile]', 'Output file path of ZIP archive of retrieved metadata')
         .option('-P, --packageXML [packageXML]', 'A package.xml file path to specify the retrieving metadata contents')
         .option('--pid [pid]', 'Process ID of previous retrieve request')
         .option('--apiVersion [apiVersion]', 'API version of retrieving package')
         .option('--packageNames [packageNames]', 'List of package names to retrieve (comma separated)', parseList)
         .option('--memberTypes [memberTypes]', 'Metadata types and its members. The format is like following: "ApexClass:Class1,Class2;ApexPage:Page1,Page2;ApexTrigger:*"')
         .option('--pollTimeout [pollTimeout]', 'Polling timeout in millisec (default is 60000ms)', parseInt)
         .option('--pollInterval [pollInterval]', 'Polling interval in millisec (default is 5000ms)', parseInt)
  acceptCommonOptions(program);
  program.parse(process.argv);
  var options = readRetrieveOptions(program);
  if (!program.directory && !program.zipFile) {
    return showInvalidOptionError(
      'Please set --directory or --zipFile option to specify the destination of retrieved metadata package.',
      program
    );
  }
  if (program.packageNames && program.directory && program.packageNames.length !== program.directory.length) {
    return showInvalidOptionError(
      'Please set output directory paths in --directory option, corresponding to entiries in packageNames option.',
      program
    );
  }
  if (!program.pid && !program.memberTypes && !program.packageNames && !program.packageXML &&
        (!program.directory || program.directory.length !== 1)) {
    return showInvalidOptionError(
      'Please set --packageNames or --memberTypes in options, or speclify package.xml file path in --packageXML option',
      program
    );
  }
  (
    program.pid ? tools.checkRetrieveStatus(program.pid, options) :
    program.memberTypes ? tools.retrieveByTypes(program.memberTypes, options) :
    program.packageNames ? tools.retrieveByPackageNames(program.packageNames, options) :
    program.packageXML ? tools.retrieveByPackageXML(program.packageXML, options) :
    program.directory && program.directory.length === 1 ? tools.retrieveByPackageXML(path.join(program.directory[0], 'package.xml'), options) :
    Promise.reject(new Error('Invalid option'))
  )
  .then(function(res) {
    console.log('');
    tools.reportRetrieveResult(res, console, program.verbose);
    if (!res.success) {
      console.log('');
      console.log('No output files generated.');
      return false;
    } else if (program.zipFile) {
      fs.writeFileSync(program.zipFile, new Buffer(res.zipFile, 'base64'));
      console.log('');
      console.log('Retrieved metadata files are saved in a ZIP archive: ' + program.zipFile);
      return true;
    } else if (program.directory) {
      var dirMapping = {};
      if (program.packageNames) {
        for (var i=0; i<program.packageNames.length; i++) {
          dirMapping[program.packageNames[i]] = program.directory[i];
        }
      } else {
        dirMapping['*'] = program.directory[0];
      }
      return tools.extractZipContents(res.zipFile, dirMapping, console, program.verbose)
        .then(function() {
          console.log('');
          console.log('Retrieved metadata files are saved under the directory: ');
          program.directory.forEach(function(dir) { console.log('  ' + dir); });
          return true;
        });
    } else {
      return false;
    }
  })
  .then(function(success) {
    console.log('');
    if (!success) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(function(err) {
    console.log('');
    console.error('  Error: '+err.message);
    console.log('');
    process.exit(1);
  });
}


/**
 *
 */
module.exports = {
  deploy: deploy,
  retrieve: retrieve
};
