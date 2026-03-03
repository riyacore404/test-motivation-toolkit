import * as vscode from "vscode";

export class StatusBarManager {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  update(passes: number, fails: number): void {
    this.item.text = `❌ ${fails} Fails | ✅ ${passes} Passes`;
    this.item.color =
      fails > 0
        ? new vscode.ThemeColor("statusBarItem.warningForeground")
        : undefined;
    this.item.show();
  }

  reset(): void {
    this.item.hide();
  }

  dispose(): void {
    this.item.dispose();
  }
}