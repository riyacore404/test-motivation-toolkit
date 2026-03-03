import * as vscode from "vscode";

export interface TestResult {
  terminal: vscode.Terminal;
  runner: "pytest" | "cargo" | "npm" | "cpp";
  passes: number;
  fails: number;
  rawLine: string;
}

interface RunnerPatternConfig {
  startPatterns: RegExp[];
  resultPatterns: RegExp[];
}

type RunnerKey = "pytest" | "cargo" | "npm" | "cpp";

export class TestDetector {
  private buffer: string = "";
  private activeRunner: RunnerKey | null = null;

  private readonly runnerConfigs: Map<RunnerKey, RunnerPatternConfig>;

  private readonly _onTestFail = new vscode.EventEmitter<TestResult>();
  private readonly _onTestPass = new vscode.EventEmitter<TestResult>();

  readonly onTestFail = this._onTestFail.event;
  readonly onTestPass = this._onTestPass.event;

  private readonly disposable: vscode.Disposable;

  constructor(private readonly terminal: vscode.Terminal) {
    this.runnerConfigs = new Map([
      [
        "pytest",
        {
          startPatterns: [/^\s*pytest\b/i],
          resultPatterns: [
            /(?<failed>\d+)\s+failed(?:.*?(?<passed>\d+)\s+passed)?/i,
            /(?<passed>\d+)\s+passed(?:.*?(?<failed>\d+)\s+failed)?/i
          ]
        }
      ],
      [
        "cargo",
        {
          startPatterns: [/cargo\s+test/i],
          resultPatterns: [
            /test result:.*?(?<passed>\d+)\s+passed;\s*(?<failed>\d+)\s+failed/i
          ]
        }
      ],
      [
        "npm",
        {
          startPatterns: [/^\s*npm\s+test\b/i],
          resultPatterns: [
            /(?<passed>\d+)\s+passing/i,
            /(?<failed>\d+)\s+failing/i
          ]
        }
      ],
      [
        "cpp",
        {
          startPatterns: [/\.\/(.*test.*)\b/i],
          resultPatterns: [
            /\[.*PASSED.*\]\s*(?<passed>\d+)/i,
            /\[.*FAILED.*\]\s*(?<failed>\d+)/i
          ]
        }
      ]
    ]);

    // Cast needed because terminalDataWriteEvent is a proposed API
    this.disposable = (vscode.window as any).onDidWriteTerminalData((e: any) => {
      if (e.terminal !== this.terminal) { return; }
      this.handleChunk(e.data);
    });
  }

  private handleChunk(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    // Keep last incomplete line in buffer
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      this.processLine(line.trim());
    }
  }

  private stripAnsi(str: string): string {
    return str
      .replace(/\x1b\][^\x07]*\x07/g, '')           // OSC sequences
      .replace(/\x1b\][^\x1b]*\x1b\\/g, '')          // OSC with ST terminator
      .replace(/[\x1b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, '')
      .replace(/\u001b\(B/g, '');
  }

  private processLine(line: string): void {
    const clean = this.stripAnsi(line).trim();
    if (!clean) { return; }

    if (!this.activeRunner) {
      for (const [runner, config] of this.runnerConfigs.entries()) {
        if (config.startPatterns.some(r => r.test(clean))) {
          this.activeRunner = runner;
          console.log(`[TestDetector] Session started: ${runner}`);
          break;
        }
      }
    }

    if (!this.activeRunner) { return; }

    const config = this.runnerConfigs.get(this.activeRunner);
    if (!config) { return; }

    for (const pattern of config.resultPatterns) {
      const match = pattern.exec(clean);  // ← clean, not line
      if (!match?.groups) { continue; }

      const passes = parseInt(match.groups.passed ?? "0", 10);
      const fails = parseInt(match.groups.failed ?? "0", 10);

      const result: TestResult = {
        terminal: this.terminal,
        runner: this.activeRunner,
        passes,
        fails,
        rawLine: line  // ← keep original for debugging
      };

      console.log(`[TestDetector] Result: ${passes} passed, ${fails} failed`);

      if (fails > 0) {
        this._onTestFail.fire(result);
      } else {
        this._onTestPass.fire(result);
      }

      this.activeRunner = null;
      break;
    }
  }

  dispose(): void {
    this.disposable.dispose();
    this._onTestFail.dispose();
    this._onTestPass.dispose();
  }
}