import * as vscode from "vscode";
import { getInsult, RoastContext } from "./openRouterClient";

type Tier = "mild" | "medium" | "severe" | "existential";

const FALLBACK_ROASTS: Record<Tier, string[]> = {
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

export class RoastManager {
  private readonly streaks = new Map<string, number>();

  public async showFailRoast(context: RoastContext): Promise<void> {
    const config = vscode.workspace.getConfiguration("test-motivation-toolkit");
    if (!config.get<boolean>("enableRoastMode")) { return; }

    const streak = (this.streaks.get(context.runner) ?? 0) + 1;
    this.streaks.set(context.runner, streak);

    let message: string;
    const apiKey = config.get<string>("openRouterApiKey")?.trim();

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
      vscode.window.showWarningMessage(`🔥 ${message}`);
    }, 600);
  }

  public resetStreak(runner: string): void {
    this.streaks.set(runner, 0);
  }

  private getFallback(streak: number): string {
    const tier = this.getTier(streak);
    const messages = FALLBACK_ROASTS[tier];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getTier(streak: number): Tier {
    if (streak >= 6) { return "existential"; }
    if (streak >= 4) { return "severe"; }
    if (streak >= 2) { return "medium"; }
    return "mild";
  }
}