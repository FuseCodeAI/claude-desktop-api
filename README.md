# claude-desktop-api

One-click configuration tool for Claude Desktop — toggle developer mode, sync Claude Code env vars, and configure third-party inference gateways.

## Features

- **Developer Mode** — Enable `allowDevTools` with a single toggle
- **Env Sync** — Read env vars from `~/.claude/settings.json` and sync to system via `launchctl setenv`
- **Gateway Config** — Configure third-party inference gateway (URL, API Key, Auth Scheme) for Claude Desktop 3p mode
- **Restart** — Kill and relaunch Claude Desktop after config changes

## Quick Start

```bash
npm install
npm start
```

## How It Works

Claude Desktop reads configuration from local JSON files:

| File | Purpose |
|------|---------|
| `~/Library/Application Support/Claude/developer_settings.json` | Developer mode |
| `~/Library/Application Support/Claude-3p/claude_desktop_config.json` | Deployment mode |
| `~/Library/Application Support/Claude-3p/configLibrary/<uuid>.json` | Gateway credentials |

This tool provides a GUI to manage these files safely.

## License

MIT

---

made by [fusecode.cc](https://fusecode.cc)
