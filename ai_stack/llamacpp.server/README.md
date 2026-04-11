# Llama.cpp Server Persistence

This directory contains scripts and configurations for keeping the `llama-server` running across VM restarts and crashes.

## Options for Persistence

### 1. Docker (Recommended)
The most isolated and portable way to run the server.

- **Configure**: Edit [docker-compose.yml](docker-compose.yml).
- **Start**: `docker compose up -d`
- **Why**: Handles dependencies, automatic restarts, and isolation.

---

### 2. Debian VM (Systemd)
Native way to run as a persistent background service on Debian/Ubuntu.

- **File**: [llama-server.service](llama-server.service)
- **Setup**:
  1. Copy to system: `sudo cp llama-server.service /etc/systemd/system/`
  2. Reload systemd: `sudo systemctl daemon-reload`
  3. Enable and Start: `sudo systemctl enable --now llama-server`
- **Check health**: `sudo systemctl status llama-server`

---

### 3. macOS (LaunchAgent)
Native way to run on a macOS host.

- **File**: `~/Library/LaunchAgents/local.llama.server.plist`
- **Setup**:
  1. Load it: `launchctl load ~/Library/LaunchAgents/local.llama.server.plist`
  2. Start it: `launchctl start local.llama.server`
- **Check health**: `launchctl list | grep llama`

---

### 4. Simple Script (Manual)
For quick testing without system integration.

- **Script**: [start.sh](start.sh)
- **Run**: `./start.sh`
- **Note**: Uses `nohup` to prevent termination when your SSH session closes, but will NOT restart after a VM reboot.
