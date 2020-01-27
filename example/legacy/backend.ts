import * as express from 'express';
import {Request, Response} from 'express';
import {Config} from './config/private/Config';


let app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

console.log(Config);

/*
With the help of ejs template, we are sending the Config.Public to frontend
 */
app.get('/', function (req: Request, res: Response) {
  let tpl = {
    clientConfig: Config.Public,
  };
  res.render('index', tpl);
});
