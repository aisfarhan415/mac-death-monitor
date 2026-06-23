import express from 'express';
import si from 'systeminformation';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', async (req, res) => {
    try {
        const mem = await si.mem();
        const currentLoad = await si.currentLoad();
        const cpuTemp = await si.cpuTemperature();
        const fsSize = await si.fsSize();
        let cpuTempVal = cpuTemp.main || 0;
        
        // Try to read Apple Silicon temp from daemon if it exists
        if (fs.existsSync('/tmp/mactemp.txt')) {
            try {
                const tempContent = fs.readFileSync('/tmp/mactemp.txt', 'utf8');
                // Extract temperature value (e.g. "CPU die temperature: 45.20 C" -> 45.20)
                const match = tempContent.match(/[\d.]+/);
                if (match) {
                    cpuTempVal = parseFloat(match[0]);
                }
            } catch (e) {
                // Ignore read errors
            }
        }

        // Calculate a basic "Death Score" (0-100)
        // High RAM usage, high Swap usage, high CPU load, high Temp, low Disk Space contribute to death
        const memoryScore = ((mem.active / mem.total) * 100) * 0.4;
        const swapScore = mem.swapused > 0 ? ((mem.swapused / (mem.swaptotal || 1)) * 100) * 0.3 : 0;
        const cpuScore = currentLoad.currentLoad * 0.2;
        
        let rootFs = fsSize.find(fs => fs.mount === '/');
        if (!rootFs && fsSize.length > 0) rootFs = fsSize[0];
        const diskScore = rootFs ? (rootFs.use * 0.1) : 0;

        let deathScore = Math.min(100, Math.round(memoryScore + swapScore + cpuScore + diskScore));
        
        // Artificial boost if we're swapping heavily
        if (mem.swapused > (1024 * 1024 * 1024)) { // 1GB+ swap
            deathScore += 10;
        }

        res.json({
            status: 'success',
            data: {
                memory: {
                    total: mem.total,
                    used: mem.active,
                    free: mem.free,
                    swapUsed: mem.swapused,
                    swapTotal: mem.swaptotal
                },
                cpu: {
                    load: currentLoad.currentLoad.toFixed(2),
                    temp: cpuTempVal
                },
                disk: {
                    use: rootFs ? rootFs.use.toFixed(2) : 0,
                    size: rootFs ? rootFs.size : 0,
                    used: rootFs ? rootFs.used : 0
                },
                deathScore: Math.min(100, deathScore)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/optimize', (req, res) => {
    // Run purge using AppleScript so it prompts the user for Touch ID / Password natively
    exec('osascript -e \'do shell script "purge" with administrator privileges\'', (error, stdout, stderr) => {
        if (error) {
            console.error(`Purge error: ${error.message}`);
            return res.status(500).json({ status: 'error', message: 'Failed to optimize' });
        }
        res.json({ status: 'success', message: 'Memory purged and optimized!' });
    });
});

app.post('/api/enable-temp', (req, res) => {
    const script = `
        if pgrep -x "powermetrics" > /dev/null; then
            exit 0
        else
            nohup powermetrics --samplers smc | awk '/CPU die temperature/ {print \\$0 > \\"/tmp/mactemp.txt\\"; fflush()}' > /dev/null 2>&1 &
        fi
    `;
    exec(`osascript -e 'do shell script "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}" with administrator privileges'`, (error) => {
        if (error) {
            console.error(`Enable Temp error: ${error.message}`);
            return res.status(500).json({ status: 'error', message: 'Failed to enable temp sensor' });
        }
        res.json({ status: 'success', message: 'Temp sensor enabled!' });
    });
});

app.listen(PORT, () => {
    console.log(`☠️ MacBook Death Monitor running on http://localhost:${PORT}`);
});
