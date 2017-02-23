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

#Recommended Usage
See example folder.

The architecture helps separating public and private configuration. Private config will be only available at server side, while Public config at front and backend side too.
The up-to-date public config is sent to the frontend with ejs template.