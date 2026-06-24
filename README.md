# mac-death-monitor 💀

just a weekend project to see how much my mac suffers when I open 100 chrome tabs and docker at the same time. it tracks ram, swap, cpu, and disk space. when it hits critical limits, the UI turns red and complains.

## what's inside
there are two versions in this repo:

### 1. the web version
a simple node.js backend that pulls system info and serves a dashboard. 
how to run:
```bash
npm install
npm start
```
then go to `http://localhost:3000`.

### 2. the native mac app (swiftui)
inside the `NativeApp` folder, there's a native swiftui version if you prefer it running outside the browser. it uses standard mac kernel calls to get stats.
how to build:
```bash
cd NativeApp
./build.sh
```
then just open the `MacDeathMonitor.app`.

## disclaimer / warning
the "emergency optimize" button runs `sudo purge` and the temp sensor uses `sudo powermetrics`. if you don't wanna type your password every time, you gotta bypass sudo for those commands in `/etc/sudoers.d/`.

do it at your own risk lol.

## license
mit.
