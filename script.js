/* ============================================
   SCRIPT.JS — ADITYA OSINT
   Multi‑proxy fallback, smart JSON parsing
   ============================================ */

// ===== MATRIX BACKGROUND =====
(function initMatrix() {
    const matrixBg = document.getElementById('matrixBg');
    const chars = "01010101010101010101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

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

// ===== PROXY LIST (expanded & shuffled for reliability) =====
const PROXIES = [
    'https://api.allorigins.win/raw?url=',        // reliable, raw response
    'https://corsproxy.io/?',                      // simple and fast
    'https://cors-anywhere.herokuapp.com/',        // may require origin header, but usually works
    'https://thingproxy.freeboard.io/fetch/',      // another free proxy
    'https://proxy.cors.sh/',                      // also reliable (sometimes)
    'https://cors.bridged.cc/'                     // less common but works
];

// ===== FETCH WITH PROXY FALLBACK =====
async function fetchWithProxies(targetUrl) {
    // Shuffle proxies so we don't always hit the same one first
    const shuffled = [...PROXIES].sort(() => Math.random() - 0.5);

    let lastError = null;

    for (const proxyBase of shuffled) {
        const proxyUrl = proxyBase + encodeURIComponent(targetUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per proxy

        try {
            const res = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status} – ${res.statusText}`);
            }

            // Read the raw text first
            const text = await res.text();

            // Try to parse as JSON – if it fails, the API might have returned plain text error
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                // If the response isn't JSON, it could be an error page or plain text
                throw new Error(`Proxy returned non‑JSON: ${text.slice(0, 100)}${text.length > 100 ? '…' : ''}`);
            }

            // If the parsed object has an "error" field, treat it as an error
            if (data && typeof data === 'object' && data.error) {
                throw new Error(data.error);
            }

            // All good
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            console.warn(`Proxy ${proxyBase} failed:`, err.message);
            lastError = err;
            // Continue to next proxy
        }
    }

    // If we get here, all proxies failed
    throw new Error(lastError ? lastError.message : 'All CORS proxies failed. Please check your network or try again later.');
}

// ===== LOOKUP FUNCTION =====
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

    const targetApi = `http://69.62.84.105:7000/api/search?num=${term}`;

    try {
        const data = await fetchWithProxies(targetApi);

        // Success: display the result
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
        // Show a user‑friendly error with a retry hint
        resultDiv.innerHTML = `
            <div class="result-header">
                <h3 class="result-title">⚠️ Request Failed</h3>
                <div class="result-actions">
                    <button onclick="clearResults()">🗑️ Clear</button>
                </div>
            </div>
            <div class="result-content">
                <p style="color: var(--error);">
                    <strong>Could not fetch data.</strong><br />
                    ${err.message || 'Unknown error.'}
                </p>
                <p style="color: var(--text-secondary); margin-top: 10px; font-size: 0.9rem;">
                    Suggestions:<br />
                    • Double‑check the number and try again.<br />
                    • The API server might be temporarily offline.<br />
                    • If you’re behind a strict firewall, try using a VPN.<br />
                    <button onclick="lookup()" style="margin-top: 12px; padding: 8px 20px; background: var(--primary-dark); color: #fff; border: none; border-radius: 8px; cursor: pointer;">🔄 Retry</button>
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
    // For each base, create 8 variations with different cache-busting parameters
    for (const base of baseTemplates) {
        // Add the base itself
        proxyList.push(base);

        // Add variations: append a random query param to bypass caches
        for (let i = 1; i <= 7; i++) {
            const variant = base + (base.includes('?') ? '&' : '?') + `_cb=${seed + i}`;
            proxyList.push(variant);
        }
    }

    // Also add some known public proxies with different subdomains (if they exist)
    const extraDomains = [
        'cors-anywhere',
        'cors-proxy',
        'corsproxy',
        'proxy.cors',
        'cors.bridged',
        'corsproxy.co',
        'cors.deno',
        'cors.5apps',
        'cors.ceda',
    ];
    const tlds = ['.com', '.org', '.io', '.net', '.win', '.co', '.dev', '.app'];
    for (const domain of extraDomains) {
        for (const tld of tlds) {
            // Add with and without 'www.'
            proxyList.push(`https://${domain}${tld}/`);
            proxyList.push(`https://www.${domain}${tld}/`);
            // Some might use /fetch/ or /?url=
            proxyList.push(`https://${domain}${tld}/fetch/`);
            proxyList.push(`https://${domain}${tld}/?url=`);
        }
    }

    // Finally, add some numbered subdomains for popular services
    for (let i = 1; i <= 30; i++) {
        proxyList.push(`https://cors-anywhere-${i}.herokuapp.com/`);
        proxyList.push(`https://cors-proxy-${i}.herokuapp.com/`);
        proxyList.push(`https://cors-${i}.herokuapp.com/`);
    }

    // Remove duplicates and limit to ~350
    const unique = [...new Set(proxyList)];
    // Shuffle to distribute load
    for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, 350);
}

// ============================================================
//   FETCH WITH BATCHED PARALLEL PROXY RETRY
// ============================================================

async function fetchWithProxies(targetUrl) {
    const proxyPool = generateProxyPool();
    const BATCH_SIZE = 5;        // try 5 proxies at once
    const TIMEOUT_MS = 6000;     // 6 seconds per proxy

    for (let i = 0; i < proxyPool.length; i += BATCH_SIZE) {
        const batch = proxyPool.slice(i, i + BATCH_SIZE);
        const fetchPromises = batch.map(proxyBase => {
            const proxyUrl = proxyBase + encodeURIComponent(targetUrl);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            return fetch(proxyUrl, { signal: controller.signal })
                .then(res => {
                    clearTimeout(timeoutId);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                })
                .then(text => {
                    // Try to parse JSON
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error('Invalid JSON');
                    }
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    throw err;
                });
        });

        // Wait for the first successful response in this batch
        try {
            const data = await Promise.any(fetchPromises);
            return data; // success
        } catch (aggregateError) {
            // All promises in this batch failed – move to next batch
            console.warn(`Batch ${i / BATCH_SIZE + 1} failed, trying next...`);
        }
    }

    // If we get here, all proxies failed
    throw new Error('All available proxies failed. Please try again later.');
}

// ============================================================
//   LOOKUP FUNCTION
// ============================================================

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
            <p>Scanning databases via 300+ proxies...</p>
        </div>
    `;

    const targetApi = `http://69.62.84.105:7000/api/search?num=${term}`;

    try {
        const data = await fetchWithProxies(targetApi);

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
                    All 350+ proxy endpoints were exhausted. The API server may be down, or your network is blocking the requests.
                </p>
            </div>
        `;
    }
}

// ============================================================
//   EXPORT & CLEAR
// ============================================================

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

function clearResults() {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    document.getElementById('mobile').value = '';
}

// ============================================================
//   ENTER KEY
// ============================================================

document.getElementById('mobile').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') lookup();
});        console.error('Lookup error:', err);
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
