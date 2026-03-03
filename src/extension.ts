import * as vscode from "vscode";
import { StatusBarManager } from "./status/statusBar";
import { AudioManager } from "./audio/audioManager";
import { RoastManager } from "./roast/roastManager";
import { TestDetector } from "./detector/testDetector";

// Module-level maps so deactivate() can clean them up
const detectors = new Map<vscode.Terminal, TestDetector>();
const cooldowns = new Map<vscode.Terminal, number>();

export function activate(context: vscode.ExtensionContext) {
    console.log("[TestMotivation] Activating...");

    const statusBar = new StatusBarManager();
    const audio = new AudioManager();
    const roast = new RoastManager();

    // StatusBarManager has dispose() — VS Code will call it on deactivation
    context.subscriptions.push(statusBar);

    // ── Cooldown check ────────────────────────────────────────────────────────
    function isOnCooldown(terminal: vscode.Terminal): boolean {
        const now = Date.now();
        const last = cooldowns.get(terminal) ?? 0;
        const config = vscode.workspace.getConfiguration("test-motivation-toolkit");
        const cooldownMs = config.get<number>("cooldownMs") ?? 3000;

        if (now - last < cooldownMs) { return true; }
        cooldowns.set(terminal, now);
        return false;
    }

    // ── Wire up a detector for one terminal ───────────────────────────────────
    function attachDetector(terminal: vscode.Terminal): void {
        if (detectors.has(terminal)) { return; }

        const detector = new TestDetector(terminal);
        detectors.set(terminal, detector);

        // Push detector itself so VS Code disposes it on deactivation
        context.subscriptions.push(detector);

        // Stable identifier for streak tracking: runner name + terminal name
        const makeId = (runner: string) => `${runner}:${terminal.name}`;

        detector.onTestFail(async result => {
            if (isOnCooldown(terminal)) { return; }

            const config = vscode.workspace.getConfiguration("test-motivation-toolkit");

            if (config.get<boolean>("enableFailSound")) {
                audio.playFail(config.get<string>("failSoundPath"));
            }

            await roast.showFailRoast({
                runner: result.runner,
                passes: result.passes,
                fails: result.fails,
                total: result.passes + result.fails,
                streak: 0  // RoastManager tracks the real streak internally
            });

            statusBar.update(result.passes, result.fails);
        });

        detector.onTestPass(async result => {
            if (isOnCooldown(terminal)) { return; }

            const config = vscode.workspace.getConfiguration("test-motivation-toolkit");
            if (config.get<boolean>("enableSuccessSound")) {
                audio.playSuccess(config.get<string>("successSoundPath"));
            }

            roast.resetStreak(result.runner);
            statusBar.update(result.passes, result.fails);
        });

        console.log(`[TestMotivation] Attached detector to terminal: ${terminal.name}`);
    }

    // ── Attach to terminals that are already open ─────────────────────────────
    for (const terminal of vscode.window.terminals) {
        attachDetector(terminal);
    }

    // ── Attach to future terminals ────────────────────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal(terminal => {
            attachDetector(terminal);
        })
    );

    // ── Clean up when a terminal closes ──────────────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal(terminal => {
            detectors.get(terminal)?.dispose();
            detectors.delete(terminal);
            cooldowns.delete(terminal);
        })
    );

    console.log("[TestMotivation] Active. Listening to terminals.");
}

export function deactivate() {
    detectors.forEach(d => d.dispose());
    detectors.clear();
    cooldowns.clear();
}