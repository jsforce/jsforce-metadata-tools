# jsforce-metadata-tools [![Build Status](https://travis-ci.org/jsforce/jsforce-metadata-tools.svg)](https://travis-ci.org/jsforce/jsforce-metadata-tools)

Tools for deploying/retrieving package files using Metadata API via [JSforce](https://jsforce.github.io/).

Provides command line interface (CLI) to easily deploy/retrieve packages.


## Install

```
$ npm install jsforce-metadata-tools -g
```

## Usage

### Deploying package from local directory

```
$ jsforce-deploy -u username@example.org -p ${SF_PASSWORD} --directory ./path/to/packageDir
```

### Deploying package from archived ZIP file

```
$ jsforce-deploy -u username@example.org -p ${SF_PASSWORD} --package ./path/to/package.zip
```

### Using connection authorized in JSforce REPL (no password required)

```
$ jsforce
> .authorize

...
(OAuth authorization flow)
...

Received authorization code. Please close the opened browser window.
Authorized. Fetching user info...
Logged in as : username@example.org
> .exit

$ jsforce-deploy -c username@example.org --directory ./path/to/pkg
```


