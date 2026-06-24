# MacBook Death Monitor ☠️💻

A highly premium, cinematic, hacker-style dashboard to monitor your MacBook's pain in real-time. Designed specifically to visualize intense system stress (RAM overloads, Swap memory spikes, and CPU bottlenecking) with an aggressive, glowing UI.

## Features 🔥

- **Cinematic Glassmorphism UI:** Built with an obsidian black theme, glowing neon accents, and smooth blur effects.
- **The Death Score:** A custom algorithm that calculates your Mac's suffering level based on CPU load, Swap usage, and Disk space.
- **Emergency Optimize:** A one-click panic button that bypasses system prompts to execute a root-level `purge` command, instantly freeing up dirty RAM.
- **Thermal Radar:** Reads the hidden CPU die temperature sensors natively on M-Series Macs using `powermetrics`.

## Two Flavors Available

This project comes in two versions depending on your preference:

### 1. Web Dashboard (Node.js + Vanilla JS)
A lightweight web server that exposes system metrics via an API and serves a beautifully styled web frontend.
- **Tech Stack:** Node.js, Express, `systeminformation`, HTML/CSS/JS.
- **How to run:**
  ```bash
  npm install
  npm start
  ```
- **Access:** Open `http://localhost:3000` in your browser.

### 2. Native macOS App (SwiftUI)
A 100% native Apple application built with Swift and SwiftUI. It uses `NSVisualEffectView` for true system-level glassmorphism and executes kernel metrics natively.
- **Tech Stack:** Swift, SwiftUI, AppKit, Darwin/Foundation.
- **How to build:** Run the included `build.sh` script to compile the standalone `.app` bundle natively.

## Security Warning ⚠️
The "Emergency Optimize" and "Thermal Sensor" features execute `sudo purge` and `sudo powermetrics` under the hood. For the seamless 1-click experience, this repository assumes you have added a `NOPASSWD` rule for these commands in your `/etc/sudoers.d/` configuration. 

**Use at your own risk.**

## License
MIT License. Do whatever you want with it, but don't blame me if your Mac actually dies! 🤣
