import * as path from 'path';
import {promises as fsp} from 'fs';
import * as rimraf from 'rimraf';
import * as util from 'util';

const rimrafPR = util.promisify(rimraf);

export class TestHelper {
  public static readonly TempFolder = path.join(__dirname, 'tmp');


  public static getFilePath(fileName: string) {
    return path.join(this.TempFolder, fileName);
  }

  public static async createTempFolder() {
    await fsp.mkdir(this.TempFolder);
  }

  public static async removeTempFolder() {
    await rimrafPR(this.TempFolder);
  }
  public static async cleanTempFolder() {
    await this.removeTempFolder();
    await this.createTempFolder();
  }

}
