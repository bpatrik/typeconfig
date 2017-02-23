# typeconfig
Configuration file for Typescript.
Useful for separating frontend (public) and backend (private) config
Features:
 - Creating Configuration in Typescript file with types
 - Loading configuration from file, command line arguments, environmental variables
 - Support config file hierarchy
#Install

```shell
npm install typeconfig
```

#Usage

### backend
```typescript
let Config = {
    Private:{
        something:5,
        PORT:1234
    },
    Public:{
        a:6
    }
};
 

ConfigLoader.loadBackendConfig(Config, //Config object to load the data to
    path.join(__dirname, './../../../config.json'), // configuration file path
    [["PORT", "Private-PORT"]]); //environmental variable mapping to config variable
```

### frontend

```typescript
let Config = {
    Public:{
        a:6
    }
};

if (typeof ServerInject !== "undefined" && typeof ServerInject.ConfigInject !== "undefined") {
    WebConfigLoader.loadFrontendConfig(Config.Public, ServerInject.ConfigInject);
}
```

### config changing
  * updating config file (if not exist, it will be created)
  * setting environmental variable
  * Command line arguments
    *  `node index.js --Private-something=3 --Public-a=10`


#Recommended Usage
See example folder.

The architecture helps separating public and private configuration. Private config will be only available at server side, while Public config at front and backend side too.
The up-to-date public config is sent to the frontend with ejs template.