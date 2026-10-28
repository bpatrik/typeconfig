import * as path from 'path';
import * as os from 'os';
import {promises as fsp} from 'fs';


export class TestHelper {
  // the specs run both as CommonJS and as ES modules, so there is no __dirname to rely on
  public static readonly TempFolder = path.join(os.tmpdir(), 'typeconfig-test-' + process.pid);


  public static getFilePath(fileName: string) {
    return path.join(this.TempFolder, fileName);
  }

  public static async createTempFolder(): Promise<void> {
    await fsp.mkdir(this.TempFolder, {recursive: true});
  }

  public static async removeTempFolder(): Promise<void> {
    await fsp.rm(this.TempFolder, {recursive: true, force: true});
  }

  public static async cleanTempFolder(): Promise<void> {
    await this.removeTempFolder();
    await this.createTempFolder();
  }

}
