# 🔥 Test Motivation Toolkit

> Your tests failed. Again. Let's talk about that.

A VS Code extension that watches your terminal, detects test failures, and responds with **AI-generated roasts**, **sound effects**, and a **live pass/fail counter** in your status bar.

Because silent failures breed mediocrity.

---

## What it does

| Event | Response |
|---|---|
| Tests fail | 💥 Plays a fail sound |
| Tests fail | 🔥 Fires an AI-generated insult (roast mode) |
| Tests pass | ✅ Updates the status bar counter |
| Keeps failing | 📈 Escalates the severity of roasts |

**Status bar:**
```
❌ 3 Fails | ✅ 10 Passes
```

**Roast popup (mild):**
> 🔥 Bold strategy. Didn't work.

**Roast popup (existential, after 6 consecutive failures):**
> 🔥 The tests aren't failing. They're giving up.

---

## Supported Test Runners

| Runner | Language | Status |
|---|---|---|
| `cargo test` | Rust | ✅ Supported |
| `pytest` | Python | 🔜 Coming soon |
| `npm test` | JavaScript | 🔜 Coming soon |
| C++ test binaries | C++ | 🔜 Coming soon |

Works entirely through **terminal output** — no Testing API required. If it runs in the VS Code terminal, it works.

---

## Installation

Install from the [VS Code Marketplace](#) or download the `.vsix` directly from [Releases](#).

---

## Setup

### Basic (sounds + status bar)
Works out of the box. Just install and run your tests.

### AI Roast Mode (optional but highly recommended)

1. Get a free API key from [openrouter.ai](https://openrouter.ai)
2. Open VS Code Settings (`Cmd+,`)
3. Search `test motivation`
4. Paste your key into **Open Router Api Key**
5. Enable **Roast Mode**
6. Ship broken code and face the consequences

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `enableFailSound` | `true` | Play sound on test failure |
| `enableSuccessSound` | `false` | Play sound on test pass |
| `failSoundPath` | `""` | Custom fail sound path (`.wav`) |
| `successSoundPath` | `""` | Custom success sound path (`.wav`) |
| `enableRoastMode` | `false` | Enable AI roast popups |
| `openRouterApiKey` | `""` | Your OpenRouter API key |
| `cooldownMs` | `3000` | Minimum ms between triggers per terminal |

---

## Roast Escalation

The extension tracks your failure streak per test runner. The more you fail, the darker it gets.

| Streak | Tier | Sample |
|---|---|---|
| 1 | Mild | *"Classic."* |
| 2–3 | Medium | *"This is becoming a pattern."* |
| 4–5 | Severe | *"Stack Overflow cannot help you now."* |
| 6+ | Existential | *"Why do you write code?"* |

No API key? No problem. Falls back to hand-crafted local roasts automatically.

---

## How it works

The extension listens to VS Code's terminal data stream and parses output line by line. When it detects a test runner starting (e.g. `cargo test`) it opens a session, waits for the result line, extracts pass/fail counts, and fires the appropriate response.

No shell wrappers. No test runner plugins. No configuration beyond settings.

```
Terminal output
      ↓
ANSI stripping + line buffering
      ↓
Pattern matching per runner
      ↓
onTestFail / onTestPass events
      ↓
Audio + Roast + Status Bar
```

---

## Contributing

PRs welcome — especially for new test runner support. Each runner needs:
- A start pattern (what command triggers it)
- A result pattern with named capture groups `(?<passed>\d+)` and `(?<failed>\d+)`

Add it to the `runnerConfigs` map in `src/detector/testDetector.ts`.

---

## License

MIT

---

*Built by a developer who was tired of failing tests in silence.*