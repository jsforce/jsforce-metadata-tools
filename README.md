# jsforce-metadata-tools [![Build Status](https://travis-ci.org/jsforce/jsforce-metadata-tools.svg)](https://travis-ci.org/jsforce/jsforce-metadata-tools)

Tools for deploying/retrieving package files using Salesforce Metadata API via [JSforce](https://jsforce.github.io/).

Provides command line interface (CLI) to easily deploy/retrieve packages.


## Install

```
$ npm install jsforce-metadata-tools -g
```

## Usage

### Deploy

#### Deploy package from local directory

```
$ jsforce-deploy -u username@example.org -p ${SF_PASSWORD} -D ./path/to/packageDir
```

#### Deploy package from ZIP archive file

```
$ jsforce-deploy -u username@example.org -p ${SF_PASSWORD} -Z ./path/to/package.zip
```

### Retrieve

#### Retrieve package files and write them under the directory

(Assuming that `./path/to/packageDir` directory has a `package.xml` file inside)
```
$ jsforce-retrieve -u username@example.org -p ${SF_PASSWORD} -D ./path/to/packageDir
```

#### Retrieve package files by specifying metadata types/members to retrieve

```
$ jsforce-retrieve -u username@example.org -p ${SF_PASSWORD} --memberTypes "ApexClass:Class1,Class2;ApexPage:*" -D ./path/to/distDir
```

#### Retrieve package files by specifying package names to retrieve

```
$ jsforce-retrieve -u username@example.org -p ${SF_PASSWORD} --packageNames "Package1,Package2" -D "./path/to/distDir1,./path/to/distDir2"
```

#### Retrieve package files by specifying package.xml file

```
$ jsforce-retrieve -u username@example.org -p ${SF_PASSWORD} -P ./path/to/package.xml -D ./path/to/distDir
```

#### Retrieve package and output as a ZIP archive file 

```
$ jsforce-retrieve -u username@example.org -p ${SF_PASSWORD} --packageNames Package1 -Z ./path/to/package.zip
```


### OAuth-based Authorization

Once the authorization is done in JSforce REPL, the same connection is also valid here (no password required)

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

$ jsforce-deploy -c username@example.org -D ./path/to/packageDir
```


