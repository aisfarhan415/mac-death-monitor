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
    document.getElementById('badge-ram').innerText = `${ramPct}%`;
    document.getElementById('val-threads').innerText = Math.floor(ramPct * 8.5); // fake metric for aesthetic
    
    const cardRam = document.getElementById('card-ram');
    cardRam.className = 'card metric-card';
    if (ramPct > 90) cardRam.classList.add('danger-glow');
    else if (ramPct > 75) cardRam.classList.add('warning-glow');

    // Swap
    const swapUsedGB = formatGB(data.memory.swapUsed);
    const swapTotalGB = formatGB(data.memory.swapTotal);
    document.getElementById('val-swap').innerText = `${swapUsedGB} GB`;
    document.getElementById('val-swap-total').innerText = `${swapTotalGB} GB`;
    const swapWarning = document.getElementById('swap-warning');
    const badgeSwap = document.getElementById('badge-swap');
    
    // Fake percentage for Swap
    const swapPct = data.memory.swapTotal > 0 ? Math.round((data.memory.swapUsed / data.memory.swapTotal) * 100) : 0;
    badgeSwap.innerText = `${swapPct}%`;

    const cardSwap = document.getElementById('card-swap');
    cardSwap.className = 'card metric-card';
    if (data.memory.swapUsed > 1024 * 1024 * 1024) { // > 1GB
        cardSwap.classList.add('danger-glow');
        swapWarning.innerText = "SSD IS CRYING 😭";
        document.querySelector('.gauge-arc').style.borderColor = "var(--neon-red)";
        document.querySelector('.gauge-needle').style.transform = `rotate(120deg)`;
    } else if (data.memory.swapUsed > 0) {
        cardSwap.classList.add('warning-glow');
        swapWarning.innerText = "SWAPPING...";
        document.querySelector('.gauge-arc').style.borderColor = "var(--neon-orange)";
        document.querySelector('.gauge-needle').style.transform = `rotate(${45 + (swapPct/100 * 90)}deg)`;
    } else {
        swapWarning.innerText = "";
        document.querySelector('.gauge-arc').style.borderColor = "#333";
        document.querySelector('.gauge-needle').style.transform = `rotate(-45deg)`;
    }

    // CPU
    document.getElementById('val-cpu').innerText = `${Math.round(data.cpu.load)}%`;
    const btnTemp = document.getElementById('btn-temp');
    if (data.cpu.temp > 0) {
        document.getElementById('val-temp').innerText = `${data.cpu.temp}°C`;
        if (btnTemp) btnTemp.style.display = 'none';
    } else {
        document.getElementById('val-temp').innerText = "N/A";
        if (btnTemp) btnTemp.style.display = 'block';
    }
    
    const cardCpu = document.getElementById('card-cpu');
    cardCpu.className = 'card metric-card';
    if (data.cpu.load > 85) cardCpu.classList.add('danger-glow');
    else if (data.cpu.load > 60) cardCpu.classList.add('warning-glow');

    // Disk
    document.getElementById('val-disk-gb').innerText = `${formatGB(data.disk.used)} / ${formatGB(data.disk.size)} GB`;
    document.getElementById('val-disk-free').innerText = formatGB(data.disk.size - data.disk.used) + ' GB';
    document.getElementById('badge-disk').innerText = `${Math.round(data.disk.use)}%`;
    document.getElementById('disk-fill').style.width = `${Math.round(data.disk.use)}%`;
    
    const cardDisk = document.getElementById('card-disk');
    const diskStatus = document.getElementById('disk-status');
    cardDisk.className = 'card metric-card';
    if (data.disk.use > 90) {
        cardDisk.classList.add('danger-glow');
        diskStatus.innerText = "CRITICAL";
        diskStatus.style.background = "var(--neon-red)";
        diskStatus.style.color = "#fff";
    } else if (data.disk.use > 80) {
        cardDisk.classList.add('warning-glow');
        diskStatus.innerText = "WARNING";
        diskStatus.style.background = "var(--neon-orange)";
        diskStatus.style.color = "#000";
    } else {
        diskStatus.innerText = "OK";
        diskStatus.style.background = "#333";
        diskStatus.style.color = "#fff";
    }

    // Health / Death Score
    const score = data.deathScore;
    const healthFill = document.getElementById('health-fill');
    const healthPctLabel = document.getElementById('health-pct');
    const globalStatusText = document.getElementById('global-status-text');
    const tickerText = document.getElementById('ticker-text');
    const cardHealth = document.getElementById('card-health');

    // Invert score for health bar (100 death score = 0 health)
    // Wait, the progress bar should represent Death/Stress level. Let's make it represent Stress.
    // 100% stress = bar full = red.
    healthFill.style.width = `${score}%`;
    healthPctLabel.innerText = `${score}%`;

    if (score > 80) {
        globalStatusText.innerText = "CRITICAL";
        document.getElementById('global-status-pill').style.color = "var(--neon-red)";
        document.getElementById('global-status-pill').style.borderColor = "var(--neon-red)";
        tickerText.innerText = "OVERLOAD WARNING: Immediate Action Required";
        cardHealth.classList.add('danger-glow');
    } else if (score > 50) {
        globalStatusText.innerText = "STRUGGLING";
        document.getElementById('global-status-pill').style.color = "var(--neon-orange)";
        document.getElementById('global-status-pill').style.borderColor = "var(--neon-orange)";
        tickerText.innerText = "SYSTEM ALERT: High resource consumption detected";
        cardHealth.className = 'card wide-card warning-glow';
    } else {
        globalStatusText.innerText = "STABLE";
        document.getElementById('global-status-pill').style.color = "var(--text-main)";
        document.getElementById('global-status-pill').style.borderColor = "#333";
        tickerText.innerText = "System operating within normal parameters.";
        cardHealth.className = 'card wide-card';
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
                btnTemp.innerText = '✅ ENABLED';
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
