import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

export class AudioManager {
  private getDefaultPath(type: "success" | "fail"): string {
    return path.resolve(__dirname, "media", `${type}.wav`);
  }

  playFail(customPath?: string): void {
    const cfg: any = require("vscode").workspace.getConfiguration("test-motivation-toolkit");
    if (!cfg.get("enableFailSound") as boolean) return;
    const filePath = customPath?.trim() ? customPath : this.getDefaultPath("fail");
    this.playFile(filePath);
  }

  playSuccess(customPath?: string): void {
    const cfg: any = require("vscode").workspace.getConfiguration("test-motivation-toolkit");
    if (!cfg.get("enableSuccessSound") as boolean) return;
    const filePath = customPath?.trim() ? customPath : this.getDefaultPath("success");
    this.playFile(filePath);
  }

  private playFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      console.warn(`[AudioManager] Sound file not found: ${filePath}`);
      return;
    }

    const platform = process.platform;
    let command: string;

    if (platform === "darwin") {
      command = `afplay "${filePath}"`;
    } else if (platform === "linux") {
      command = `which paplay > /dev/null 2>&1 && paplay "${filePath}" || aplay "${filePath}"`;
    } else if (platform === "win32") {
      const safe = filePath.replace(/'/g, "''");
      command = `powershell -NoProfile -Command "Try { (New-Object Media.SoundPlayer -ArgumentList '${safe}').PlaySync() } Catch {}"`;
    } else {
      console.warn(`[AudioManager] Unsupported platform: ${platform}`);
      return;
    }

    exec(command, (err) => {
      if (err) console.warn(`[AudioManager] Playback error: ${err.message}`);
    });
  }
}