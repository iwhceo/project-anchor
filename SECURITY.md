# Security Policy

## Supported versions

Only the latest minor version receives security fixes.

## Reporting a vulnerability

Please email the maintainer privately. Do not open public issues for security reports.

Expected response time: within seventy-two hours.

## Threat model

ProjectAnchor runs locally. It writes to `~/.claude/anchor/` and to `~/.claude/settings.json`. It does not open network sockets at runtime beyond the one-time embedding model download from Hugging Face. It does not read environment variables that contain API keys. Audit `runtime/src/` if you need to verify.
