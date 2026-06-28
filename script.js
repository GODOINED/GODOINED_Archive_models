// ============================================================
//  ЗАГРУЗОЧНЫЙ ЭКРАН (ТЕРМИНАЛ С ПРОПУСКОМ)
// ============================================================


(function initTerminal() {
    const screen = document.getElementById('loading-screen');
    const output = document.getElementById('terminal-output');
    const statusElem = document.getElementById('terminal-status');

    const lines = [
        '> INITIALIZING SYSTEM...',
        '> LOADING KERNEL... [OK]',
        '> MOUNTING FILESYSTEM... [OK]',
        '> STARTING SERVICES...',
        '>   - NETWORK SERVICE... [OK]',
        '>   - DISPLAY SERVICE... [OK]',
        '>   - AUDIO SERVICE... [OK]',
        '> LOADING MODULES...',
        '>   - MODEL ARCHIVE... [OK]',
        '>   - SEARCH ENGINE... [OK]',
        '>   - THEME MANAGER... [OK]',
        '> SYSTEM READY.',
        '> ВВЕДИТЕ КОМАНДУ: _'
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let typeTimer = null;
    let statusMessages = [
        '>> ИНИЦИАЛИЗАЦИЯ...',
        '>> ЗАГРУЗКА МОДУЛЕЙ...',
        '>> ПРОВЕРКА СИСТЕМ...',
        '>> КАЛИБРОВКА ДИСПЛЕЯ...',
        '>> УСТАНОВКА СВЯЗИ...',
        '>> СИСТЕМА ГОТОВА!'
    ];

    let isTerminalFinished = false;
    let fanBuffer = null;
    let fanSource = null;
    let fanGainNode = null;
    let fanAudioCtx = null;
    let fanStarted = false;

    function initFanSound() {
        if (fanStarted) return;
        try {
            fanAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            fetch('sounds/ui_hacking_fanhum_lp.wav')
                .then(res => res.arrayBuffer())
                .then(buffer => fanAudioCtx.decodeAudioData(buffer))
                .then(decoded => {
                    fanBuffer = decoded;
                    playFanLoop();
                })
                .catch(() => {});
            fanStarted = true;
        } catch(e) {}
    }

    function playFanLoop() {
        if (!fanBuffer || !fanAudioCtx) return;
        fanSource = fanAudioCtx.createBufferSource();
        fanSource.buffer = fanBuffer;
        fanSource.loop = true;
        fanGainNode = fanAudioCtx.createGain();
        fanGainNode.gain.value = 0.08;
        fanSource.connect(fanGainNode);
        fanGainNode.connect(fanAudioCtx.destination);
        fanSource.start();
    }

    function stopFanSound() {
        if (fanSource && fanGainNode) {
            const startGain = fanGainNode.gain.value;
            const fadeTime = 0.5;
            const startTime = fanAudioCtx.currentTime;
            fanGainNode.gain.setValueAtTime(startGain, startTime);
            fanGainNode.gain.exponentialRampToValueAtTime(0.001, startTime + fadeTime);
            setTimeout(() => {
                try {
                    fanSource.stop();
                    fanSource.disconnect();
                    fanGainNode.disconnect();
                    fanSource = null;
                    fanGainNode = null;
                } catch(e) {}
            }, fadeTime * 1000 + 100);
        }
    }

    function playCharSound() {
        try {
            const audio = new Audio('sounds/ui_hacking_charscroll.wav');
            audio.volume = 0.06;
            audio.play().catch(() => {});
        } catch(e) {}
    }

    function playLineSound() {
        try {
            const audio = new Audio('sounds/ui_hacking_charscroll_lp.wav');
            audio.volume = 0.05;
            audio.play().catch(() => {});
        } catch(e) {}
    }

    setTimeout(initFanSound, 300);

    function finishTerminal() {
        if (isTerminalFinished) return;
        isTerminalFinished = true;
        if (typeTimer) {
            clearTimeout(typeTimer);
            typeTimer = null;
        }
        stopFanSound();
        try {
            const audio = new Audio('sounds/ui_hacking_charscroll_lp.wav');
            audio.volume = 0.04;
            audio.play().catch(() => {});
        } catch(e) {}

        const outputContainer = document.getElementById('terminal-output');
        if (outputContainer) {
            outputContainer.innerHTML = '';
            const allLines = lines.slice(0, lineIndex + 1);
            allLines.forEach((line, idx) => {
                const span = document.createElement('span');
                span.className = 'line';
                span.style.animation = 'none';
                span.style.opacity = '1';
                if (idx === lines.length - 1 && line.includes('_')) {
                    span.innerHTML = line.replace('_', '') + '<span class="cursor-char">█</span>';
                } else {
                    span.textContent = line;
                }
                outputContainer.appendChild(span);
            });
            const statusElemLocal = document.getElementById('terminal-status');
            if (statusElemLocal) {
                statusElemLocal.innerHTML = '<span class="status-text">>> СИСТЕМА ГОТОВА!</span>';
            }
        }

        setTimeout(() => {
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.style.display = 'none';
                if (typeof initApp === 'function' && !window._appStarted) {
                    window._appStarted = true;
                    initApp();
                }
            }, 800);
        }, 500);
    }

    function handleSkip(e) {
        if (e.type === 'keydown') {
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') return;
        }
        if (!isTerminalFinished) {
            finishTerminal();
        }
    }

    document.addEventListener('keydown', handleSkip);
    document.addEventListener('click', handleSkip);
    document.addEventListener('touchstart', handleSkip);

    function typeLine() {
        if (isTerminalFinished) return;
        if (lineIndex >= lines.length) {
            finishTerminal();
            return;
        }
        const currentLine = lines[lineIndex];
        if (currentLine.includes('_') && charIndex >= currentLine.length - 1) {
            const lineWithoutUnderscore = currentLine.replace('_', '');
            const span = document.createElement('span');
            span.className = 'line';
            span.innerHTML = lineWithoutUnderscore + '<span class="cursor-char">█</span>';
            output.appendChild(span);
            updateStatus();
            lineIndex++;
            charIndex = 0;
            playLineSound();
            typeTimer = setTimeout(typeLine, 400);
            return;
        }
        if (charIndex === 0) {
            const span = document.createElement('span');
            span.className = 'line';
            span.dataset.line = lineIndex;
            output.appendChild(span);
            updateStatus();
            playLineSound();
        }
        const currentSpan = output.querySelector(`[data-line="${lineIndex}"]`);
        if (!currentSpan) return;
        const char = currentLine[charIndex];
        currentSpan.textContent += char;
        charIndex++;
        output.scrollTop = output.scrollHeight;
        if (charIndex < currentLine.length && char !== ' ') {
            playCharSound();
        }
        if (charIndex < currentLine.length) {
            typeTimer = setTimeout(typeLine, 25);
        } else {
            lineIndex++;
            charIndex = 0;
            typeTimer = setTimeout(typeLine, 100);
        }
    }

    function updateStatus() {
        const idx = Math.min(Math.floor(lineIndex / 2), statusMessages.length - 1);
        statusElem.innerHTML = `<span class="status-text">${statusMessages[idx]}</span>`;
    }

    typeTimer = setTimeout(typeLine, 500);
})();

// ============================================================
//  ОСНОВНАЯ ЛОГИКА
// ============================================================
let allModels = [];
let currentFilteredModels = [];
let currentSort = 'random';
let currentFilterTag = null;
let currentPage = 1;
const itemsPerPage = 12;
let audioCtx = null;
let soundsEnabled = true;
let currentModelName = null;
let animationInterval = null;
let currentLoadId = 0;

// Переменные для модалки рендеров
let modalMediaItems = [];
let modalCurrentIndex = 0;
let modalIsOpen = false;

// Переменные для плеера
let currentVideoElement = null;
let playerInterval = null;

(function ensureAudio() {
    function resumeAudio() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {}
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
    }
    document.addEventListener('click', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
})();

function initAudioContext() {
    if (audioCtx) return audioCtx;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    } catch(e) { soundsEnabled = false; return null; }
}

function playSound(freq, duration, type = 'square', volume = 0.12) {
    if (!soundsEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
        return;
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    osc.start();
    osc.stop(now + duration);
}

function playClickSound() { playSound(880, 0.08, 'square', 0.10); }
function playBackSound() { playSound(660, 0.1, 'sine', 0.08); }
function playShareSound() { playSound(1200, 0.06, 'square', 0.06); }

function playDownloadSound() {
    playSound(580, 0.12, 'square', 0.10);
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    const bufferSize = 512;
    const noise = ctx.createScriptProcessor(bufferSize, 1, 1);
    noise.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) out[i] = (Math.random() - 0.5) * 0.2;
    };
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);
    setTimeout(() => noise.disconnect(), 100);
}

function playHoverSound() { playSound(660, 0.08, 'sine', 0.05); }

function downloadWithEffect(downloadUrl) {
    const overlay = document.createElement('div');
    overlay.id = 'download-overlay';
    overlay.innerHTML = `
        <div class="download-vignette"></div>
        <div class="download-arrow">⬇</div>
        <div class="download-flash"></div>
    `;
    document.body.appendChild(overlay);
    const arrow = overlay.querySelector('.download-arrow');
    const flash = overlay.querySelector('.download-flash');
    const vignette = overlay.querySelector('.download-vignette');
    const style = getComputedStyle(document.body);
    const themeColor = style.getPropertyValue('--accent').trim() || '#3eff6e';
    arrow.style.animation = 'arrowFall 1.2s ease-in forwards';
    setTimeout(() => {
        flash.style.background = `radial-gradient(ellipse at center, transparent 30%, ${themeColor} 100%)`;
        flash.style.opacity = '0.7';
        flash.style.transition = 'opacity 0.1s';
        vignette.style.opacity = '1';
        vignette.style.transition = 'opacity 0.3s';
        setTimeout(() => { flash.style.opacity = '0'; }, 200);
    }, 600);
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 300);
    }, 1200);
    playDownloadSound();
}

async function fetchModels() {
    if (allModels.length) return allModels;
    try {
        const response = await fetch('models_list.json');
        if (!response.ok) throw new Error('Не удалось загрузить models_list.json');
        const data = await response.json();
        if (Array.isArray(data) && data.length) {
            allModels = data;
            return allModels;
        } else {
            throw new Error('Файл models_list.json пуст');
        }
    } catch(e) {
        console.error(e);
        const grid = document.getElementById('models-grid');
        if (grid) grid.innerHTML = `<div class="loading">❌ ОШИБКА ЗАГРУЗКИ</div>`;
        return [];
    }
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function sortModels(models, sortType) {
    const sorted = [...models];
    switch(sortType) {
        case 'random': return shuffleArray(sorted);
        case 'name-asc': return sorted.sort((a,b) => a.displayName.localeCompare(b.displayName));
        case 'name-desc': return sorted.sort((a,b) => b.displayName.localeCompare(a.displayName));
        default: return sorted;
    }
}

function getFilteredModels() {
    let result = [...allModels];
    if (currentFilterTag) {
        result = result.filter(m => (m.tags || []).some(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            return tagName === currentFilterTag;
        }));
    }
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const q = searchInput.value.trim().toLowerCase();
        if (q) {
            result = result.filter(m => m.displayName.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || (m.tags || []).some(t => {
                const tagName = typeof t === 'string' ? t : t.name;
                return tagName && tagName.toLowerCase().includes(q);
            }));
        }
    }
    return result;
}

function applyFilters() {
    currentFilteredModels = getFilteredModels();
    renderModelsGrid(currentFilteredModels);
}

function renderModelsGrid(models) {
    const grid = document.getElementById('models-grid');
    if (!grid) return;
    if (!models.length) {
        grid.innerHTML = '<div class="loading">НИЧЕГО НЕ НАЙДЕНО</div>';
        updatePaginationControls(0);
        return;
    }
    const sortedModels = sortModels(models, currentSort);
    const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = sortedModels.slice(start, end);
    grid.innerHTML = '';
    pageItems.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.addEventListener('click', () => {
            playClickSound();
            showModelDetail(model.name);
        });
        card.addEventListener('mouseenter', playHoverSound);
        card.addEventListener('mousemove', (e) => createParticles(e, card));
        let previewUrl = model.preview || `models/${model.name}/start_0.webp`;
        if (model.startFrames === 0 && model.idleFrames > 0) previewUrl = `models/${model.name}/idle_0.webp`;
        if (model.startFrames === 0 && model.idleFrames === 0) previewUrl = model.preview || `models/${model.name}/icon.webp`;
        const img = document.createElement('img');
        img.className = 'preview';
        img.src = previewUrl;
        img.alt = model.displayName;
        img.onerror = () => { img.src = 'https://placehold.co/400x400?text=NO+PREVIEW'; };
        const info = document.createElement('div');
        info.className = 'model-info';
        const tagsHtml = (model.tags || []).map(tag => {
            let tagName, tagColor;
            if (typeof tag === 'string') {
                tagName = tag;
                tagColor = null;
            } else {
                tagName = tag.name || '';
                tagColor = tag.color || null;
            }
            let colorStyle = '';
            let extraClass = '';
            if (tagColor === 'rainbow') {
                extraClass = 'rainbow-text';
            } else if (tagColor) {
                colorStyle = ` style="color: ${tagColor}; border-color: ${tagColor}; background: rgba(0,0,0,0.5);"`;
            }
            return `<span class="tag ${extraClass}"${colorStyle}>${escapeHtml(tagName)}</span>`;
        }).join('');
        const descHtml = parseBBCode(model.description).replace(/\n/g, '<br>');
        info.innerHTML = `<h3>${parseBBCode(model.displayName)}</h3><p>${descHtml}</p><div class="tags">${tagsHtml}</div>`;
        card.appendChild(img);
        card.appendChild(info);
        grid.appendChild(card);
    });
    document.getElementById('model-count').textContent = `Всего: ${models.length}`;
    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    if (!prevBtn || !nextBtn || !pageInfo) return;
    prevBtn.disabled = currentPage <= 1 || totalPages === 0;
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    pageInfo.textContent = totalPages > 0 ? `Страница ${currentPage} из ${totalPages}` : 'Нет моделей';
}

function setupPagination() {
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; applyFilters(); }
    });
    document.getElementById('next-page')?.addEventListener('click', () => {
        const total = Math.ceil(getFilteredModels().length / itemsPerPage);
        if (currentPage < total) { currentPage++; applyFilters(); }
    });
}

function getUniqueTags() {
    const tagSet = new Set();
    allModels.forEach(m => {
        (m.tags || []).forEach(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            if (tagName) tagSet.add(tagName);
        });
    });
    return [...tagSet].sort();
}

function renderTagFilters() {
    const container = document.getElementById('tag-filters');
    if (!container) return;
    const tags = getUniqueTags();
    let html = `<button class="tag-filter-btn all ${!currentFilterTag ? 'active' : ''}" data-tag="all">Все</button>`;
    tags.forEach(tag => {
        const active = currentFilterTag === tag ? 'active' : '';
        html += `<button class="tag-filter-btn ${active}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            const tag = btn.dataset.tag;
            currentFilterTag = tag === 'all' ? null : tag;
            currentPage = 1;
            container.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    if (!searchInput) return;
    const filter = () => {
        currentPage = 1;
        applyFilters();
    };
    searchInput.addEventListener('input', filter);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filter();
    });
}

function setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        applyFilters();
        playClickSound();
    });
}

function createParticles(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 4; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40 + 10;
        const size = Math.random() * 3 + 2;
        particle.style.left = (x + Math.cos(angle) * dist) + 'px';
        particle.style.top = (y + Math.sin(angle) * dist) + 'px';
        particle.style.position = 'absolute';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = `rgba(100, 255, 100, ${Math.random() * 0.8 + 0.2})`;
        particle.style.boxShadow = '0 0 2px #3eff6e';
        card.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

function parseBBCode(text) {
    if (!text) return '';
    let safe = escapeHtml(text);
    let changed = true;
    const maxIter = 50;
    let iter = 0;
    while (changed && iter < maxIter) {
        changed = false;
        iter++;
        let bMatch = /\[b\]([\s\S]*?)\[\/b\]/i.exec(safe);
        if (bMatch) {
            const content = bMatch[1];
            const replacement = `<strong>${parseBBCode(content)}</strong>`;
            safe = safe.substring(0, bMatch.index) + replacement + safe.substring(bMatch.index + bMatch[0].length);
            changed = true;
            continue;
        }
        let iMatch = /\[i\]([\s\S]*?)\[\/i\]/i.exec(safe);
        if (iMatch) {
            const content = iMatch[1];
            const replacement = `<em>${parseBBCode(content)}</em>`;
            safe = safe.substring(0, iMatch.index) + replacement + safe.substring(iMatch.index + iMatch[0].length);
            changed = true;
            continue;
        }
        let uMatch = /\[u\]([\s\S]*?)\[\/u\]/i.exec(safe);
        if (uMatch) {
            const content = uMatch[1];
            const replacement = `<u>${parseBBCode(content)}</u>`;
            safe = safe.substring(0, uMatch.index) + replacement + safe.substring(uMatch.index + uMatch[0].length);
            changed = true;
            continue;
        }
        let urlMatch = /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/i.exec(safe);
        if (urlMatch) {
            const href = urlMatch[1].trim();
            const content = urlMatch[2];
            const replacement = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="bbcode-link">${parseBBCode(content)}</a>`;
            safe = safe.substring(0, urlMatch.index) + replacement + safe.substring(urlMatch.index + urlMatch[0].length);
            changed = true;
            continue;
        }
        let urlSimple = /\[url\]([\s\S]*?)\[\/url\]/i.exec(safe);
        if (urlSimple) {
            const content = urlSimple[1].trim();
            let href = content;
            if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
            const replacement = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="bbcode-link">${parseBBCode(content)}</a>`;
            safe = safe.substring(0, urlSimple.index) + replacement + safe.substring(urlSimple.index + urlSimple[0].length);
            changed = true;
            continue;
        }
        let colorMatch = /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/i.exec(safe);
        if (colorMatch) {
            const color = colorMatch[1].trim();
            const content = colorMatch[2];
            const replacement = `<span style="color: ${color};">${parseBBCode(content)}</span>`;
            safe = safe.substring(0, colorMatch.index) + replacement + safe.substring(colorMatch.index + colorMatch[0].length);
            changed = true;
            continue;
        }
        let rainbowMatch = /\[rainbow\]([\s\S]*?)\[\/rainbow\]/i.exec(safe);
        if (rainbowMatch) {
            const content = rainbowMatch[1];
            const replacement = `<span class="rainbow-text">${parseBBCode(content)}</span>`;
            safe = safe.substring(0, rainbowMatch.index) + replacement + safe.substring(rainbowMatch.index + rainbowMatch[0].length);
            changed = true;
            continue;
        }
        let shakeMatch = /\[shake(?:=([\d.]+)(?:,([\d.]+))?)?\]([\s\S]*?)\[\/shake\]/i.exec(safe);
        if (shakeMatch) {
            const duration = shakeMatch[1] ? parseFloat(shakeMatch[1]) : 0.1;
            const distance = shakeMatch[2] ? parseFloat(shakeMatch[2]) : 1;
            const content = shakeMatch[3];
            const innerHtml = parseBBCode(content);
            let processed;
            if (innerHtml.includes('<') && innerHtml.includes('>')) {
                processed = `<span class="shake-letter" style="animation-duration: ${duration}s; --shake-distance: ${distance}px; display: inline-block;">${innerHtml}</span>`;
            } else {
                const chars = innerHtml.split('');
                let result = '';
                for (let i = 0; i < chars.length; i++) {
                    const ch = chars[i];
                    if (ch === ' ') { result += ' '; continue; }
                    const delay = (i * 0.03).toFixed(3);
                    result += `<span class="shake-letter" style="animation-duration: ${duration}s; --shake-distance: ${distance}px; animation-delay: ${delay}s;">${ch}</span>`;
                }
                processed = result;
            }
            safe = safe.substring(0, shakeMatch.index) + processed + safe.substring(shakeMatch.index + shakeMatch[0].length);
            changed = true;
            continue;
        }
    }
    return safe;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showGallery() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    playBackSound();
    const gallery = document.getElementById('gallery-container');
    const detail = document.getElementById('detail-container');
    const header = document.getElementById('main-header');
    if (detail.classList.contains('visible')) {
        detail.classList.remove('visible');
        detail.classList.add('closing');
        setTimeout(() => {
            detail.classList.remove('closing');
            gallery.classList.remove('hidden');
            header.classList.remove('hidden');
            document.body.style.overflow = '';
            window.scrollTo(0, 0);
        }, 400);
    } else {
        gallery.classList.remove('hidden');
        header.classList.remove('hidden');
        document.body.style.overflow = '';
        window.scrollTo(0, 0);
    }
    if (window.location.search.includes('model=')) {
        const url = new URL(window.location);
        url.searchParams.delete('model');
        window.history.pushState({}, '', url);
    }
    currentModelName = null;
    const canvas = document.getElementById('animation-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    document.title = 'Архив моделей';
    closeModal();
}

// ============================================================
//  МОДАЛЬНОЕ ОКНО ДЛЯ РЕНДЕРОВ (ИЗОБРАЖЕНИЯ + ВИДЕО)
// ============================================================
function openModal(mediaArray, startIndex = 0) {
    if (!mediaArray || mediaArray.length === 0) return;
    modalMediaItems = mediaArray;
    modalCurrentIndex = Math.max(0, Math.min(startIndex, mediaArray.length - 1));
    modalIsOpen = true;
    const modal = document.getElementById('render-modal');
    const wrapper = document.getElementById('modal-media-wrapper');
    const counter = document.getElementById('modal-counter');
    const prevBtn = document.getElementById('modal-prev');
    const nextBtn = document.getElementById('modal-next');

    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    renderModalMedia(modalCurrentIndex);
    counter.textContent = `${modalCurrentIndex + 1} / ${mediaArray.length}`;
    prevBtn.style.display = mediaArray.length > 1 ? 'block' : 'none';
    nextBtn.style.display = mediaArray.length > 1 ? 'block' : 'none';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('render-modal');
    if (!modal) return;
    modal.classList.remove('active');
    modalIsOpen = false;
    // Останавливаем видео и очищаем плеер
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement = null;
    }
    if (playerInterval) {
        clearInterval(playerInterval);
        playerInterval = null;
    }
    const playerContainer = document.getElementById('custom-player');
    if (playerContainer) playerContainer.style.display = 'none';
    
    setTimeout(() => {
        modal.style.display = 'none';
        const wrapper = document.getElementById('modal-media-wrapper');
        if (wrapper) wrapper.innerHTML = '';
        document.body.style.overflow = '';
    }, 300);
}

// ===== КАСТОМНЫЙ ПЛЕЕР =====
function initPlayer(video) {
    const playBtn = document.getElementById('player-play');
    const timeDisplay = document.getElementById('player-time');
    const progressFill = document.getElementById('player-progress-fill');
    const progressBar = document.getElementById('player-progress');
    const volumeSlider = document.getElementById('player-volume-slider');
    const volumeBtn = document.getElementById('player-volume-btn');

    if (!video || !playBtn) return;

    // Убираем старые обработчики, чтобы не было дублирования
    const newPlayBtn = playBtn.cloneNode(true);
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    const newVolumeBtn = volumeBtn.cloneNode(true);
    volumeBtn.parentNode.replaceChild(newVolumeBtn, volumeBtn);

    // Переназначаем переменные
    const newPlayBtnRef = document.getElementById('player-play');
    const newVolumeBtnRef = document.getElementById('player-volume-btn');

    // Функция обновления времени и прогресса
    function updateTime() {
        if (!video || video.duration === Infinity || isNaN(video.duration)) return;
        const current = video.currentTime || 0;
        const duration = video.duration || 0;
        const percent = duration ? (current / duration) * 100 : 0;
        progressFill.style.width = percent + '%';
        timeDisplay.textContent = formatTime(current) + ' / ' + formatTime(duration);
    }

    // События
    video.addEventListener('loadedmetadata', updateTime);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('ended', () => {
        newPlayBtnRef.textContent = '▶';
    });

    // Play/Pause
    newPlayBtnRef.addEventListener('click', () => {
        if (video.paused) {
            video.play().catch(() => {});
            newPlayBtnRef.textContent = '⏸';
        } else {
            video.pause();
            newPlayBtnRef.textContent = '▶';
        }
    });

    // Прогресс-бар
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        if (video.duration) {
            video.currentTime = x * video.duration;
        }
    });

    // Громкость (по умолчанию 0.5)
    video.volume = 0.5;
    volumeSlider.value = 0.5;
    newVolumeBtnRef.textContent = '🔊';

    volumeSlider.addEventListener('input', () => {
        const val = parseFloat(volumeSlider.value);
        video.volume = val;
        newVolumeBtnRef.textContent = val === 0 ? '🔇' : (val < 0.5 ? '🔉' : '🔊');
    });

    newVolumeBtnRef.addEventListener('click', () => {
        if (video.volume > 0) {
            video.volume = 0;
            volumeSlider.value = 0;
            newVolumeBtnRef.textContent = '🔇';
        } else {
            video.volume = 0.5;
            volumeSlider.value = 0.5;
            newVolumeBtnRef.textContent = '🔊';
        }
    });

    // Обновляем состояние кнопки play
    if (!video.paused) {
        newPlayBtnRef.textContent = '⏸';
    }
    video.addEventListener('pause', () => {
        newPlayBtnRef.textContent = '▶';
    });
    video.addEventListener('play', () => {
        newPlayBtnRef.textContent = '⏸';
    });

    // Сохраняем ссылку на видео
    currentVideoElement = video;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function renderModalMedia(index) {
    const wrapper = document.getElementById('modal-media-wrapper');
    const counter = document.getElementById('modal-counter');
    const playerContainer = document.getElementById('custom-player');
    if (!wrapper || !modalMediaItems.length) return;

    const item = modalMediaItems[index];
    wrapper.innerHTML = '';
    if (playerContainer) playerContainer.style.display = 'none';
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement = null;
    }
    if (playerInterval) {
        clearInterval(playerInterval);
        playerInterval = null;
    }

    if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.src;
        video.controls = false;
        video.autoplay = true;
        video.loop = false;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.border = '2px solid var(--border-color)';
        video.style.background = '#000';
        if (item.poster) {
            video.poster = item.poster;
        }
        video.volume = 0.5;
        wrapper.appendChild(video);
        currentVideoElement = video;
        if (playerContainer) {
            playerContainer.style.display = 'block';
            initPlayer(video);
        }
        video.play().catch(() => {});
    } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Рендер ${index + 1}`;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.border = '2px solid var(--border-color)';
        img.style.background = '#000';
        wrapper.appendChild(img);
    }
    if (counter) {
        counter.textContent = `${index + 1} / ${modalMediaItems.length}`;
    }
}

function navigateModal(direction) {
    if (!modalMediaItems.length) return;
    const newIndex = modalCurrentIndex + direction;
    if (newIndex < 0 || newIndex >= modalMediaItems.length) return;
    modalCurrentIndex = newIndex;
    renderModalMedia(modalCurrentIndex);
    const counter = document.getElementById('modal-counter');
    if (counter) {
        counter.textContent = `${modalCurrentIndex + 1} / ${modalMediaItems.length}`;
    }
    playClickSound();
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('render-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (!modalIsOpen) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') navigateModal(-1);
            if (e.key === 'ArrowRight') navigateModal(1);
        });
        document.getElementById('modal-close')?.addEventListener('click', closeModal);
        document.getElementById('modal-prev')?.addEventListener('click', () => navigateModal(-1));
        document.getElementById('modal-next')?.addEventListener('click', () => navigateModal(1));
    }
});

// ============================================================
//  ПОКАЗ ДЕТАЛЕЙ МОДЕЛИ
// ============================================================
function showModelDetail(modelName) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    const gallery = document.getElementById('gallery-container');
    const detail = document.getElementById('detail-container');
    const header = document.getElementById('main-header');
    const url = new URL(window.location);
    url.searchParams.set('model', modelName);
    window.history.pushState({ model: modelName }, '', url);
    document.title = `${modelName} — 3D модель`;

    const model = allModels.find(m => m.name === modelName);
    if (!model) return;

    document.getElementById('detail-title').textContent = model.displayName;
    document.getElementById('model-name').innerHTML = parseBBCode(model.displayName);
    document.getElementById('model-description').innerHTML = parseBBCode(model.description).replace(/\n/g, '<br>');
    const tagsHtml = (model.tags || []).map(tag => {
        let tagName, tagColor;
        if (typeof tag === 'string') {
            tagName = tag;
            tagColor = null;
        } else {
            tagName = tag.name || '';
            tagColor = tag.color || null;
        }
        let colorStyle = '';
        let extraClass = '';
        if (tagColor === 'rainbow') {
            extraClass = 'rainbow-text';
        } else if (tagColor) {
            colorStyle = ` style="color: ${tagColor}; border-color: ${tagColor}; background: rgba(0,0,0,0.5);"`;
        }
        return `<span class="tag ${extraClass}"${colorStyle}>${escapeHtml(tagName)}</span>`;
    }).join('');
    document.getElementById('model-tags').innerHTML = tagsHtml;

    const downloadBtn = document.getElementById('download-btn');
    if (model.downloadable && model.downloadFile) {
        downloadBtn.style.display = 'inline-block';
        downloadBtn.onclick = () => {
            const downloadUrl = `models/${model.name}/${model.downloadFile}`;
            downloadWithEffect(downloadUrl);
        };
    } else {
        downloadBtn.style.display = 'none';
    }

    const shareBtn = document.getElementById('share-btn');
    const shareMsg = document.getElementById('share-message');
    shareBtn.onclick = () => {
        playShareSound();
        navigator.clipboard.writeText(window.location.href);
        shareMsg.style.display = 'inline-block';
        setTimeout(() => shareMsg.style.display = 'none', 2000);
    };

    gallery.classList.add('hidden');
    header.classList.add('hidden');
    detail.classList.remove('closing');
    requestAnimationFrame(() => {
        detail.classList.add('visible');
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    });

    // ===== ГАЛЕРЕЯ РЕНДЕРОВ (только миниатюры) =====
    const renders = model.renders || [];
    const videos = model.videos || [];
    const renderGallery = document.getElementById('render-gallery');
    const renderThumbnails = document.getElementById('render-thumbnails');

    const allMedia = [];
    renders.forEach(src => {
        allMedia.push({ type: 'image', src: src });
    });
    videos.forEach(src => {
        allMedia.push({ type: 'video', src: src });
    });

    function openModalWithMedia(index) {
        if (allMedia.length === 0) return;
        openModal(allMedia, index);
    }

    if (renderGallery && renderThumbnails) {
        if (renders.length > 0 || videos.length > 0) {
            renderGallery.style.display = 'block';
            renderThumbnails.innerHTML = '';

            renders.forEach((url, index) => {
                const thumb = document.createElement('img');
                thumb.className = 'render-thumbnail';
                thumb.src = url;
                thumb.alt = `Рендер ${index + 1}`;
                thumb.loading = 'lazy';
                thumb.addEventListener('click', () => {
                    playClickSound();
                    openModalWithMedia(index);
                });
                thumb.addEventListener('error', () => {
                    thumb.style.display = 'none';
                });
                renderThumbnails.appendChild(thumb);
            });

            videos.forEach((url, vidIndex) => {
                const globalIndex = renders.length + vidIndex;
                const thumb = document.createElement('div');
                thumb.className = 'render-thumbnail video-thumbnail';
                thumb.style.position = 'relative';
                thumb.style.display = 'flex';
                thumb.style.alignItems = 'center';
                thumb.style.justifyContent = 'center';
                thumb.style.background = '#111';
                thumb.style.border = '2px solid var(--border-color)';
                thumb.style.cursor = 'pointer';
                thumb.style.overflow = 'hidden';
                thumb.style.aspectRatio = '1/1';

                const icon = document.createElement('span');
                icon.textContent = '▶';
                icon.style.fontSize = '24px';
                icon.style.color = 'var(--accent)';
                icon.style.textShadow = '0 0 20px var(--accent)';
                icon.style.position = 'absolute';
                icon.style.zIndex = '2';
                thumb.appendChild(icon);

                const posterUrl = url.replace(/\.(mp4|webm|mov)$/i, '.webp');
                const posterImg = document.createElement('img');
                posterImg.src = posterUrl;
                posterImg.alt = `Видео ${vidIndex + 1}`;
                posterImg.style.width = '100%';
                posterImg.style.height = '100%';
                posterImg.style.objectFit = 'cover';
                posterImg.style.opacity = '0.6';
                posterImg.onerror = () => { posterImg.style.display = 'none'; };
                thumb.appendChild(posterImg);

                thumb.addEventListener('click', () => {
                    playClickSound();
                    openModalWithMedia(globalIndex);
                });
                renderThumbnails.appendChild(thumb);
            });

            const hint = document.createElement('p');
            hint.style.cssText = 'font-size:0.7rem; color:var(--text-secondary); margin-top:0.3rem; letter-spacing:1px;';
            hint.textContent = '>> Кликните по миниатюре для просмотра';
            renderThumbnails.parentNode.insertBefore(hint, renderThumbnails.nextSibling);
        } else {
            renderGallery.style.display = 'none';
        }
    }

    // ===== АНИМАЦИЯ (кадры) =====
    const startUrls = Array.from({ length: model.startFrames }, (_, i) => `models/${model.name}/start_${i}.webp`);
    const idleUrls = Array.from({ length: model.idleFrames }, (_, i) => `models/${model.name}/idle_${i}.webp`);

    if (model.startFrames === 0 && model.idleFrames === 0) {
        const canvas = document.getElementById('animation-canvas');
        const ctx = canvas.getContext('2d');
        const iconUrl = model.preview || `models/${model.name}/icon.webp`;
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            document.getElementById('frame-loader').style.display = 'none';
        };
        img.onerror = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '16px RetroFont';
            ctx.textAlign = 'center';
            ctx.fillText('Нет изображения', canvas.width/2, canvas.height/2);
            document.getElementById('frame-loader').style.display = 'none';
        };
        img.src = iconUrl;
        return;
    }
    preloadFramesWithIndicator(startUrls, idleUrls);
}

async function preloadFramesWithIndicator(startUrls, idleUrls) {
    const loadId = ++currentLoadId;
    const loaderDiv = document.getElementById('frame-loader');
    const fillDiv = document.querySelector('.loader-fill');
    const percentSpan = document.getElementById('loader-percent');
    const allUrls = [...startUrls, ...idleUrls];
    if (!allUrls.length) return;
    loaderDiv.style.display = 'flex';
    let loaded = 0;
    const startTime = Date.now();

    const images = [];
    for (const url of allUrls) {
        const img = new Image();
        await new Promise(resolve => {
            img.onload = () => {
                if (loadId === currentLoadId) {
                    loaded++;
                    const p = (loaded / allUrls.length) * 100;
                    if (fillDiv) fillDiv.style.width = p + '%';
                    if (percentSpan) percentSpan.innerText = Math.floor(p) + '%';
                }
                resolve();
            };
            img.onerror = () => {
                if (loadId === currentLoadId) {
                    loaded++;
                    const p = (loaded / allUrls.length) * 100;
                    if (fillDiv) fillDiv.style.width = p + '%';
                    if (percentSpan) percentSpan.innerText = Math.floor(p) + '%';
                }
                resolve();
            };
            img.src = url;
        });
        images.push(img);
        if (loadId !== currentLoadId) return;
    }

    if (loadId !== currentLoadId) return;

    const elapsed = Date.now() - startTime;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
    loaderDiv.style.display = 'none';

    startAnimation(images, startUrls.length, idleUrls.length);
}

function startAnimation(images, startCount, idleCount) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let startIdx = 0, idleIdx = 0;
    let isStart = startCount > 0;
    const frameDelay = 120;

    function drawFrame(img) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }

    function nextFrame() {
        if (isStart) {
            if (startIdx < startCount) {
                drawFrame(images[startIdx]);
                startIdx++;
            } else if (idleCount > 0) {
                isStart = false;
                idleIdx = 0;
                drawFrame(images[startCount + idleIdx]);
                idleIdx = (idleIdx + 1) % idleCount;
            }
        } else if (idleCount > 0) {
            drawFrame(images[startCount + idleIdx]);
            idleIdx = (idleIdx + 1) % idleCount;
        }
    }

    if (startCount > 0) drawFrame(images[0]);
    else if (idleCount > 0) { drawFrame(images[0]); isStart = false; }

    animationInterval = setInterval(nextFrame, frameDelay);
    window.addEventListener('beforeunload', () => {
        if (animationInterval) clearInterval(animationInterval);
    });
}

// ============================================================
//  ФОНОВЫЕ ЧАСТИЦЫ
// ============================================================
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.15 + 0.05,
            color: `rgba(100, 255, 100, ${Math.random() * 0.25 + 0.05})`
        };
    }
    function init(count = 100) { particles = Array.from({ length: count }, createParticle); }
    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;
        });
        animId = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', () => { resize(); init(100); });
    resize(); init(100); draw();
    window.addEventListener('beforeunload', () => cancelAnimationFrame(animId));
})();

// ============================================================
//  ШАХМАТНЫЙ ФОН (ИСПРАВЛЕННЫЙ)
// ============================================================
(function initPulsingCheckerboard() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    const CELL_SIZE = 64;
    const PATTERN_SIZE = CELL_SIZE * 2;
    let offsetX = 0;
    let offsetY = 0;
    let time = 0;
    let animFrame = null;
    let patternCanvas = null;

    function getColors() {
        const style = getComputedStyle(document.body);
        const dark = style.getPropertyValue('--checker-dark').trim() || '#000000';
        const light = style.getPropertyValue('--checker-light').trim() || '#ffffff';
        return { dark, light };
    }

    function updatePattern() {
        const { dark, light } = getColors();
        patternCanvas = document.createElement('canvas');
        patternCanvas.width = PATTERN_SIZE;
        patternCanvas.height = PATTERN_SIZE;
        const pCtx = patternCanvas.getContext('2d');
        pCtx.fillStyle = dark;
        pCtx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
        pCtx.fillStyle = light;
        pCtx.fillRect(CELL_SIZE, 0, CELL_SIZE, CELL_SIZE);
        pCtx.fillRect(0, CELL_SIZE, CELL_SIZE, CELL_SIZE);
        pCtx.fillStyle = dark;
        pCtx.fillRect(CELL_SIZE, CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function draw() {
        if (!ctx || !patternCanvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const waveX = Math.sin(time * 0.0008) * 128;
        const driftX = time * 0.02;
        const totalXShift = (offsetX + waveX + driftX) % PATTERN_SIZE;
        const waveY = Math.sin(time * 0.0009 + 1.2) * 80;
        const driftY = time * 0.01;
        const totalYShift = (offsetY + waveY + driftY) % PATTERN_SIZE;
        const startX = -PATTERN_SIZE - totalXShift;
        const endX = canvas.width + PATTERN_SIZE;
        const startY = -PATTERN_SIZE - totalYShift;
        const endY = canvas.height + PATTERN_SIZE;
        for (let x = startX; x < endX; x += PATTERN_SIZE) {
            for (let y = startY; y < endY; y += PATTERN_SIZE) {
                ctx.drawImage(patternCanvas, x, y);
            }
        }
        time += 8;
        offsetX = (offsetX + 0.2) % PATTERN_SIZE;
        offsetY = (offsetY + 0.15) % PATTERN_SIZE;
        animFrame = requestAnimationFrame(draw);
    }

    const observer = new MutationObserver(() => { updatePattern(); });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', () => { resizeCanvas(); });
    updatePattern();
    resizeCanvas();
    draw();
    window.addEventListener('beforeunload', () => { if (animFrame) cancelAnimationFrame(animFrame); });
})();

// ============================================================
//  ТЕМЫ
// ============================================================
function applyTheme(theme) {
    document.body.classList.remove('theme-amber', 'theme-blue', 'theme-green');
    document.documentElement.classList.remove('theme-amber', 'theme-blue', 'theme-green');
    if (theme === 'amber') {
        document.body.classList.add('theme-amber');
        document.documentElement.classList.add('theme-amber');
    } else if (theme === 'blue') {
        document.body.classList.add('theme-blue');
        document.documentElement.classList.add('theme-blue');
    } else if (theme === 'green') {
        document.body.classList.add('theme-green');
        document.documentElement.classList.add('theme-green');
    }
    localStorage.setItem('retro-theme', theme);
}

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        playClickSound();
        applyTheme(e.target.dataset.theme);
    });
});

const savedTheme = localStorage.getItem('retro-theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme('green');
}

// ============================================================
//  КАСТОМНЫЙ СКРОЛЛБАР
// ============================================================
(function initCustomScrollbar() {
    const scrollbarContainer = document.createElement('div');
    scrollbarContainer.id = 'custom-scrollbar';
    scrollbarContainer.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        z-index: 9999;
        pointer-events: auto;
        background: transparent;
    `;
    document.body.appendChild(scrollbarContainer);
    const thumb = document.createElement('div');
    thumb.id = 'custom-scrollbar-thumb';
    thumb.style.cssText = `
        position: absolute;
        right: 2px;
        width: 6px;
        border-radius: 0;
        background: var(--border-color);
        pointer-events: auto;
        cursor: pointer;
        transition: background 0.2s;
    `;
    scrollbarContainer.appendChild(thumb);
    function updateThumb() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY;
        const thumbHeight = Math.max(30, (window.innerHeight / document.documentElement.scrollHeight) * window.innerHeight);
        const thumbTop = (scrollTop / docHeight) * (window.innerHeight - thumbHeight);
        thumb.style.height = thumbHeight + 'px';
        thumb.style.top = thumbTop + 'px';
    }
    window.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    updateThumb();
    scrollbarContainer.addEventListener('click', (e) => {
        if (e.target === thumb) return;
        const rect = scrollbarContainer.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percent = clickY / window.innerHeight;
        window.scrollTo(0, percent * (document.documentElement.scrollHeight - window.innerHeight));
    });
    let isDragging = false;
    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
        const startY = e.clientY;
        const startTop = thumb.offsetTop;
        const onMove = (e) => {
            const delta = e.clientY - startY;
            const newTop = Math.max(0, Math.min(window.innerHeight - thumb.offsetHeight, startTop + delta));
            const percent = newTop / (window.innerHeight - thumb.offsetHeight);
            window.scrollTo(0, percent * (document.documentElement.scrollHeight - window.innerHeight));
        };
        const onUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
})();

// ============================================================
//  НАВИГАЦИЯ
// ============================================================
function setupNavigation() {
    const backBtn = document.getElementById('back-to-gallery');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showGallery();
            const url = new URL(window.location);
            url.searchParams.delete('model');
            window.history.pushState({}, '', url);
        });
    }
    window.addEventListener('popstate', (event) => {
        const params = new URLSearchParams(window.location.search);
        const model = params.get('model');
        if (model) {
            showModelDetail(model);
        } else {
            showGallery();
        }
    });
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
function initApp() {
    const savedTheme = localStorage.getItem('retro-theme');
    if (savedTheme) applyTheme(savedTheme);
    else applyTheme('green');

    fetchModels().then(() => {
        window.focus();
        if (document.activeElement) document.activeElement.blur();
        window.scrollTo(0, 0);
        currentSort = 'random';
        renderTagFilters();
        setupSearch();
        setupSort();
        setupPagination();
        applyFilters();
        setupNavigation();

        const params = new URLSearchParams(window.location.search);
        const modelParam = params.get('model');
        if (modelParam) {
            setTimeout(() => showModelDetail(modelParam), 100);
        } else {
            showGallery();
        }
    }).catch(e => console.error(e));
}