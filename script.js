// ========== ВСТРОЕННЫЕ ДАННЫЕ (ЗАПАСНОЙ ВАРИАНТ) ==========
const EMBEDDED_MODELS = [
    {
        "name": "Helix",
        "displayName": "Helix",
        "description": "Dandy's world Clown \n\n[url=https://t.me/kislix_art]Telegram[/url]\n\n[url=https://x.com/kislixarter]Twitter/X[/url]",
        "tags": [
            { "name": "gift", "color": "#ffaa44" },
            { "name": "Dandy's world", "color": "rainbow" }
        ],
        "downloadable": false,
        "downloadFile": "model.zip",
        "startFrames": 2,
        "idleFrames": 3,
        "preview": "/models/Helix/icon.webp"
    },
    {
        "name": "Beez",
        "displayName": "Beez",
        "description": "Beez The Bee, full name Beez Wallace Sr., is one of the 42 playable Toons in Dandy's World. He was introduced on June 6, 2025, alongside Bumby, Sandy, and Ant. He is one of the 9 playable Main Characters and can be purchased in Dandy's Store. \n\n[url=https://x.com/hikorikimo]Twitter/X[/url]\n\n[url=https://t.me/BeezFamily]Telegram[/url]\n\n[url=https://dandys-world-fanon.fandom.com/wiki/Beez]Wiki[/url]",
        "tags": [
            { "name": "gift", "color": "#ffaa44" },
            { "name": "Dandy's world", "color": "rainbow" }
        ],
        "downloadable": false,
        "downloadFile": "model.zip",
        "startFrames": 0,
        "idleFrames": 0,
        "preview": "/models/Beez/icon.webp"
    },
    {
        "name": "Eliot",
        "displayName": "Eliot",
        "description": "---",
        "tags": [
            { "name": "gift", "color": "#ffaa44" },
            { "name": "Dandy's world", "color": "rainbow" }
        ],
        "downloadable": false,
        "downloadFile": "model.zip",
        "startFrames": 0,
        "idleFrames": 0,
        "preview": "/models/Eliot/icon.webp"
    }
];

let allModels = [];
let currentFilteredModels = [];
let currentSort = 'random';
let currentFilterTag = null;
let currentPage = 1;
const itemsPerPage = 12;
let audioCtx = null;
let soundsEnabled = true;

// ========== ЗВУКИ ==========
function initAudioContext() {
    if (audioCtx) return audioCtx;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    } catch(e) { soundsEnabled = false; return null; }
}
function playRetroClick() {
    if (!soundsEnabled) return;
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'suspended') { if(ctx) ctx.resume().catch(()=>{}); return; }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);
    osc.start();
    osc.stop(now + 0.08);
}
function playRetroHover() {
    if (!soundsEnabled) return;
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
    osc.start();
    osc.stop(now + 0.1);
}
function playWipeSound() {
    if (!soundsEnabled) return;
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 580;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.12);
    osc.start();
    osc.stop(now + 0.12);
    const bufferSize = 512;
    const noise = ctx.createScriptProcessor(bufferSize, 1, 1);
    noise.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) out[i] = (Math.random() - 0.5) * 0.3;
    };
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);
    setTimeout(() => noise.disconnect(), 100);
}
function playClick() { playRetroClick(); }
function playHover() { playRetroHover(); }

// ========== ПЕРЕХОД ==========
function smoothTransition(url) {
    const overlay = document.getElementById('transition-overlay');
    if (!overlay) { window.location.href = url; return; }
    playClick();
    playWipeSound();
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    overlay.classList.add('active');
    setTimeout(() => {
        window.location.href = url;
    }, 250);
}

// ========== СКАЧИВАНИЕ С ЭФФЕКТОМ ==========
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
        setTimeout(() => {
            flash.style.opacity = '0';
        }, 200);
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

    playClick();
    playWipeSound();
}

// ========== ЗАГРУЗКА МОДЕЛЕЙ (поиск по нескольким путям) ==========
async function fetchModels() {
    if (allModels.length) return allModels;
    try {
        const grid = document.getElementById('models-grid');
        if (grid && allModels.length === 0) grid.innerHTML = '<div class="loading"><span class="spinner"></span> ЗАГРУЗКА МОДЕЛЕЙ...</div>';
        // Массив возможных путей
        const possiblePaths = [
            '/models_list.json',
            'models_list.json',
            './models_list.json',
            '../models_list.json'
        ];
        let data = null;
        let lastError = null;
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    data = await response.json();
                    console.log(`✅ Модели загружены из: ${path}`);
                    break;
                }
            } catch (e) {
                lastError = e;
            }
        }
        if (data && Array.isArray(data) && data.length) {
            allModels = data;
            return allModels;
        }
        // Если внешний не загрузился – используем встроенный
        console.warn('⚠️ Внешний JSON не найден, используем встроенные данные.');
        if (EMBEDDED_MODELS.length) {
            allModels = EMBEDDED_MODELS;
            return allModels;
        }
        throw new Error('Нет данных о моделях');
    } catch(e) {
        console.error('Ошибка загрузки моделей:', e);
        const grid = document.getElementById('models-grid');
        if (grid) {
            grid.innerHTML = `<div class="loading" style="color: var(--text-secondary); border-color: var(--border-color);">
                ❌ ОШИБКА ЗАГРУЗКИ<br>
                <span style="font-size:0.8rem; opacity:0.7;">${e.message}</span><br>
                <span style="font-size:0.7rem; opacity:0.5;">Проверьте интернет или наличие models_list.json</span>
            </div>`;
        }
        return [];
    }
}

// ========== ПЕРЕМЕШИВАНИЕ ==========
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========== СОРТИРОВКА ==========
function sortModels(models, sortType) {
    const sorted = [...models];
    switch(sortType) {
        case 'random':
            return shuffleArray(sorted);
        case 'name-asc':
            return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
        case 'name-desc':
            return sorted.sort((a, b) => b.displayName.localeCompare(a.displayName));
        default:
            return sorted;
    }
}

// ========== ФИЛЬТРЫ ==========
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

// ========== ОТРИСОВКА СЕТКИ ==========
function renderModelsGrid(models) {
    const grid = document.getElementById('models-grid');
    if (!grid) return;
    if (!models.length) { grid.innerHTML = '<div class="loading">НИЧЕГО НЕ НАЙДЕНО</div>'; updatePaginationControls(0); return; }
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
        card.addEventListener('click', () => smoothTransition(`/model.html?name=${encodeURIComponent(model.name)}`));
        card.addEventListener('mouseenter', playHover);
        card.addEventListener('mousemove', (e) => createParticles(e, card));
        let previewUrl = model.preview || `/models/${model.name}/start_0.webp`;
        if (model.startFrames === 0 && model.idleFrames > 0) previewUrl = `/models/${model.name}/idle_0.webp`;
        if (model.startFrames === 0 && model.idleFrames === 0) previewUrl = model.preview || `/models/${model.name}/icon.webp`;
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

// ========== ПАГИНАЦИЯ ==========
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

// ========== ТЕГИ-ФИЛЬТРЫ ==========
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
            playClick();
            const tag = btn.dataset.tag;
            currentFilterTag = tag === 'all' ? null : tag;
            currentPage = 1;
            container.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
}

// ========== ПОИСК ==========
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

// ========== СОРТИРОВКА ==========
function setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        applyFilters();
        playClick();
    });
}

// ========== ЧАСТИЦЫ ПРИ НАВЕДЕНИИ ==========
function createParticles(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40 + 10;
        particle.style.left = (x + Math.cos(angle) * dist) + 'px';
        particle.style.top = (y + Math.sin(angle) * dist) + 'px';
        particle.style.position = 'absolute';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.background = `rgba(100, 255, 100, ${Math.random() * 0.8 + 0.2})`;
        particle.style.boxShadow = '0 0 2px #3eff6e';
        card.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

// ========== ПАРСЕР BBCode ==========
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

// ========== СТРАНИЦА МОДЕЛИ ==========
async function loadModelDetail(modelName) {
    try {
        const models = await fetchModels();
        const model = models.find(m => m.name === modelName);
        if (!model) throw new Error('Модель не найдена');
        document.title = `${model.displayName} — 3D модель`;
        document.getElementById('model-title').innerHTML = parseBBCode(model.displayName);
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
                const downloadUrl = `/models/${model.name}/${model.downloadFile}`;
                downloadWithEffect(downloadUrl);
            };
        } else downloadBtn.style.display = 'none';
        const shareBtn = document.getElementById('share-btn');
        const shareMsg = document.getElementById('share-message');
        shareBtn.onclick = () => {
            playClick();
            navigator.clipboard.writeText(window.location.href);
            shareMsg.style.display = 'inline-block';
            setTimeout(() => shareMsg.style.display = 'none', 2000);
        };
        const startUrls = Array.from({ length: model.startFrames }, (_, i) => `/models/${model.name}/start_${i}.webp`);
        const idleUrls = Array.from({ length: model.idleFrames }, (_, i) => `/models/${model.name}/idle_${i}.webp`);
        if (model.startFrames === 0 && model.idleFrames === 0) {
            const canvas = document.getElementById('animation-canvas');
            const ctx = canvas.getContext('2d');
            const iconUrl = model.preview || `/models/${model.name}/icon.webp`;
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const loader = document.getElementById('frame-loader');
                if (loader) loader.style.display = 'none';
            };
            img.onerror = () => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '16px RetroFont';
                ctx.textAlign = 'center';
                ctx.fillText('Нет изображения', canvas.width/2, canvas.height/2);
                const loader = document.getElementById('frame-loader');
                if (loader) loader.style.display = 'none';
            };
            img.src = iconUrl;
            return;
        }
        await preloadFramesWithIndicator(startUrls, idleUrls);
    } catch(e) {
        console.error(e);
        const container = document.querySelector('.model-container');
        if (container) container.innerHTML = '<div class="loading">ОШИБКА ЗАГРУЗКИ МОДЕЛИ</div>';
    }
}

// ========== ПРЕДЗАГРУЗКА КАДРОВ ==========
async function preloadFramesWithIndicator(startUrls, idleUrls) {
    const loaderDiv = document.getElementById('frame-loader');
    const fillDiv = document.querySelector('.loader-fill');
    const percentSpan = document.getElementById('loader-percent');
    const allUrls = [...startUrls, ...idleUrls];
    if (!allUrls.length) return;
    loaderDiv.style.display = 'flex';
    let loaded = 0;
    const startTime = Date.now();
    const promises = allUrls.map(url => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { loaded++; update(); resolve(); };
        img.onerror = () => { loaded++; update(); resolve(); };
        img.src = url;
        function update() {
            const p = (loaded / allUrls.length) * 100;
            if (fillDiv) fillDiv.style.width = p + '%';
            if (percentSpan) percentSpan.innerText = Math.floor(p) + '%';
        }
    }));
    await Promise.all(promises);
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
    loaderDiv.style.display = 'none';
    startAnimation(startUrls, idleUrls);
}

function startAnimation(startUrls, idleUrls) {
    const canvas = document.getElementById('animation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let startIdx = 0, idleIdx = 0, isStart = true;
    let interval;
    const frameDelay = 120;
    function drawFrame(url) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = url;
    }
    function nextFrame() {
        if (isStart) {
            if (startIdx < startUrls.length) {
                drawFrame(startUrls[startIdx]);
                startIdx++;
            } else if (idleUrls.length) {
                isStart = false;
                idleIdx = 0;
                drawFrame(idleUrls[idleIdx]);
                idleIdx = (idleIdx + 1) % idleUrls.length;
            }
        } else if (idleUrls.length) {
            drawFrame(idleUrls[idleIdx]);
            idleIdx = (idleIdx + 1) % idleUrls.length;
        }
    }
    if (startUrls.length) drawFrame(startUrls[0]);
    else if (idleUrls.length) { drawFrame(idleUrls[0]); isStart = false; }
    interval = setInterval(nextFrame, frameDelay);
    window.addEventListener('beforeunload', () => clearInterval(interval));
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== ФОНОВЫЕ ЧАСТИЦЫ ==========
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

// ========== ШАХМАТНЫЙ ФОН ==========
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
        pCtx.fillRect(0, CELL_SIZE, CELL_SIZE, CELL_SIZE);
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

// ========== ТЕМЫ ==========
function applyTheme(theme) {
    document.body.classList.remove('theme-amber', 'theme-blue');
    if (theme === 'amber') document.body.classList.add('theme-amber');
    else if (theme === 'blue') document.body.classList.add('theme-blue');
    localStorage.setItem('retro-theme', theme);
}
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { playClick(); applyTheme(e.target.dataset.theme); });
});
const savedTheme = localStorage.getItem('retro-theme');
if (savedTheme && savedTheme !== 'green') applyTheme(savedTheme);

// ========== КАСТОМНЫЙ СКРОЛЛБАР ==========
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
        pointer-events: none;
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
initAudioContext();
document.addEventListener('DOMContentLoaded', async () => {
    const back = document.getElementById('back-link');
    if (back) back.addEventListener('click', (e) => { e.preventDefault(); smoothTransition('/'); });
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        await fetchModels();
        if (allModels.length > 0) {
            currentSort = 'random';
            renderTagFilters();
            setupSearch();
            setupSort();
            setupPagination();
            applyFilters();
        }
    }
    if (window.location.pathname === '/model.html') {
        const params = new URLSearchParams(window.location.search);
        const modelName = params.get('name');
        if (modelName) loadModelDetail(modelName);
    }
});
