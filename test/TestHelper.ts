import * as path from 'path';
import {promises as fsp} from 'fs';
import rimraf from 'rimraf';


export class TestHelper {
  public static readonly TempFolder = path.join(__dirname, 'tmp');


  public static getFilePath(fileName: string) {
    return path.join(this.TempFolder, fileName);
  }

  public static async createTempFolder(): Promise<void> {
    await fsp.mkdir(this.TempFolder);
  }

  public static async removeTempFolder(): Promise<void> {
    await rimraf(this.TempFolder);
  }

  public static async cleanTempFolder(): Promise<void> {
    await this.removeTempFolder();
    await this.createTempFolder();
  }

}
