/* ============================================
   SCRIPT.JS — ADITYA OSINT
   API: http://69.62.84.105:7000/api/search?num=
   Using CORS proxy: https://api.allorigins.win/raw?url=
   ============================================ */

// ===== MATRIX BACKGROUND =====
(function initMatrix() {
    const matrixBg = document.getElementById('matrixBg');
    const chars = "01010101010101010101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

    // columns
    const colCount = Math.floor(window.innerWidth / 20);
    for (let i = 0; i < colCount; i++) {
        const col = document.createElement('div');
        col.classList.add('matrix-column');
        col.style.left = `${(i / colCount) * 100}%`;
        const duration = 15 + Math.random() * 20;
        const delay = Math.random() * 5;
        col.style.animationDuration = `${duration}s`;
        col.style.animationDelay = `${delay}s`;

        const charCount = 20 + Math.floor(Math.random() * 20);
        for (let j = 0; j < charCount; j++) {
            const el = document.createElement('div');
            el.classList.add('matrix-char');
            el.textContent = chars[Math.floor(Math.random() * chars.length)];
            el.style.animationDelay = `${Math.random() * 2}s`;
            col.appendChild(el);
        }
        matrixBg.appendChild(col);
    }

    // particles
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        const size = Math.random() * 6 + 3;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = Math.random() * 5 + 4 + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(p);
    }

    // matrix lines
    for (let i = 0; i < 30; i++) {
        const line = document.createElement('div');
        line.classList.add('matrix-line');
        line.style.left = Math.random() * 100 + 'vw';
        line.style.height = Math.random() * 80 + 40 + 'px';
        line.style.animationDuration = Math.random() * 3 + 3 + 's';
        line.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(line);
    }
})();

// ===== LOOKUP FUNCTION (with CORS proxy) =====
async function lookup() {
    const input = document.getElementById('mobile');
    const term = input.value.trim();

    if (!term || !/^\d{10}$/.test(term)) {
        alert('Please enter a valid 10-digit number');
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Scanning databases for information...</p>
        </div>
    `;

    // ---- ORIGINAL API (blocked by CORS) ----
    // const url = `http://69.62.84.105:7000/api/search?num=${term}`;

    // ---- PROXY FIX ----
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const targetUrl = `http://69.62.84.105:7000/api/search?num=${term}`;
    const url = proxyUrl + encodeURIComponent(targetUrl);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            // If the proxy returns a non-200, the API might be down or the proxy failed
            throw new Error(`HTTP ${res.status} – ${res.statusText}`);
        }
        const data = await res.json();

        resultDiv.innerHTML = `
            <div class="result-header">
                <h3 class="result-title">
                    <span>📱</span> Lookup Results for ${term}
                </h3>
                <div class="result-actions">
                    <button onclick="exportData()">📥 Export</button>
                    <button onclick="clearResults()">🗑️ Clear</button>
                </div>
            </div>
            <div class="result-content">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    } catch (err) {
        console.error('Lookup error:', err);
        resultDiv.innerHTML = `
            <div class="result-header">
                <h3 class="result-title">⚠️ Error</h3>
                <div class="result-actions">
                    <button onclick="clearResults()">🗑️ Clear</button>
                </div>
            </div>
            <div class="result-content">
                <p style="color: var(--error);">
                    <strong>Failed to fetch data.</strong><br />
                    ${err.message || 'Please try again later.'}
                </p>
                <p style="color: var(--text-secondary); margin-top: 10px; font-size: 0.9rem;">
                    If the issue persists, the API server might be unreachable or the proxy is temporarily down.
                </p>
            </div>
        `;
    }
}

// ===== EXPORT =====
function exportData() {
    const resultDiv = document.getElementById('result');
    const pre = resultDiv.querySelector('pre');
    if (!pre) return;

    const data = pre.textContent;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-lookup-${document.getElementById('mobile').value}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== CLEAR =====
function clearResults() {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    document.getElementById('mobile').value = '';
}

// ===== ENTER KEY =====
document.getElementById('mobile').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') lookup();
});