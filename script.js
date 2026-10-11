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
            // Перестраиваем вывод только при ПРОПУСКЕ (частр строк ещё не набрана).
            // При обычном завершении строки уже на экране — их пересборка вызывала резкое мигание.
            const typedCount = outputContainer.querySelectorAll('.line').length;
            const allLines = lines.slice(0, lineIndex + 1);
            if (typedCount < allLines.length) {
                outputContainer.innerHTML = '';
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
            }
            const statusElemLocal = document.getElementById('terminal-status');
            if (statusElemLocal) {
                statusElemLocal.innerHTML = '<span class="status-text">>> СИСТЕМА ГОТОВА!</span>';
            }
        }

        setTimeout(() => {
            screen.classList.add('fade-out');
            try { document.getElementById('page-content').classList.add('power-on'); } catch(e) {}
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
            console.log('[GODOINED ARCHIVE] Загружено моделей:', allModels.length);
            return allModels;
        } else {
            throw new Error('Файл models_list.json пуст');
        }
    } catch(e) {
        console.error('[GODOINED ARCHIVE] Ошибка загрузки моделей:', e.message);
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
        case 'random':
            // Перемешиваем один раз на «сессию» фильтра, а не на каждый символ в поиске
            if (!randomOrderKey || randomOrderKey !== lastFilterSignature()) {
                cachedRandomOrder = shuffleArray(sorted.map((_, i) => i));
                randomOrderKey = lastFilterSignature();
            }
            return cachedRandomOrder.map(i => sorted[i]);
        case 'name-asc': return sorted.sort((a,b) => a.displayName.localeCompare(b.displayName));
        case 'name-desc': return sorted.sort((a,b) => b.displayName.localeCompare(a.displayName));
        default: return sorted;
    }
}

let cachedRandomOrder = null;
let randomOrderKey = null;
function lastFilterSignature() {
    const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    return (currentFilterTag || 'all') + '|' + q;
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
    currentFilteredModels = sortModels(getFilteredModels(), currentSort);
    renderModelsGrid(currentFilteredModels);
}

function renderModelsGrid(models) {
    const grid = document.getElementById('models-grid');
    if (!grid) return;
    const countEl = document.getElementById('model-count');
    if (countEl) countEl.textContent = `Всего: ${models.length}`;
    if (!models.length) {
        grid.innerHTML = '<div class="loading">НИЧЕГО НЕ НАЙДЕНО</div>';
        updatePaginationControls(0);
        return;
    }
    // Сортировка применяется заранее в applyFilters (порядок стабилен между перерисовками)
    const sortedModels = models;
    const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = sortedModels.slice(start, end);
    grid.innerHTML = '';
    pageItems.forEach((model, idx) => {
        const card = document.createElement('div');
        card.className = 'model-card reveal';
        card.style.setProperty('--stagger', (idx * 0.06).toFixed(2) + 's');
        setTimeout(() => card.classList.remove('reveal'), 1200 + idx * 60);
        card.addEventListener('click', () => {
            playClickSound();
            showModelDetail(model.name);
        });
        card.addEventListener('mouseenter', playHoverSound);
        card.addEventListener('mousemove', (e) => createParticles(e, card));
        // Лёгкий 3D-наклон карточки за курсором
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
            card.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--rx', '0deg');
        });
        // Путь для превью с новой структурой
        let previewUrl = model.preview || `models/${model.name}/frames/start/0001.webp`;
        if (model.startFrames === 0 && model.idleFrames > 0) previewUrl = `models/${model.name}/frames/idle/0001.webp`;
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

let particleThrottle = 0;
function createParticles(e, card) {
    const now = performance.now();
    if (now - particleThrottle < 60) return;
    particleThrottle = now;
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#3eff6e';
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
        particle.style.background = accent;
        particle.style.boxShadow = '0 0 2px ' + accent;
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
            const glow = `text-shadow: 0 0 2px ${color}, 0 0 6px ${color};`;
            const replacement = `<span style="color: ${color}; ${glow} display:inline-block;">${parseBBCode(content)}</span>`;
            safe = safe.substring(0, colorMatch.index) + replacement + safe.substring(colorMatch.index + colorMatch[0].length);
            changed = true;
            continue;
        }
        let rainbowMatch = /\[rainbow\]([\s\S]*?)\[\/rainbow\]/i.exec(safe);
        if (rainbowMatch) {
            const content = rainbowMatch[1];
            const replacement = `<span class="rainbow-text" style="display:inline-block;">${parseBBCode(content)}</span>`;
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
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
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
            // Футер возвращаем только ПОСЛЕ закрытия панели, иначе он всплывает поверх детального экрана
            document.body.classList.remove('detail-open');
            document.body.style.overflow = '';
            window.scrollTo(0, 0);
        }, 400);
    } else {
        gallery.classList.remove('hidden');
        header.classList.remove('hidden');
        document.body.classList.remove('detail-open');
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

    const newPlayBtn = playBtn.cloneNode(true);
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    const newVolumeBtn = volumeBtn.cloneNode(true);
    volumeBtn.parentNode.replaceChild(newVolumeBtn, volumeBtn);

    const newPlayBtnRef = document.getElementById('player-play');
    const newVolumeBtnRef = document.getElementById('player-volume-btn');

    function updateTime() {
        if (!video || video.duration === Infinity || isNaN(video.duration)) return;
        const current = video.currentTime || 0;
        const duration = video.duration || 0;
        const percent = duration ? (current / duration) * 100 : 0;
        progressFill.style.width = percent + '%';
        timeDisplay.textContent = formatTime(current) + ' / ' + formatTime(duration);
    }

    video.addEventListener('loadedmetadata', updateTime);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('ended', () => {
        newPlayBtnRef.textContent = '▶';
    });

    newPlayBtnRef.addEventListener('click', () => {
        if (video.paused) {
            video.play().catch(() => {});
            newPlayBtnRef.textContent = '⏸';
        } else {
            video.pause();
            newPlayBtnRef.textContent = '▶';
        }
    });

    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        if (video.duration) {
            video.currentTime = x * video.duration;
        }
    });

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

    if (!video.paused) {
        newPlayBtnRef.textContent = '⏸';
    }
    video.addEventListener('pause', () => {
        newPlayBtnRef.textContent = '▶';
    });
    video.addEventListener('play', () => {
        newPlayBtnRef.textContent = '⏸';
    });

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
//  ПОКАЗ ДЕТАЛЕЙ МОДЕЛИ (с поддержкой FPS из JSON)
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

    if (window.RETRO && typeof window.RETRO.recordOpen === 'function') {
        window.RETRO.recordOpen(model.displayName);
    }

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
    document.body.classList.add('detail-open');
    detail.classList.remove('closing');
    requestAnimationFrame(() => {
        detail.classList.add('visible');
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    });

    // ===== ГАЛЕРЕЯ РЕНДЕРОВ =====
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

            const oldHint = renderThumbnails.parentNode.querySelector('.render-hint');
            if (oldHint) oldHint.remove();

            const hint = document.createElement('p');
            hint.className = 'render-hint';
            hint.style.cssText = 'font-size:0.7rem; color:var(--text-secondary); margin-top:0.3rem; letter-spacing:1px;';
            hint.textContent = '>> Кликните по миниатюре для просмотра';
            renderThumbnails.parentNode.insertBefore(hint, renderThumbnails.nextSibling);

        } else {
            renderGallery.style.display = 'none';
        }
    }

    // ===== АНИМАЦИЯ (кадры) с поддержкой FPS =====
    const startUrls = Array.from({ length: model.startFrames }, (_, i) => 
        `models/${model.name}/frames/start/${String(i+1).padStart(4, '0')}.webp`
    );
    const idleUrls = Array.from({ length: model.idleFrames }, (_, i) => 
        `models/${model.name}/frames/idle/${String(i+1).padStart(4, '0')}.webp`
    );

    // Читаем FPS из модели (по умолчанию 24)
    const fps = (model.fps && typeof model.fps === 'number' && model.fps > 0) ? model.fps : 24;
    const frameDelay = 1000 / fps;

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
    preloadFramesWithIndicator(startUrls, idleUrls, frameDelay);
}

// ===== ПРЕДЗАГРУЗКА С ИНДИКАТОРОМ =====
async function preloadFramesWithIndicator(startUrls, idleUrls, frameDelay) {
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

    startAnimation(images, startUrls.length, idleUrls.length, frameDelay);
}

// ===== ЗАПУСК АНИМАЦИИ =====
function startAnimation(images, startCount, idleCount, frameDelay) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let startIdx = 0, idleIdx = 0;
    let isStart = startCount > 0;

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
//  ФОН В СТИЛЕ DISCORD CHECKPOINT:
//  точечная сетка + перспективная проволочная сетка + wireframe-фигуры
// ============================================================
(function initCheckpointBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, animFrame = null, time = 0;

    function themeColors() {
        const style = getComputedStyle(document.body);
        return {
            bg: style.getPropertyValue('--bg-dark').trim() || '#050508',
            accent: style.getPropertyValue('--accent').trim() || '#3eff6e',
            shadow: style.getPropertyValue('--shadow').trim() || '#1a4d1a'
        };
    }
    let colors = themeColors();

    // Фон рендерится в 1/3 разрешения и растягивается браузером
    // крупными «пикселями» (image-rendering: pixelated в CSS)
    const RENDER_SCALE = 3;

    function resizeCanvas() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.max(2, Math.ceil(W / RENDER_SCALE));
        canvas.height = Math.max(2, Math.ceil(H / RENDER_SCALE));
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        buildDotPattern();
    }

    // ---- статичная точечная сетка (как на фоне Checkpoint) ----
    let dotPattern = null;
    const DOT_GAP = 16;
    function buildDotPattern() {
        const pc = document.createElement('canvas');
        pc.width = DOT_GAP;
        pc.height = DOT_GAP;
        const p = pc.getContext('2d');
        p.fillStyle = colors.accent;
        p.globalAlpha = 0.10;
        p.beginPath();
        p.arc(DOT_GAP / 2, DOT_GAP / 2, 1.1, 0, Math.PI * 2);
        p.fill();
        dotPattern = ctx.createPattern(pc, 'repeat');
    }

    // ---- wireframe-фигуры ----
    function makeShape(i, total) {
        const kinds = ['prism', 'star', 'ring', 'cube', 'gem'];
        return {
            kind: kinds[i % kinds.length],
            x: Math.random(),
            y: Math.random(),
            size: 40 + Math.random() * 90,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.006,
            tilt: Math.random() * Math.PI * 2,
            tiltSpeed: (Math.random() - 0.5) * 0.004,
            driftX: (Math.random() - 0.5) * 0.00006,
            driftY: (Math.random() - 0.5) * 0.00005,
            alpha: 0.16 + Math.random() * 0.2
        };
    }
    const shapeCount = window.innerWidth < 700 ? 5 : 9;
    const shapes = Array.from({ length: shapeCount }, (_, i) => makeShape(i, shapeCount));

    function project(x, y, z) {
        const f = 520;
        const scale = f / (f + z);
        return { x: W / 2 + x * scale, y: H / 2 + y * scale, s: scale };
    }

    function drawShape(sh) {
        const cx = (sh.x - 0.5) * W * 1.15;
        const cy = (sh.y - 0.5) * H * 1.15;
        const r = sh.size;
        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = sh.alpha;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = colors.accent;
        ctx.shadowBlur = 8;

        const pts3d = [];
        const seg = 14;
        if (sh.kind === 'ring') {
            for (let i = 0; i <= seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                pts3d.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
            }
        } else if (sh.kind === 'star') {
            for (let i = 0; i <= 10; i++) {
                const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                const rr = i % 2 === 0 ? r : r * 0.45;
                pts3d.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
            }
        } else if (sh.kind === 'prism') {
            for (let i = 0; i < seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                pts3d.push([Math.cos(a) * r, Math.sin(a) * r * 0.45, -r * 0.5]);
            }
            for (let i = 0; i < seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                pts3d.push([Math.cos(a) * r, Math.sin(a) * r * 0.45, r * 0.5]);
            }
        } else if (sh.kind === 'cube') {
            const v = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
            v.forEach(p => pts3d.push([p[0]*r*0.7, p[1]*r*0.7, p[2]*r*0.7]));
            const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
            ctx.beginPath();
            edges.forEach(e => {
                const a = rotY(rotX(pts3d[e[0]], sh.tilt), sh.rot);
                const b = rotY(rotX(pts3d[e[1]], sh.tilt), sh.rot);
                const pa = project(a[0] + cx, a[1] + cy, a[2]);
                const pb = project(b[0] + cx, b[1] + cy, b[2]);
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
            });
            ctx.stroke();
            ctx.restore();
            return;
        } else { // gem
            const top = [0, -r, 0], bot = [0, r, 0];
            for (let i = 0; i < seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                pts3d.push([Math.cos(a) * r * 0.8, 0, Math.sin(a) * r * 0.8]);
            }
            ctx.beginPath();
            for (let i = 0; i < seg; i++) {
                const p = rotY(rotX(pts3d[i], sh.tilt), sh.rot);
                const t = rotY(rotX(top, sh.tilt), sh.rot);
                const b = rotY(rotX(bot, sh.tilt), sh.rot);
                const pp = project(p[0] + cx, p[1] + cy, p[2]);
                const tp = project(t[0] + cx, t[1] + cy, t[2]);
                const bp = project(b[0] + cx, b[1] + cy, b[2]);
                ctx.moveTo(tp.x, tp.y); ctx.lineTo(pp.x, pp.y);
                ctx.moveTo(bp.x, bp.y); ctx.lineTo(pp.x, pp.y);
            }
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.beginPath();
        pts3d.forEach((p3, i) => {
            const p = rotY(rotX(p3, sh.tilt), sh.rot);
            const pr = project(p[0] + cx, p[1] + cy, p[2]);
            if (i === 0) ctx.moveTo(pr.x, pr.y); else ctx.lineTo(pr.x, pr.y);
        });
        if (sh.kind === 'ring' || sh.kind === 'star') ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    function rotX(p, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
    }
    function rotY(p, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    }

    // ---- перспективная сетка (пол/потолок) ----
    function drawPerspectiveGrid() {
        const vpx = W / 2, vpy = H / 2;
        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = 0.10;
        ctx.lineWidth = 1;

        // линии к точке схода
        const rays = 22;
        for (let i = 0; i <= rays; i++) {
            const t = i / rays;
            const edgeX = t * W * 2.2 - W * 0.6;
            ctx.beginPath();
            ctx.moveTo(vpx, vpy);
            ctx.lineTo(edgeX, -H * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(vpx, vpy);
            ctx.lineTo(edgeX, H * 1.2);
            ctx.stroke();
        }
        // расходящиеся кольца
        const offset = (time * 0.0004) % 1;
        for (let i = 0; i < 12; i++) {
            const t = (i + offset) / 12;
            const scale = Math.pow(t, 2.4) * 1.6 + 0.02;
            const halfW = W * scale, halfH = H * scale;
            ctx.globalAlpha = 0.10 * Math.min(1, t * 2.2);
            ctx.strokeRect(vpx - halfW / 2, vpy - halfH / 2, halfW, halfH);
        }
        ctx.restore();
    }

    function draw() {
        if (!ctx) return;
        colors = themeColors();
        ctx.clearRect(0, 0, W, H);

        // фоновая подложка (чуть светлее чёрного, как у Checkpoint)
        ctx.fillStyle = colors.bg;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;

        drawPerspectiveGrid();

        if (dotPattern) {
            ctx.save();
            ctx.fillStyle = dotPattern;
            const shiftX = (time * 0.004) % DOT_GAP;
            ctx.translate(-shiftX, 0);
            ctx.fillRect(0, 0, W + DOT_GAP, H);
            ctx.restore();
        }

        shapes.forEach(sh => {
            drawShape(sh);
            if (!reducedMotion) {
                sh.rot += sh.rotSpeed;
                sh.tilt += sh.tiltSpeed;
                sh.x += sh.driftX;
                sh.y += sh.driftY;
                if (sh.x < -0.1 || sh.x > 1.1) sh.driftX *= -1;
                if (sh.y < -0.1 || sh.y > 1.1) sh.driftY *= -1;
            }
        });

        // мягкое свечение в центре
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
        grad.addColorStop(0, 'rgba(255,255,255,0.03)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        time += 16;
        animFrame = requestAnimationFrame(draw);
    }

    // пересобрать точки при смене темы
    const observer = new MutationObserver(() => {
        colors = themeColors();
        buildDotPattern();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    draw();
    window.addEventListener('beforeunload', () => { if (animFrame) cancelAnimationFrame(animFrame); });
    console.log('[GODOINED ARCHIVE] Checkpoint-фон инициализирован (' + shapeCount + ' wireframe-фигур)');
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
        console.log('[GODOINED ARCHIVE] Приложение инициализировано, версия ' + (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?'));
    }).catch(e => console.error('[GODOINED ARCHIVE] initApp:', e));
}

// ============================================================
//  МОДАЛЬНОЕ ОКНО ЗАКАЗА 3D-ГИФТ (с альтернативной отправкой)
// ============================================================
(function initOrderModal() {
    const modal = document.getElementById('order-modal');
    const openBtn = document.getElementById('order-btn');
    const closeBtn = document.getElementById('order-modal-close');
    const form = document.getElementById('order-form');
    const statusDiv = document.getElementById('order-status');
    const mainSendBtn = document.getElementById('main-send-btn');
    const altSendBtn = document.getElementById('alt-send-btn');
    const fileInput = document.getElementById('order-files');

    if (!modal || !openBtn || !closeBtn || !form || !mainSendBtn) {
        console.warn('Не найдены элементы модалки заказа');
        return;
    }

    const ordersEnabled = typeof ENABLE_ORDERS !== 'undefined' ? ENABLE_ORDERS : true;

    if (!ordersEnabled) {
        openBtn.disabled = true;
        openBtn.title = 'Заказы временно не принимаются';
        openBtn.addEventListener('click', function() {
            alert('⛔ Заказы временно не принимаются. Загляните позже!');
        });
        return;
    }

    // ---- Открыть/закрыть модалку ----
    function openModal() {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
        playClickSound();
        document.body.style.overflow = 'hidden';
        statusDiv.style.display = 'none';
        mainSendBtn.style.display = 'block';
        altSendBtn.style.display = 'none';
        mainSendBtn.disabled = false;
        mainSendBtn.textContent = '📨 ОТПРАВИТЬ ЗАЯВКУ';
        form.reset();
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        playBackSound();
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // ---- АЛЬТЕРНАТИВНАЯ ОТПРАВКА (mailto) ----
    altSendBtn.addEventListener('click', function() {
        const name = document.getElementById('order-name')?.value?.trim() || 'Аноним';
        const message = document.getElementById('order-message')?.value?.trim() || '';

        if (!message) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'order-status error';
            statusDiv.textContent = '❌ Поле "Описание модели" обязательно для заполнения.';
            return;
        }

        const subject = encodeURIComponent('Godoined Archive новая заявка');
        const body = encodeURIComponent(
            `Имя: ${name}\n\n` +
            `Описание модели:\n${message}\n\n` +
            `---\nПожалуйста, прикрепите фото/референсы к этому письму.`
        );
        const mailtoLink = `mailto:goodmopsreset@gmail.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');

        statusDiv.style.display = 'block';
        statusDiv.className = 'order-status success';
        statusDiv.textContent = '📧 Почтовый клиент открыт. Прикрепите фото и отправьте письмо.';
        playClickSound();

        setTimeout(() => {
            closeModal();
        }, 3000);
    });

    // ---- ОСНОВНАЯ ОТПРАВКА (FormSubmit) ----
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5 МБ

    async function sendFormWithRetry(formData, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch('https://formsubmit.co/goodmopsreset@gmail.com?fromname=Godoined+Archive', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    return { success: true };
                } else {
                    if (attempt < retries) continue;
                    return { success: false, error: `Ошибка HTTP ${response.status}` };
                }
            } catch (err) {
                if (attempt < retries) continue;
                return { success: false, error: err.message || 'Сетевая ошибка' };
            }
        }
        return { success: false, error: 'Не удалось отправить после нескольких попыток' };
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (fileInput && fileInput.files.length > 0) {
            let totalSize = 0;
            for (let f of fileInput.files) {
                totalSize += f.size;
            }
            if (totalSize > MAX_TOTAL_SIZE) {
                statusDiv.style.display = 'block';
                statusDiv.className = 'order-status error';
                statusDiv.innerHTML = `
                    ❌ Общий размер файлов превышает 5 МБ (сейчас ${(totalSize / 1024 / 1024).toFixed(1)} МБ).
                    <br>Используйте <strong>альтернативную отправку</strong> (кнопка появится ниже).
                `;
                mainSendBtn.style.display = 'none';
                altSendBtn.style.display = 'block';
                return;
            }
        }

        const message = document.getElementById('order-message')?.value?.trim();
        if (!message) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'order-status error';
            statusDiv.textContent = '❌ Поле "Описание модели" обязательно для заполнения.';
            return;
        }

        const formData = new FormData(form);
        mainSendBtn.disabled = true;
        mainSendBtn.textContent = 'ОТПРАВКА...';
        statusDiv.style.display = 'block';
        statusDiv.className = 'order-status';
        statusDiv.textContent = '⏳ Отправка...';

        const result = await sendFormWithRetry(formData, 3);

        if (result.success) {
            statusDiv.className = 'order-status success';
            statusDiv.textContent = '✅ Заявка успешно отправлена! Мы свяжемся с вами.';
            form.reset();
            setTimeout(() => {
                closeModal();
            }, 3000);
        } else {
            statusDiv.className = 'order-status error';
            statusDiv.innerHTML = `
                ❌ Не удалось отправить через сайт (${result.error || 'неизвестная ошибка'}).
                <br>Попробуйте <strong>альтернативную отправку</strong> (кнопка ниже).
            `;
            mainSendBtn.style.display = 'none';
            altSendBtn.style.display = 'block';
            playBackSound();
        }

        mainSendBtn.disabled = false;
        mainSendBtn.textContent = '📨 ОТПРАВИТЬ ЗАЯВКУ';
    });
})();

// ============================================================
//  ЖИВОЙ РЕТРО-СЛОЙ (HUD, ТОСТЫ, СТАТИСТИКА, ГЛИТЧИ)
// ============================================================
window.RETRO = (function () {
    const LS = {
        visits: 'retro-visits',
        opens: 'retro-opens',
        openedNames: 'retro-opened-names',
        sound: 'retro-sound'
    };

    function lsGet(key, fallback) {
        try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
    }
    function lsSet(key, value) {
        try { localStorage.setItem(key, String(value)); } catch (e) {}
    }
    function lsGetJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
    }
    function lsSetJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    // ---------- ТОСТЫ ----------
    function toast(title, text) {
        const box = document.getElementById('toast-container');
        if (!box) return;
        const el = document.createElement('div');
        el.className = 'toast';
        const t = document.createElement('span');
        t.className = 'toast-title';
        t.textContent = title;
        const b = document.createElement('span');
        b.textContent = text;
        el.appendChild(t);
        el.appendChild(b);
        box.appendChild(el);
        while (box.children.length > 4) box.removeChild(box.firstChild);
        setTimeout(() => {
            el.classList.add('out');
            setTimeout(() => el.remove(), 320);
        }, 4200);
    }

    // ---------- ЧАСЫ / FPS / АПТАЙМ ----------
    const clockEl = document.getElementById('hud-clock');
    const fpsEl = document.getElementById('hud-fps');
    const uptimeEl = document.getElementById('footer-uptime');
    const bootTime = Date.now();

    function pad(n) { return String(n).padStart(2, '0'); }

    function tickClock() {
        const d = new Date();
        if (clockEl) clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        if (uptimeEl) {
            const s = Math.floor((Date.now() - bootTime) / 1000);
            uptimeEl.textContent = 'АПТАЙМ: ' + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
        }
    }
    setInterval(tickClock, 1000);
    tickClock();

    let frames = 0, lastFpsTs = performance.now();
    (function fpsLoop(now) {
        frames++;
        if (now - lastFpsTs >= 1000) {
            if (fpsEl) fpsEl.textContent = Math.round((frames * 1000) / (now - lastFpsTs)) + ' FPS';
            frames = 0;
            lastFpsTs = now;
        }
        requestAnimationFrame(fpsLoop);
    })(performance.now());

    // ---------- ЗВУК: ПЕРЕКЛЮЧАТЕЛЬ ----------
    const soundBtn = document.getElementById('sound-toggle');
    function applySoundState() {
        if (!soundBtn) return;
        soundBtn.textContent = soundsEnabled ? '🔊' : '🔇';
        soundBtn.title = soundsEnabled ? 'Звук: вкл (нажми, чтобы выкл)' : 'Звук: выкл (нажми, чтобы вкл)';
    }
    if (lsGet(LS.sound, '1') === '0') soundsEnabled = false;
    applySoundState();
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            soundsEnabled = !soundsEnabled;
            lsSet(LS.sound, soundsEnabled ? '1' : '0');
            applySoundState();
            if (soundsEnabled) { playClickSound(); toast('ЗВУК', 'Звуковые эффекты включены'); }
            else { toast('ЗВУК', 'Звуковые эффекты выключены'); }
            updateTicker();
        });
    }

    // ---------- СТАТИСТИКА АРХИВА ----------
    function archiveStats() {
        const models = allModels.length;
        let renders = 0, videos = 0;
        allModels.forEach(m => {
            renders += (m.renders || []).length;
            videos += (m.videos || []).length;
        });
        return { models, renders, videos };
    }

    function animateCount(el, target) {
        if (!el) return;
        const start = parseInt(el.textContent, 10) || 0;
        if (start === target) { el.textContent = target; return; }
        const dur = 900;
        const t0 = performance.now();
        (function step(now) {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }

    const LEVELS = [
        { min: 0, name: 'НОВИЧОК' },
        { min: 5, name: 'ИССЛЕДОВАТЕЛЬ' },
        { min: 15, name: 'ХРАНИТЕЛЬ АРХИВА' },
        { min: 30, name: 'ЛЕГЕНДА АРХИВА' }
    ];
    function levelFor(opens) {
        let cur = LEVELS[0];
        LEVELS.forEach(l => { if (opens >= l.min) cur = l; });
        const next = LEVELS.find(l => l.min > opens);
        return { name: cur.name, next };
    }

    function refreshStats() {
        const s = archiveStats();
        const visits = parseInt(lsGet(LS.visits, '0'), 10) || 0;
        const opens = parseInt(lsGet(LS.opens, '0'), 10) || 0;
        animateCount(document.getElementById('stat-models'), s.models);
        animateCount(document.getElementById('stat-renders'), s.renders);
        animateCount(document.getElementById('stat-videos'), s.videos);
        animateCount(document.getElementById('stat-visits'), visits);
        animateCount(document.getElementById('stat-opens'), opens);
        const lvl = levelFor(opens);
        const lvlEl = document.getElementById('cp-level');
        const nextEl = document.getElementById('cp-next');
        if (lvlEl) lvlEl.textContent = '>> УРОВЕНЬ: ' + lvl.name;
        if (nextEl) {
            nextEl.textContent = lvl.next
                ? '>> СЛЕД. ЧЕКПОИНТ: ' + lvl.next.name + ' ЧЕРЕЗ ' + (lvl.next.min - opens)
                : '>> ВСЕ ЧЕКПОИНТЫ ПОЛУЧЕНЫ';
        }
        return s;
    }

    function recordOpen(name) {
        const opens = (parseInt(lsGet(LS.opens, '0'), 10) || 0) + 1;
        lsSet(LS.opens, opens);
        let names = lsGetJSON(LS.openedNames, []);
        const isNew = !names.includes(name);
        if (isNew) { names.push(name); lsSetJSON(LS.openedNames, names); }
        refreshStats();
        const s = archiveStats();
        if (opens === 1) {
            toast('CHECKPOINT #1', 'Первое открытие модели — архив изучается!');
        } else if (isNew && names.length >= s.models && s.models > 0) {
            toast('ДОСТИЖЕНИЕ', 'Все модели архива просмотрены! Ты хранитель.');
        } else if (opens % 10 === 0) {
            toast('CHECKPOINT #' + opens, 'Моделей открыто: ' + opens + '. Продолжай в том же духе!');
        }
    }

    // ---------- БЕГУЩАЯ СТРОКА ----------
    const tickerTrack = document.getElementById('ticker-track');
    function updateTicker() {
        if (!tickerTrack) return;
        const s = archiveStats();
        const visits = lsGet(LS.visits, '0');
        const sound = soundsEnabled ? 'ЗВУК ВКЛ' : 'ЗВУК ВЫКЛ';
        const msg = 'АРХИВ 3D МОДЕЛЕЙ // В АРХИВЕ ' + s.models + ' МОДЕЛЕЙ, ' + s.renders + ' РЕНДЕРОВ И ' +
            s.videos + ' ВИДЕО // ТЫ ЗДЕСЬ БЫЛ ' + visits + ' РАЗ // ' + sound + ' // НОВЫЕ МОДЕЛИ ДОБАВЛЯЮТСЯ // ';
        tickerTrack.innerHTML = '';
        for (let i = 0; i < 2; i++) {
            const seg = document.createElement('span');
            seg.className = 'ticker-seg';
            seg.textContent = msg;
            tickerTrack.appendChild(seg);
        }
    }

    // ---------- ВИЗИТЫ ----------
    const visits = (parseInt(lsGet(LS.visits, '0'), 10) || 0) + 1;
    lsSet(LS.visits, visits);

    // ---------- ЭКРАННЫЙ ЖУРНАЛ ----------
    const consolePanel = document.getElementById('console-panel');
    const consoleToggle = document.getElementById('console-toggle');
    const consoleClose = document.getElementById('console-close');
    function setConsoleVisible(visible) {
        if (!consolePanel) return;
        consolePanel.classList.toggle('visible', visible);
        if (consoleToggle) consoleToggle.classList.toggle('console-on', visible);
        if (visible && typeof window.__CONSOLE_RENDER__ === 'function') window.__CONSOLE_RENDER__();
    }
    if (consoleToggle) {
        consoleToggle.addEventListener('click', () => {
            playClickSound();
            setConsoleVisible(!consolePanel.classList.contains('visible'));
        });
    }
    if (consoleClose) consoleClose.addEventListener('click', () => setConsoleVisible(false));
    // Если на старте уже были ошибки — журнал открыт сам (класс flash ставит диагностика)
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === 'ё' || e.key === '~') {
            if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
            e.preventDefault();
            playClickSound();
            setConsoleVisible(!consolePanel.classList.contains('visible'));
        }
        if (e.key === 'Escape' && consolePanel && consolePanel.classList.contains('visible')) {
            setConsoleVisible(false);
        }
    });

    // ---------- ГЛИТЧИ ----------
    const glitchEl = document.querySelector('.glitch-title');
    const flashEl = document.getElementById('glitch-flash');
    function randomGlitch() {
        if (glitchEl) {
            glitchEl.classList.add('glitching');
            setTimeout(() => glitchEl.classList.remove('glitching'), 320);
        }
        if (flashEl && Math.random() < 0.6) {
            flashEl.classList.add('active');
            setTimeout(() => flashEl.classList.remove('active'), 380);
        }
        setTimeout(randomGlitch, 4000 + Math.random() * 7000);
    }
    setTimeout(randomGlitch, 3000);

    // ---------- ПИКСЕЛЬНЫЙ СЛЕД КУРСОРА ----------
    let lastPixel = 0;
    document.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastPixel < 70) return;
        lastPixel = now;
        const p = document.createElement('div');
        p.className = 'cursor-pixel';
        p.style.left = (e.clientX - 3) + 'px';
        p.style.top = (e.clientY - 3) + 'px';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 620);
    }, { passive: true });

    // ---------- ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ МОДЕЛЕЙ ----------
    function onReady() {
        refreshStats();
        updateTicker();
        toast('АРХИВ ЗАГРУЖЕН', 'В системе ' + allModels.length + ' моделей. Осмотрись!');
    }
    let readyFired = false;
    let readyAttempts = 0;
    (function waitModels() {
        if (allModels.length > 0) {
            if (!readyFired) { readyFired = true; onReady(); }
        } else if (readyAttempts++ < 40) {
            setTimeout(waitModels, 400);
        } else {
            console.warn('[GODOINED ARCHIVE] Модели не загрузились — панель статистики останется пустой');
        }
    })();

    const verEl = document.getElementById('footer-version');
    if (verEl && typeof APP_VERSION !== 'undefined') verEl.textContent = 'ВЕРСИЯ: ' + APP_VERSION;

    return { toast, refreshStats, recordOpen, updateTicker };
})();
