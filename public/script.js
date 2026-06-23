const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatGB = (bytes) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
};

const updateUI = (data) => {
    // RAM
    const ramTotalGB = formatGB(data.memory.total);
    const ramUsedGB = formatGB(data.memory.used);
    const ramPct = Math.round((data.memory.used / data.memory.total) * 100);
    
    document.getElementById('val-ram').innerText = `${ramUsedGB} / ${ramTotalGB} GB`;
    document.getElementById('val-ram-pct').innerText = `${ramPct}% Used`;
    
    const cardRam = document.getElementById('card-ram');
    cardRam.className = 'card';
    if (ramPct > 90) cardRam.classList.add('status-danger');
    else if (ramPct > 75) cardRam.classList.add('status-warning');

    // Swap
    const swapUsedGB = formatGB(data.memory.swapUsed);
    document.getElementById('val-swap').innerText = `${swapUsedGB} GB`;
    const swapWarning = document.getElementById('swap-warning');
    
    const cardSwap = document.getElementById('card-swap');
    cardSwap.className = 'card';
    if (data.memory.swapUsed > 1024 * 1024 * 1024) { // > 1GB
        cardSwap.classList.add('status-danger');
        swapWarning.innerText = "SSD IS CRYING 😭";
    } else if (data.memory.swapUsed > 0) {
        cardSwap.classList.add('status-warning');
        swapWarning.innerText = "Swapping to SSD...";
    } else {
        swapWarning.innerText = "Safe (No swap)";
        swapWarning.style.color = "var(--accent-green)";
    }

    // CPU
    document.getElementById('val-cpu').innerText = `${data.cpu.load}%`;
    const btnTemp = document.getElementById('btn-temp');
    if (data.cpu.temp > 0) {
        document.getElementById('val-temp').innerText = `${data.cpu.temp}°C`;
        if (btnTemp) btnTemp.style.display = 'none';
    } else {
        document.getElementById('val-temp').innerText = "Temp sensor N/A";
        if (btnTemp) btnTemp.style.display = 'block';
    }
    
    const cardCpu = document.getElementById('card-cpu');
    cardCpu.className = 'card';
    if (data.cpu.load > 85) cardCpu.classList.add('status-danger');
    else if (data.cpu.load > 60) cardCpu.classList.add('status-warning');

    // Disk
    document.getElementById('val-disk').innerText = `${data.disk.use}%`;
    document.getElementById('val-disk-gb').innerText = `${formatGB(data.disk.used)} GB Used`;
    
    const cardDisk = document.getElementById('card-disk');
    cardDisk.className = 'card';
    if (data.disk.use > 90) cardDisk.classList.add('status-danger');
    else if (data.disk.use > 80) cardDisk.classList.add('status-warning');

    // Health / Death Score
    const score = data.deathScore;
    const healthFill = document.getElementById('health-fill');
    const healthText = document.getElementById('health-text');
    const overlay = document.getElementById('danger-overlay');

    // Invert score for health bar (100 death score = 0 health)
    const healthPct = Math.max(0, 100 - score);
    healthFill.style.width = `${healthPct}%`;

    if (score > 80) {
        healthText.innerText = "CRITICAL (DYING)";
        healthText.className = "health-text critical";
        overlay.className = "overlay danger";
    } else if (score > 50) {
        healthText.innerText = "STRUGGLING";
        healthText.className = "health-text status-warning";
        overlay.className = "overlay";
    } else {
        healthText.innerText = "HEALTHY & CHILL";
        healthText.className = "health-text status-good";
        overlay.className = "overlay";
    }
};

const fetchStats = async () => {
    try {
        const response = await fetch('/api/stats');
        const json = await response.json();
        if (json.status === 'success') {
            updateUI(json.data);
        }
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
};

document.getElementById('btn-optimize').addEventListener('click', async () => {
    const btn = document.getElementById('btn-optimize');
    btn.innerText = '⚙️ OPTIMIZING...';
    btn.style.pointerEvents = 'none';
    
    try {
        const response = await fetch('/api/optimize', { method: 'POST' });
        const result = await response.json();
        if (result.status === 'success') {
            btn.innerText = '✅ PURGED!';
            setTimeout(() => {
                btn.innerText = '🛠️ EMERGENCY OPTIMIZE';
                btn.style.pointerEvents = 'auto';
            }, 3000);
        } else {
            btn.innerText = '❌ FAILED';
            setTimeout(() => {
                btn.innerText = '🛠️ EMERGENCY OPTIMIZE';
                btn.style.pointerEvents = 'auto';
            }, 3000);
        }
    } catch (error) {
        btn.innerText = '❌ ERROR';
        setTimeout(() => {
            btn.innerText = '🛠️ EMERGENCY OPTIMIZE';
            btn.style.pointerEvents = 'auto';
        }, 3000);
    }
});

const btnTemp = document.getElementById('btn-temp');
if (btnTemp) {
    btnTemp.addEventListener('click', async () => {
        btnTemp.innerText = '⚙️ ACTIVATING...';
        btnTemp.style.pointerEvents = 'none';
        try {
            const response = await fetch('/api/enable-temp', { method: 'POST' });
            const result = await response.json();
            if (result.status === 'success') {
                btnTemp.innerText = '✅ SENSOR ENABLED';
            } else {
                btnTemp.innerText = '❌ FAILED';
            }
        } catch (error) {
            btnTemp.innerText = '❌ ERROR';
        }
    });
}

// Fetch every second
setInterval(fetchStats, 1000);
fetchStats();
