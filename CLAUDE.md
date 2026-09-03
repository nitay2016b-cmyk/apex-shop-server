# CLAUDE.md

## Security: scanning new skills and plugins before installation

Before installing any new Claude Code skill or plugin, run [NVIDIA Skillspector](https://github.com/NVIDIA/Skillspector) on it first:

```bash
skillspector scan <path-or-url>
```

If the scan reports a finding with severity **HIGH** or **CRITICAL**, do not install the skill or plugin. Investigate the finding (and, if applicable, report it or find a safer alternative) before proceeding.

Skillspector is configured to use the local Claude CLI as its LLM provider (`SKILLSPECTOR_PROVIDER=claude_cli`, set in the shell rc files), so no separate API key is required.
