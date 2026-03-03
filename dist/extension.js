"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/status/statusBar.ts
var vscode = __toESM(require("vscode"));
var StatusBarManager = class {
  item;
  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }
  update(passes, fails) {
    this.item.text = `\u274C ${fails} Fails | \u2705 ${passes} Passes`;
    this.item.color = fails > 0 ? new vscode.ThemeColor("statusBarItem.warningForeground") : void 0;
    this.item.show();
  }
  reset() {
    this.item.hide();
  }
  dispose() {
    this.item.dispose();
  }
};

// src/audio/audioManager.ts
var import_child_process = require("child_process");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var AudioManager = class {
  getDefaultPath(type) {
    return path.resolve(__dirname, "media", `${type}.wav`);
  }
  playFail(customPath) {
    const cfg = require("vscode").workspace.getConfiguration("test-motivation-toolkit");
    if (!cfg.get("enableFailSound")) return;
    const filePath = customPath?.trim() ? customPath : this.getDefaultPath("fail");
    this.playFile(filePath);
  }
  playSuccess(customPath) {
    const cfg = require("vscode").workspace.getConfiguration("test-motivation-toolkit");
    if (!cfg.get("enableSuccessSound")) return;
    const filePath = customPath?.trim() ? customPath : this.getDefaultPath("success");
    this.playFile(filePath);
  }
  playFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.warn(`[AudioManager] Sound file not found: ${filePath}`);
      return;
    }
    const platform = process.platform;
    let command;
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
    (0, import_child_process.exec)(command, (err) => {
      if (err) console.warn(`[AudioManager] Playback error: ${err.message}`);
    });
  }
};

// src/roast/roastManager.ts
var vscode2 = __toESM(require("vscode"));

// src/roast/openRouterClient.ts
async function getInsult(apiKey, context) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4e3);
  const prompt = `You are a cold, ruthless code reviewer.
A developer just ran ${context.total} tests. ${context.fails} failed, ${context.passes} passed. Failure streak: ${context.streak}.
Write ONE devastating insult. Max 15 words. No profanity. Be specific and clever.
Only output the insult, nothing else.`;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "vscode-test-motivation"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        max_tokens: 30,
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error("API error");
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// src/roast/roastManager.ts
var FALLBACK_ROASTS = {
  mild: [
    "Tests don't lie. You do.",
    "Bold strategy. Didn't work.",
    "Classic.",
    "The compiler tried to warn you.",
    "Have you considered project management?",
    "One failure. Totally fine. Sure."
  ],
  medium: [
    "This is becoming a pattern.",
    "The tests aren't the problem here.",
    "Somewhere, a senior dev is sighing.",
    "Your git blame is a horror story.",
    "At this rate, you're shipping bugs as features.",
    "The standup tomorrow will be interesting."
  ],
  severe: [
    "This code has a spiritual problem.",
    "The tests aren't failing. They're giving up.",
    "At this point, delete and start over.",
    "Stack Overflow cannot help you now.",
    "The error message is being polite.",
    "Fundamentally, something went wrong. Much earlier."
  ],
  existential: [
    "Why do you write code?",
    "The computer is disappointed. So are we.",
    "Your keyboard deserves better.",
    "Even the linter has gone quiet.",
    "This is the fifth failure. The tests have accepted their fate.",
    "Some bugs are load-bearing. This one is not."
  ]
};
var RoastManager = class {
  streaks = /* @__PURE__ */ new Map();
  async showFailRoast(context) {
    const config = vscode2.workspace.getConfiguration("test-motivation-toolkit");
    if (!config.get("enableRoastMode")) {
      return;
    }
    const streak = (this.streaks.get(context.runner) ?? 0) + 1;
    this.streaks.set(context.runner, streak);
    let message;
    const apiKey = config.get("openRouterApiKey")?.trim();
    if (apiKey) {
      try {
        message = await getInsult(apiKey, { ...context, streak });
      } catch (err) {
        message = this.getFallback(streak);
      }
    } else {
      message = this.getFallback(streak);
    }
    setTimeout(() => {
      vscode2.window.showWarningMessage(`\u{1F525} ${message}`);
    }, 600);
  }
  resetStreak(runner) {
    this.streaks.set(runner, 0);
  }
  getFallback(streak) {
    const tier = this.getTier(streak);
    const messages = FALLBACK_ROASTS[tier];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  getTier(streak) {
    if (streak >= 6) {
      return "existential";
    }
    if (streak >= 4) {
      return "severe";
    }
    if (streak >= 2) {
      return "medium";
    }
    return "mild";
  }
};

// src/detector/testDetector.ts
var vscode3 = __toESM(require("vscode"));
var TestDetector = class {
  constructor(terminal) {
    this.terminal = terminal;
    this.runnerConfigs = /* @__PURE__ */ new Map([
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
    this.disposable = vscode3.window.onDidWriteTerminalData((e) => {
      if (e.terminal !== this.terminal) {
        return;
      }
      this.handleChunk(e.data);
    });
  }
  buffer = "";
  activeRunner = null;
  runnerConfigs;
  _onTestFail = new vscode3.EventEmitter();
  _onTestPass = new vscode3.EventEmitter();
  onTestFail = this._onTestFail.event;
  onTestPass = this._onTestPass.event;
  disposable;
  handleChunk(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      this.processLine(line.trim());
    }
  }
  stripAnsi(str) {
    return str.replace(/\x1b\][^\x07]*\x07/g, "").replace(/\x1b\][^\x1b]*\x1b\\/g, "").replace(/[\x1b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, "").replace(/\u001b\(B/g, "");
  }
  processLine(line) {
    const clean = this.stripAnsi(line).trim();
    if (!clean) {
      return;
    }
    if (!this.activeRunner) {
      for (const [runner, config2] of this.runnerConfigs.entries()) {
        if (config2.startPatterns.some((r) => r.test(clean))) {
          this.activeRunner = runner;
          console.log(`[TestDetector] Session started: ${runner}`);
          break;
        }
      }
    }
    if (!this.activeRunner) {
      return;
    }
    const config = this.runnerConfigs.get(this.activeRunner);
    if (!config) {
      return;
    }
    for (const pattern of config.resultPatterns) {
      const match = pattern.exec(clean);
      if (!match?.groups) {
        continue;
      }
      const passes = parseInt(match.groups.passed ?? "0", 10);
      const fails = parseInt(match.groups.failed ?? "0", 10);
      const result = {
        terminal: this.terminal,
        runner: this.activeRunner,
        passes,
        fails,
        rawLine: line
        // ← keep original for debugging
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
  dispose() {
    this.disposable.dispose();
    this._onTestFail.dispose();
    this._onTestPass.dispose();
  }
};

// src/extension.ts
var detectors = /* @__PURE__ */ new Map();
var cooldowns = /* @__PURE__ */ new Map();
function activate(context) {
  console.log("[TestMotivation] Activating...");
  const statusBar = new StatusBarManager();
  const audio = new AudioManager();
  const roast = new RoastManager();
  context.subscriptions.push(statusBar);
  function isOnCooldown(terminal) {
    const now = Date.now();
    const last = cooldowns.get(terminal) ?? 0;
    const config = vscode4.workspace.getConfiguration("test-motivation-toolkit");
    const cooldownMs = config.get("cooldownMs") ?? 3e3;
    if (now - last < cooldownMs) {
      return true;
    }
    cooldowns.set(terminal, now);
    return false;
  }
  function attachDetector(terminal) {
    if (detectors.has(terminal)) {
      return;
    }
    const detector = new TestDetector(terminal);
    detectors.set(terminal, detector);
    context.subscriptions.push(detector);
    const makeId = (runner) => `${runner}:${terminal.name}`;
    detector.onTestFail(async (result) => {
      if (isOnCooldown(terminal)) {
        return;
      }
      const config = vscode4.workspace.getConfiguration("test-motivation-toolkit");
      if (config.get("enableFailSound")) {
        audio.playFail(config.get("failSoundPath"));
      }
      await roast.showFailRoast({
        runner: result.runner,
        passes: result.passes,
        fails: result.fails,
        total: result.passes + result.fails,
        streak: 0
        // RoastManager tracks the real streak internally
      });
      statusBar.update(result.passes, result.fails);
    });
    detector.onTestPass(async (result) => {
      if (isOnCooldown(terminal)) {
        return;
      }
      const config = vscode4.workspace.getConfiguration("test-motivation-toolkit");
      if (config.get("enableSuccessSound")) {
        audio.playSuccess(config.get("successSoundPath"));
      }
      roast.resetStreak(result.runner);
      statusBar.update(result.passes, result.fails);
    });
    console.log(`[TestMotivation] Attached detector to terminal: ${terminal.name}`);
  }
  for (const terminal of vscode4.window.terminals) {
    attachDetector(terminal);
  }
  context.subscriptions.push(
    vscode4.window.onDidOpenTerminal((terminal) => {
      attachDetector(terminal);
    })
  );
  context.subscriptions.push(
    vscode4.window.onDidCloseTerminal((terminal) => {
      detectors.get(terminal)?.dispose();
      detectors.delete(terminal);
      cooldowns.delete(terminal);
    })
  );
  console.log("[TestMotivation] Active. Listening to terminals.");
}
function deactivate() {
  detectors.forEach((d) => d.dispose());
  detectors.clear();
  cooldowns.clear();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
