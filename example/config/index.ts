import {Config} from './ServerConfig';



console.log(JSON.stringify(Config.toJSON({attachVolatile: true, attachState: true, attachDescription: true}),
  null, '\t'));

