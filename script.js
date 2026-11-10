// ============================================================
//  ЗАГРУЗОЧНЫЙ ЭКРАН (ТЕРМИНАЛ С ПРОПУСКОМ)
// ============================================================
function isLocalServer() {
    return window.location.protocol === 'file:' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

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

    let bootStarted = false;
    let justStartedUntil = 0;

    function showStartPrompt() {
        if (!output) return;
        output.innerHTML = '';
        const span = document.createElement('span');
        span.className = 'line';
        span.style.opacity = '1';
        span.innerHTML = '> СИСТЕМА ГОТОВА К ЗАПУСКУ... НАЖМИ ЛЮБУЮ КЛАВИШУ ИЛИ КЛИКНИ, ЧТОБЫ ЗАПУСТИТЬ И ВКЛЮЧИТЬ ЗВУК <span class="cursor-char">█</span>';
        output.appendChild(span);
        if (statusElem) {
            statusElem.innerHTML = '<span class="status-text">>> НАЖМИ ЧТОБЫ ЗАПУСТИТЬ</span>';
        }
    }

    function beginBoot(e) {
        if (bootStarted) return;
        if (e.type === 'keydown' && (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta')) return;
        bootStarted = true;
        justStartedUntil = Date.now() + 400;
        document.removeEventListener('pointerdown', beginBoot);
        document.removeEventListener('keydown', beginBoot);
        document.removeEventListener('touchstart', beginBoot);
        try { window.__retroUnlockAudio(); } catch (err) {}
        initFanSound();
        if (output) output.innerHTML = '';
        updateStatus();
        typeTimer = setTimeout(typeLine, 250);
    }

    showStartPrompt();
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt => document.addEventListener(evt, beginBoot));

    let pendingStartupAudio = null;
    window.__retroUnlockAudio = function() {
        try {
            if (fanAudioCtx && fanAudioCtx.state === 'suspended') fanAudioCtx.resume().catch(function() {});
        } catch (e) {}
        try {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(function() {});
        } catch (e) {}
        if (pendingStartupAudio) {
            var a = pendingStartupAudio;
            pendingStartupAudio = null;
            a.play().catch(function() { pendingStartupAudio = a; });
        }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function(evt) {
        document.addEventListener(evt, window.__retroUnlockAudio);
    });
    window.__retroPlayStartupQueued = function() { return pendingStartupAudio; };

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
            playStartupSound();
            setTimeout(() => {
                screen.style.display = 'none';
                if (typeof initApp === 'function' && !window._appStarted) {
                    window._appStarted = true;
                    initApp();
                }
            }, 800);
        }, 500);
    }

    function playStartupSound() {
        if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return;
        try {
            const audio = new Audio('sounds/StartupMacQuadraAV.wav');
            audio.volume = 0.55;
            const p = audio.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    pendingStartupAudio = audio;
                });
            }
        } catch (e) {}
    }

    function handleSkip(e) {
        if (e.type === 'keydown') {
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') return;
        }
        if (!bootStarted) return;
        if (Date.now() < justStartedUntil) return;
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
        if (statusElem) statusElem.innerHTML = `<span class="status-text">${statusMessages[idx]}</span>`;
    }
})();

// ============================================================
//  СИСТЕМА ЛОКАЛИЗАЦИИ (I18N)
// ============================================================
const i18n = {
    ru: {
        pageTitle: "Архив моделей",
        headerTitle: "АРХИВ",
        orderBtn: "ЗАКАЗАТЬ 3D-ГИФТ",
        headerSub: "По приколу мой архив всяких моих работ 3D",
        aboutTitle: "> О сайте",
        aboutText: "Сделал я этот сайт специально для того чтобы хранить свои 3D модели, так же будут разные пополнения или типа того, МОЙ АРХИИИИИИИИВ!!",
        cpTitle: "> ТВОЙ АРХИВ ЗА ВСЁ ВРЕМЯ",
        cpModels: "МОДЕЛЕЙ",
        cpRenders: "РЕНДЕРОВ",
        cpVideos: "ВИДЕО",
        cpVisits: "ТВОИХ ВИЗИТОВ",
        cpOpens: "ОТКРЫТИЙ МОДЕЛЕЙ",
        cpSession: ">> СЕССИЯ АКТИВНА",
        cpLevel: ">> УРОВЕНЬ: НОВИЧОК",
        cpNext: ">> СЛЕД. ЧЕКПОИНТ ЧЕРЕЗ 5 ОТКРЫТИЙ",
        galleryTitle: "> ДОСТУПНЫЕ МОДЕЛИ",
        galleryTotal: "Всего: ",
        sortLabel: "Сортировка:",
        sortRandom: "Случайно",
        sortDefault: "Без сортировки",
        sortNameAsc: "По имени (А→Я)",
        sortNameDesc: "По имени (Я→А)",
        searchPlaceholder: "🔍 ПОИСК ПО НАЗВАНИЮ ИЛИ ОПИСАНИЮ...",
        loadingData: "ЗАГРУЗКА ДАННЫХ...",
        pageInfo: "Страница ",
        readTitle: ">Прочитайте",
        readText: "Все доступные модели вы можете скачать если сам автор или владелец разрешил их вам скачивать через сам сайт, пожалуйста уважайте чужое творчество, так же будут оставлены ссылки на автора персонажа или модели",
        backToGallery: "← Назад в галерею",
        detailLoading: "ЗАГРУЗКА МОДЕЛИ...",
        loaderText: "ЗАГРУЗКА КАДРОВ",
        rendersTitle: ">> РЕНДЕРЫ",
        btnDownload: "СКАЧАТЬ МОДЕЛЬ",
        btnShare: "ПОДЕЛИТЬСЯ",
        shareMsg: "Ссылка скопирована!",
        footerMarquee: "★ GODOINED ARCHIVE ★ СПАСИБО ЗА ПОСЕЩЕНИЕ ★ НОВЫЕ МОДЕЛИ СКОРО ★ УВАЖАЙ ЧУЖОЕ ТВОРЧЕСТВО ★ СДЕЛАНО С ЛЮБОВЬЮ К РЕТРО ★ ",
        footerStatus: "СИСТЕМА: В СЕТИ",
        footerUptime: "АПТАЙМ: 00:00:00",
        footerVersion: "ВЕРСИЯ: 2.4",
        ordersDisabledTitle: "⛔ ЗАКАЗЫ ВРЕМЕННО НЕ ПРИНИМАЮТСЯ",
        ordersDisabledText: "Приносим извинения, но сейчас мы не принимаем новые заявки. Загляните позже!",
        ordersDisabledBtn: "ПОНЯТНО",
        hudConsole: "КОНСОЛЬ",
        consoleTitle: "> СИСТЕМНЫЙ ЖУРНАЛ",
        acceptTitle: "СОСУД ПРИНЯТ",
        acceptSub: ">> СИСТЕМА АРХИВА ПРИВЕТСТВУЕТ ТЕБЯ <<",
        initStatus: ">> ИНИЦИАЛИЗАЦИЯ...",
        initTicker: "ИНИЦИАЛИЗАЦИЯ АРХИВА...",
        nsfwTitle: "⚠️ ВНИМАНИЕ: 18+",
        nsfwText: "Этот контент может содержать материалы для взрослых. Вы подтверждаете, что вам исполнилось 18 лет?",
        nsfwAccept: "МНЕ 18, ОТКРЫТЬ",
        nsfwCancel: "ОТМЕНА",
        dialogs: {
            name: "Как тебя зовут?", nameSub: "Можно пропустить.", namePlaceholder: "ИМЯ",
            material: "Из чего сделан этот сосуд?",
            food: "Какая любимая еда у сосуда?",
            color: "Какой цвет ему нравится больше всего?", colorSub: "Выбери любой оттенок.", colorPlaceholder: "НАЗВАНИЕ ЦВЕТА...",
            purpose: "Для чего ты его создаёшь?",
            gift: "Какой дар ты ему преподнесёшь?",
            fear: "Чего он будет бояться больше всего?",
            feeling: "Что ты чувствуешь к своему творению?", feelingSub: "(Оно не услышит.)",
            honest: "Ты отвечал честно?",
            pain: "Ты осознаёшь возможность боли и страданий?",
            message: "Расскажи о своём творении.", messageSub: "Обязательное поле.", messagePlaceholder: "Что это? Из чего? Зачем?",
            files: "Есть ли у тебя референсы?", filesSub: "До 5 МБ. Можно несколько.",
            btnNext: "▶ ДАЛЕЕ", btnSkip: "✕ ПРОПУСТИТЬ", btnBack: "← НАЗАД", btnSend: "▶ ОТПРАВИТЬ", btnMail: "📧 ПОЧТА",
            summaryTitle: "Вот что я записал.", summarySure: "Всё верно?",
            reactions: { name: "Хорошо.", material: "Материал принят.", food: "Записал.", color: "Красивый выбор.", purpose: "Судьба предрешена.", gift: "Принято.", fear: "Страх зафиксирован.", feeling: "Хорошо.", honest: "Записал.", pain: "Понял.", message: "Понял.", files: "Записал." }
        }
    },
    en: {
        pageTitle: "Model Archive",
        headerTitle: "ARCHIVE",
        orderBtn: "ORDER 3D-GIFT",
        headerSub: "Just my archive of various 3D works",
        aboutTitle: "> About",
        aboutText: "I made this site specifically to store my 3D models, there will also be various updates or something like that, MY ARCHIIIIIIIVE!!",
        cpTitle: "> YOUR ARCHIVE ALL TIME",
        cpModels: "MODELS",
        cpRenders: "RENDERS",
        cpVideos: "VIDEOS",
        cpVisits: "YOUR VISITS",
        cpOpens: "MODELS OPENED",
        cpSession: ">> SESSION ACTIVE",
        cpLevel: ">> LEVEL: NOVICE",
        cpNext: ">> NEXT CHECKPOINT IN 5 OPENS",
        galleryTitle: "> AVAILABLE MODELS",
        galleryTotal: "Total: ",
        sortLabel: "Sort:",
        sortRandom: "Random",
        sortDefault: "Default",
        sortNameAsc: "Name (A→Z)",
        sortNameDesc: "Name (Z→A)",
        searchPlaceholder: "🔍 SEARCH BY NAME OR DESCRIPTION...",
        loadingData: "LOADING DATA...",
        pageInfo: "Page ",
        readTitle: ">Read This",
        readText: "You can download all available models if the author or owner has allowed you to download them through the site, please respect other people's creativity, links to the character or model author will also be left",
        backToGallery: "← Back to gallery",
        detailLoading: "LOADING MODEL...",
        loaderText: "LOADING FRAMES",
        rendersTitle: ">> RENDERS",
        btnDownload: "DOWNLOAD MODEL",
        btnShare: "SHARE",
        shareMsg: "Link copied!",
        footerMarquee: "★ GODOINED ARCHIVE ★ THANKS FOR VISITING ★ NEW MODELS SOON ★ RESPECT OTHERS' CREATIVITY ★ MADE WITH LOVE FOR RETRO ★ ",
        footerStatus: "SYSTEM: ONLINE",
        footerUptime: "UPTIME: 00:00:00",
        footerVersion: "VERSION: 2.4",
        ordersDisabledTitle: "⛔ ORDERS ARE TEMPORARILY CLOSED",
        ordersDisabledText: "We apologize, but we are not accepting new requests right now. Check back later!",
        ordersDisabledBtn: "GOT IT",
        hudConsole: "CONSOLE",
        consoleTitle: "> SYSTEM LOG",
        acceptTitle: "VESSEL ACCEPTED",
        acceptSub: ">> ARCHIVE SYSTEM WELCOMES YOU <<",
        initStatus: ">> INITIALIZATION...",
        initTicker: "INITIALIZING ARCHIVE...",
        nsfwTitle: "⚠️ WARNING: 18+",
        nsfwText: "This content may contain adult material. Do you confirm that you are 18 years or older?",
        nsfwAccept: "I AM 18, OPEN",
        nsfwCancel: "CANCEL",
        dialogs: {
            name: "What is your name?", nameSub: "You can skip this.", namePlaceholder: "NAME",
            material: "What is this vessel made of?",
            food: "What is the vessel's favorite food?",
            color: "What color does it like the most?", colorSub: "Pick any shade.", colorPlaceholder: "COLOR NAME...",
            purpose: "What are you creating it for?",
            gift: "What gift will you give it?",
            fear: "What will it fear the most?",
            feeling: "What do you feel about your creation?", feelingSub: "(It will not hear.)",
            honest: "Did you answer honestly?",
            pain: "Do you acknowledge the possibility of pain and suffering?",
            message: "Tell me about your creation.", messageSub: "Required field.", messagePlaceholder: "What is it? Made of what? For what?",
            files: "Do you have any references?", filesSub: "Up to 5 MB. Multiple allowed.",
            btnNext: "▶ NEXT", btnSkip: "✕ SKIP", btnBack: "← BACK", btnSend: "▶ SEND", btnMail: "📧 MAIL",
            summaryTitle: "Here is what I recorded.", summarySure: "Is this correct?",
            reactions: { name: "Okay.", material: "Material accepted.", food: "Noted.", color: "Beautiful choice.", purpose: "Fate is sealed.", gift: "Accepted.", fear: "Fear recorded.", feeling: "Okay.", honest: "Noted.", pain: "Understood.", message: "Understood.", files: "Noted." }
        }
    }
};

let currentLang = localStorage.getItem('site-lang') || 'ru';

function t(key) {
    return i18n[currentLang][key] || i18n['ru'][key] || key;
}
function tDialog(key) {
    return i18n[currentLang].dialogs[key] || i18n['ru'].dialogs[key] || key;
}
function tReact(key) {
    return i18n[currentLang].dialogs.reactions[key] || i18n['ru'].dialogs.reactions[key] || key;
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation) {
            if (el.tagName === 'TITLE') document.title = translation;
            else el.textContent = translation;
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation) el.placeholder = translation;
    });
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = currentLang === 'ru' ? 'EN' : 'RU';

    if (typeof applyFilters === 'function' && typeof allModels !== 'undefined' && allModels.length > 0) {
        applyFilters();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ru' ? 'en' : 'ru';
            localStorage.setItem('site-lang', currentLang);
            applyLanguage();
            if (typeof playClickSound === 'function') playClickSound();
        });
    }
});

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

let modalMediaItems = [];
let modalCurrentIndex = 0;
let modalIsOpen = false;

let currentVideoElement = null;
let playerInterval = null;

// Возвращает корневой путь сайта (например, / или /GODOINED_Archive_models/)
function getBaseUrl() {
    let path = window.location.pathname;
    if (path.includes('/model/')) {
        path = path.split('/model/')[0];
    }
    path = path.replace(/index\.html$/, '');
    if (!path.endsWith('/')) path += '/';
    return path;
}

// Превращает относительный путь в абсолютный
function resolveUrl(url) {
    if (!url) return '';
    // Если путь уже полный (начинается с http или data) — не трогаем
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return getBaseUrl() + cleanUrl;
}

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
    if (ctx.state !== 'running') {
        ctx.resume().then(() => {
            if (ctx.state === 'running' && soundsEnabled) {
                playSound(freq, duration, type, volume);
            }
        }).catch(() => {});
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
function playShareSound() { playSound(1200, 0.06, 'square', 0.06); }

function playSequence(notes, startDelay = 0) {
    if (!soundsEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
        ctx.resume().then(() => {
            if (ctx.state === 'running' && soundsEnabled) playSequence(notes, startDelay);
        }).catch(() => {});
        return;
    }
    let offset = startDelay;
    notes.forEach(n => {
        const when = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = n.t || 'square';
        osc.frequency.setValueAtTime(n.f, when);
        if (n.glide) {
            osc.frequency.exponentialRampToValueAtTime(n.glide, when + n.d);
        }
        gain.gain.setValueAtTime(n.v || 0.08, when);
        gain.gain.exponentialRampToValueAtTime(0.00001, when + n.d);
        osc.start(when);
        osc.stop(when + n.d + 0.02);
        offset += n.gap !== undefined ? n.gap : n.d;
    });
}

function playOpenSound() {
    playSequence([
        { f: 523, d: 0.07, t: 'square', v: 0.07, gap: 0.06 },
        { f: 659, d: 0.07, t: 'square', v: 0.07, gap: 0.06 },
        { f: 784, d: 0.09, t: 'square', v: 0.08, gap: 0.07 },
        { f: 1047, d: 0.14, t: 'triangle', v: 0.09 }
    ]);
}

function playBackSound() {
    playSequence([
        { f: 784, d: 0.06, t: 'square', v: 0.06, gap: 0.05 },
        { f: 587, d: 0.06, t: 'square', v: 0.06, gap: 0.05 },
        { f: 440, d: 0.12, t: 'triangle', v: 0.07 }
    ]);
}

function playAchievementSound() {
    playSequence([
        { f: 659, d: 0.08, t: 'square', v: 0.07, gap: 0.09 },
        { f: 659, d: 0.08, t: 'square', v: 0.07, gap: 0.09 },
        { f: 784, d: 0.08, t: 'square', v: 0.08, gap: 0.09 },
        { f: 1047, d: 0.22, t: 'square', v: 0.09 },
        { f: 1319, d: 0.26, t: 'triangle', v: 0.08 }
    ]);
}

function playBlip(freq = 900, vol = 0.04) {
    playSound(freq, 0.05, 'square', vol);
}

function playLayerTicks() {
    if (!soundsEnabled) return;
    const delays = [150, 350, 400, 480, 560, 640];
    const freqs = [740, 880, 980, 1080, 1180, 1280];
    delays.forEach((ms, i) => {
        setTimeout(() => playBlip(freqs[i], 0.028), ms);
    });
}

function playModalOpenSound() {
    playSequence([
        { f: 660, d: 0.06, t: 'square', v: 0.05, gap: 0.06 },
        { f: 990, d: 0.1, t: 'square', v: 0.06 }
    ]);
}

function playModalCloseSound() {
    playSequence([
        { f: 990, d: 0.06, t: 'square', v: 0.05, gap: 0.06 },
        { f: 660, d: 0.1, t: 'square', v: 0.06 }
    ]);
}

function playToastSound() {
    playSequence([
        { f: 1100, d: 0.045, t: 'triangle', v: 0.045, gap: 0.09 },
        { f: 1400, d: 0.08, t: 'triangle', v: 0.05 }
    ]);
}

let lastSearchTick = 0;
function playSearchTick() {
    const now = performance.now();
    if (now - lastSearchTick < 70) return;
    lastSearchTick = now;
    playBlip(1500 + Math.random() * 200, 0.018);
}

function playThemeSwitchSound() {
    playSequence([
        { f: 400, glide: 1200, d: 0.25, t: 'sine', v: 0.05 },
        { f: 1200, d: 0.12, t: 'triangle', v: 0.04 }
    ]);
}

function playDownloadSound() {
    playSequence([
        { f: 980, glide: 220, d: 0.5, t: 'sawtooth', v: 0.05 },
        { f: 440, d: 0.06, t: 'square', v: 0.07, gap: 0.05 },
        { f: 880, d: 0.06, t: 'square', v: 0.07, gap: 0.05 },
        { f: 1320, d: 0.16, t: 'triangle', v: 0.09 }
    ], 0.05);
    const ctx = initAudioContext();
    if (!ctx || ctx.state !== 'running') return;
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
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.12);
    setTimeout(() => noise.disconnect(), 140);
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
        const response = await fetch(resolveUrl('models_list.json'));
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
    if (countEl) countEl.textContent = t('galleryTotal') + models.length;
    if (!models.length) {
        grid.innerHTML = `<div class="loading">${currentLang === 'ru' ? 'НИЧЕГО НЕ НАЙДЕНО' : 'NOTHING FOUND'}</div>`;
        updatePaginationControls(0);
        return;
    }
    const sortedModels = models;
    const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = sortedModels.slice(start, end);
    grid.innerHTML = '';
    pageItems.forEach((model, idx) => {
        const isNSFW = model.nsfw === true;
        const isComingSoon = model.comingSoon === true;
        const isTransparent = model.transparentPreview === true;
        const card = document.createElement('div');
        
        // ПРИМЕНЯЕМ ОБА КЛАССА, ЕСЛИ НУЖНО
        card.className = 'model-card reveal' 
            + (isNSFW ? ' nsfw' : '') 
            + (isComingSoon ? ' coming-soon' : '') 
            + (isTransparent ? ' transparent-preview' : '');

        card.style.setProperty('--stagger', (idx * 0.06).toFixed(2) + 's');
        setTimeout(() => card.classList.remove('reveal'), 1200 + idx * 60);

        // ДОБАВЛЯЕМ ЭЛЕМЕНТЫ NSFW (если NSFW)
        if (isNSFW) {
            const marquee = document.createElement('div');
            marquee.className = 'nsfw-marquee';
            const text = 'WARNING 18+ NSFW // WARNING 18+ NSFW // ';
            marquee.innerHTML = `<div class="nsfw-marquee-track"><span>${text}</span><span>${text}</span></div>`;
            card.appendChild(marquee);

            const badge = document.createElement('div');
            badge.className = 'nsfw-badge';
            badge.textContent = '18+';
            card.appendChild(badge);
        }

        // ЕСЛИ ЭТО "СКОРО", ДОБАВЛЯЕМ ОВЕРЛЕЙ
        if (isComingSoon) {
            const overlay = document.createElement('div');
            overlay.className = 'coming-soon-overlay';
            overlay.textContent = currentLang === 'ru' ? 'СКОРО...' : 'SOON...';
            card.appendChild(overlay);
        }

        // ОБРАБОТЧИК КЛИКА (ПРИОРИТЕТ У "СКОРО")
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isComingSoon) {
                if (typeof playCancel === 'function') playCancel();
                if (window.RETRO && window.RETRO.toast) {
                    window.RETRO.toast(
                        currentLang === 'ru' ? 'СКОРО' : 'SOON', 
                        currentLang === 'ru' ? 'Эта модель еще не готова!' : 'This model is not ready yet!'
                    );
                }
            } else if (isNSFW) {
                if (typeof window.showNsfwWarning === 'function') {
                    window.showNsfwWarning(model.name);
                }
            } else {
                playOpenSound();
                showModelDetail(model.name);
            }
        });
        card.addEventListener('mousemove', (e) => createParticles(e, card));
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
        
        let previewUrl = resolveUrl(model.preview || `models/${model.name}/frames/start/0001.webp`);
        if (model.startFrames === 0 && model.idleFrames > 0) previewUrl = resolveUrl(`models/${model.name}/frames/idle/0001.webp`);
        if (model.startFrames === 0 && model.idleFrames === 0) previewUrl = resolveUrl(model.preview || `models/${model.name}/icon.webp`);
        
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
    pageInfo.textContent = totalPages > 0 ? `${t('pageInfo')}${currentPage} ${currentLang === 'ru' ? 'из' : 'of'} ${totalPages}` : (currentLang === 'ru' ? 'Нет моделей' : 'No models');
}

function setupPagination() {
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
            playSequence([
                { f: 700, d: 0.05, t: 'square', v: 0.05, gap: 0.05 },
                { f: 500, d: 0.08, t: 'square', v: 0.05 }
            ]);
        }
    });
    document.getElementById('next-page')?.addEventListener('click', () => {
        const total = Math.ceil(getFilteredModels().length / itemsPerPage);
        if (currentPage < total) {
            currentPage++;
            applyFilters();
            playSequence([
                { f: 500, d: 0.05, t: 'square', v: 0.05, gap: 0.05 },
                { f: 700, d: 0.08, t: 'square', v: 0.05 }
            ]);
        }
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
    let html = `<button class="tag-filter-btn all ${!currentFilterTag ? 'active' : ''}" data-tag="all">${currentLang === 'ru' ? 'Все' : 'All'}</button>`;
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
    searchInput.addEventListener('input', () => {
        playSearchTick();
        filter();
    });
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
    if (window.location.search.includes('model=') || window.location.pathname.includes('/model/')) {
        let basePath = window.location.pathname.replace(/index\.html$/, '');
        
        if (isLocalServer()) {
            // Локально просто убираем ?model=...
            if (basePath.includes('/model/')) {
                basePath = basePath.split('/model/')[0] + '/';
            }
        } else {
            // На сайте убираем папку /model/Name/
            if (basePath.includes('/model/')) {
                basePath = basePath.split('/model/')[0] + '/';
            }
            if (!basePath.endsWith('/')) basePath += '/';
        }
        
        window.history.pushState({}, '', basePath);
    }
    currentModelName = null;
    const canvas = document.getElementById('animation-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    document.title = t('pageTitle');
    closeModal();
}

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

function openModal(mediaArray, startIndex = 0) {
    if (!mediaArray || mediaArray.length === 0) return;
    modalMediaItems = mediaArray;
    modalCurrentIndex = Math.max(0, Math.min(startIndex, mediaArray.length - 1));
    modalIsOpen = true;
    const modal = document.getElementById('render-modal');
    const counter = document.getElementById('modal-counter');
    const prevBtn = document.getElementById('modal-prev');
    const nextBtn = document.getElementById('modal-next');

    if (!modal) return;
    playModalOpenSound();
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
    if (modalIsOpen) playModalCloseSound();
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

function showModelDetail(modelName) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    const gallery = document.getElementById('gallery-container');
    const detail = document.getElementById('detail-container');
    const header = document.getElementById('main-header');
    
    let staticUrl;
    
    // Если мы ЛОКАЛЬНО, просто используем ?model=...
    if (isLocalServer()) {
        let basePath = window.location.pathname.replace(/index\.html$/, '');
        if (basePath.includes('/model/')) {
            basePath = basePath.split('/model/')[0] + '/';
        }
        staticUrl = basePath + '?model=' + encodeURIComponent(modelName);
    } else {
        // Если НА САЙТЕ (GitHub Pages), делаем красивые ссылки /model/Name/
        let basePath = window.location.pathname.replace(/index\.html$/, '');
        if (basePath.includes('/model/')) {
            basePath = basePath.split('/model/')[0] + '/';
        }
        if (!basePath.endsWith('/')) basePath += '/';
        staticUrl = basePath + 'model/' + encodeURIComponent(modelName) + '/';
    }
    
    window.history.pushState({ model: modelName }, '', staticUrl);
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
    
    shareBtn.onclick = async () => {
        playShareSound();
        
        let shareUrl = window.location.href;
        
        // Локально ссылка не будет иметь превью, но чтобы не копировать file:/// пути, 
        // на локальном сервере можно копировать просто локальный ?model=
        if (window.location.protocol === 'file:') {
            shareUrl = window.location.pathname + '?model=' + encodeURIComponent(model.name);
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            shareMsg.style.display = 'inline-block';
            shareMsg.textContent = currentLang === 'ru' ? 'Ссылка скопирована!' : 'Link copied!';
            setTimeout(() => { 
                shareMsg.style.display = 'none'; 
            }, 2000);
        } catch (e) {
            prompt('Скопируйте ссылку вручную:', shareUrl);
        }
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
    playLayerTicks();

    const renders = model.renders || [];
    const videos = model.videos || [];
    const renderGallery = document.getElementById('render-gallery');
    const renderThumbnails = document.getElementById('render-thumbnails');

    const allMedia = [];

    renders.forEach(src => {
        allMedia.push({ type: 'image', src: resolveUrl(src) }); 
    });
    videos.forEach(src => {
        allMedia.push({ type: 'video', src: resolveUrl(src) }); 
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
                thumb.src = resolveUrl(url);
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

    const startUrls = Array.from({ length: model.startFrames }, (_, i) => 
        resolveUrl(`models/${model.name}/frames/start/${String(i+1).padStart(4, '0')}.webp`)
    );
    const idleUrls = Array.from({ length: model.idleFrames }, (_, i) => 
        resolveUrl(`models/${model.name}/frames/idle/${String(i+1).padStart(4, '0')}.webp`)
    );

    const fps = (model.fps && typeof model.fps === 'number' && model.fps > 0) ? model.fps : 24;
    const frameDelay = 1000 / fps;

    if (model.startFrames === 0 && model.idleFrames === 0) {
        const canvas = document.getElementById('animation-canvas');
        const ctx = canvas.getContext('2d');
        const iconUrl = resolveUrl(model.preview || `models/${model.name}/icon.webp`);
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
    const RENDER_SCALE = 3;

    function resizeCanvas() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.max(2, Math.ceil(W / RENDER_SCALE));
        canvas.height = Math.max(2, Math.ceil(H / RENDER_SCALE));
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        buildDotPattern();
    }

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

    function makeShape(i, total) {
        const kinds = ['prism', 'star', 'ring', 'cube', 'gem', 'blender'];
        const kind = kinds[i % kinds.length];
        return {
            kind: kind,
            angle: Math.random() * Math.PI * 2,
            dist: Math.random(),
            speed: 0.00016 + Math.random() * 0.00022,
            size: kind === 'blender' ? (70 + Math.random() * 60) : (40 + Math.random() * 90),
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.006,
            tilt: Math.random() * Math.PI * 2,
            tiltSpeed: (Math.random() - 0.5) * 0.004,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.0006 + Math.random() * 0.0008,
            alpha: 0.16 + Math.random() * 0.2
        };
    }
    const shapeCount = window.innerWidth < 700 ? 5 : 9;
    const shapes = Array.from({ length: shapeCount }, (_, i) => makeShape(i, shapeCount));

    function updatePortalFlight(sh) {
        sh.dist += sh.speed;
        sh.wobble += sh.wobbleSpeed;
        sh.rot += sh.rotSpeed;
        sh.tilt += sh.tiltSpeed;
        if (sh.dist >= 1) {
            sh.dist = 0;
            sh.angle = Math.random() * Math.PI * 2;
            sh.speed = 0.00016 + Math.random() * 0.00022;
        }
        const wob = Math.sin(sh.wobble) * 0.06;
        const d = sh.dist * 0.75 + wob * sh.dist;
        sh.x = 0.5 + Math.cos(sh.angle) * d;
        sh.y = 0.5 + Math.sin(sh.angle) * d;
        sh.scale = 0.25 + sh.dist * 1.35;
        sh.fade = sh.dist < 0.12
            ? sh.dist / 0.12
            : (sh.dist > 0.82 ? (1 - sh.dist) / 0.18 : 1);
    }

    shapes.forEach(sh => {
        updatePortalFlight(sh);
        sh.dist = 0.05 + Math.random() * 0.9;
        updatePortalFlight(sh);
    });

    function project(x, y, z) {
        const f = 520;
        const scale = f / (f + z);
        return { x: W / 2 + x * scale, y: H / 2 + y * scale, s: scale };
    }

    function drawShape(sh) {
        const cx = (sh.x - 0.5) * W * 1.15;
        const cy = (sh.y - 0.5) * H * 1.15;
        const r = sh.size * (sh.scale || 1);
        const alpha = sh.alpha * (sh.fade !== undefined ? sh.fade : 1);
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = colors.accent;
        ctx.shadowBlur = 8;

        const pts3d = [];
        const seg = 14;
        if (sh.kind === 'blender') {
            drawBlenderLogo(W / 2 + cx, H / 2 + cy, r, sh.rot, alpha);
            ctx.restore();
            return;
        } else if (sh.kind === 'ring') {
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
        } else {
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

    function drawBlenderLogo(cx, cy, r, rot, alpha) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot * 0.25);
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = colors.accent;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = alpha;

        const bodyX = 0.1 * r, bodyY = 0.15 * r;
        const bodyR = 0.5 * r;

        ctx.beginPath();
        ctx.arc(bodyX, bodyY, bodyR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0.18 * r, 0.12 * r, 0.26 * r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0.2 * r, 0.1 * r, 0.18 * r, 0, Math.PI * 2);
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = alpha * 0.45;
        ctx.fill();
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(-0.4 * r, -0.2 * r);
        ctx.lineTo(0.02 * r, -0.75 * r);
        ctx.lineTo(0.48 * r, -0.28 * r);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-0.4 * r, -0.24 * r);
        ctx.lineTo(-0.58 * r, -0.24 * r);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-0.32 * r, -0.08 * r);
        ctx.quadraticCurveTo(-0.78 * r, 0.18 * r, -0.66 * r, 0.55 * r);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-0.46 * r, -0.02 * r);
        ctx.quadraticCurveTo(-0.66 * r, 0.22 * r, -0.66 * r, 0.55 * r);
        ctx.stroke();

        ctx.restore();
    }

    function drawPerspectiveGrid() {
        const vpx = W / 2, vpy = H / 2;
        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = 0.10;
        ctx.lineWidth = 1;

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
            if (!reducedMotion) updatePortalFlight(sh);
        });

        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
        grad.addColorStop(0, 'rgba(255,255,255,0.03)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        time += 16;
        animFrame = requestAnimationFrame(draw);
    }

    const observer = new MutationObserver(() => {
        colors = themeColors();
        buildDotPattern();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    draw();
    window.addEventListener('beforeunload', () => { if (animFrame) cancelAnimationFrame(animFrame); });
})();

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
        playThemeSwitchSound();
        applyTheme(e.target.dataset.theme);
    });
});

const savedTheme = localStorage.getItem('retro-theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme('green');
}

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

function setupNavigation() {
    const backBtn = document.getElementById('back-to-gallery');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showGallery();
        });
    }
    
    window.addEventListener('popstate', (event) => {
        const params = new URLSearchParams(window.location.search);
        let model = params.get('model');
        
        // Проверяем красивый путь ТОЛЬКО если мы не локально
        if (!model && !isLocalServer()) {
            const pathMatch = window.location.pathname.match(/\/model\/([^/]+)\/?$/);
            if (pathMatch) model = decodeURIComponent(pathMatch[1]);
        }
        
        if (model) {
            showModelDetail(model);
        } else {
            showGallery();
        }
    });
}

function initApp() {
    applyLanguage();

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

        // ⬇⬇⬇ 1. Сначала проверяем share-ссылку (высший приоритет)
        if (typeof window.handleSharedLink === 'function' && window.handleSharedLink()) {
            return;
        }

        // ⬇⬇⬇ 2. Потом обычная логика ?model=
        const params = new URLSearchParams(window.location.search);
        const modelParam = params.get('model');
        if (modelParam) {
            setTimeout(() => showModelDetail(modelParam), 100);
        } else {
            showGallery();
        }
    }).catch(e => console.error('[GODOINED ARCHIVE] initApp:', e));
}
// ============================================================
//  ЛОГИКА ПРЕДУПРЕЖДЕНИЯ 18+
// ============================================================
let pendingNsfwModel = null;

window.showNsfwWarning = function(modelName) {
    pendingNsfwModel = modelName;
    const modal = document.getElementById('nsfw-warning-modal');
    if (!modal) {
        console.error("Модалка #nsfw-warning-modal не найдена в HTML!");
        return;
    }
    
    if (typeof playCancel === 'function') playCancel();
    
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
};

window.closeNsfwWarning = function() {
    const modal = document.getElementById('nsfw-warning-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { 
        modal.style.display = 'none'; 
    }, 300);
    pendingNsfwModel = null;
};

document.addEventListener('DOMContentLoaded', () => {
    const nsfwModal = document.getElementById('nsfw-warning-modal');
    if (nsfwModal) {
        document.getElementById('nsfw-close')?.addEventListener('click', window.closeNsfwWarning);
        document.getElementById('nsfw-overlay')?.addEventListener('click', window.closeNsfwWarning);
        document.getElementById('nsfw-cancel')?.addEventListener('click', window.closeNsfwWarning);
        
        document.getElementById('nsfw-accept')?.addEventListener('click', () => {
            if (pendingNsfwModel) {
                const modelToOpen = pendingNsfwModel;
                window.closeNsfwWarning();
                if (typeof playOpenSound === 'function') playOpenSound();
                if (typeof showModelDetail === 'function') showModelDetail(modelToOpen);
            }
        });
    }
});
// ============================================================
//  ЭКРАН СОЗДАНИЯ СОСУДА — PIXIJS (1:1 С ОРИГИНАЛОМ)
// ============================================================
(function initOrderModal() {
    const modal = document.getElementById('order-modal');
    const openBtn = document.getElementById('order-btn');
    const closeBtn = document.getElementById('order-modal-close');
    const dialogue = document.getElementById('dt-dialogue');
    
    function openModal() {
        const fog = document.getElementById('dt-fog-overlay');
        if (fog) fog.classList.add('active');
        document.body.classList.add('dt-active');
        document.body.style.overflow = 'hidden';

        const acceptOverlay = document.getElementById('dt-accept-overlay');
        if (acceptOverlay) acceptOverlay.classList.remove('visible', 'fade-out');
        if (dialogue) dialogue.style.opacity = '1';

        try { if (typeof playClickSound === 'function') playClickSound(); } catch (e) {}

        try {
            state.step = 0;
            state.name = ''; state.material = ''; state.food = ''; state.color = ''; 
            state.colorHex = ''; state.colorName = ''; state.purpose = '';
            state.gift = ''; state.fear = ''; state.feeling = ''; state.honest = ''; state.pain = '';
            state.message = ''; state.files = null;
            if (typeof resetFinale === 'function') resetFinale();
            if (typeof clickEchoes !== 'undefined' && clickEchoes.length !== undefined) clickEchoes.length = 0;
            targetProgress = 0;
            currentProgress = 0;
            modal.style.setProperty('--dt-progress', '0');
        } catch (e) { console.warn('Reset state error:', e); }

        setTimeout(() => {
            try {
                modal.style.display = 'block';
                requestAnimationFrame(() => {
                    modal.classList.add('active');
                    setTimeout(() => { if (fog) fog.classList.remove('active'); }, 800);
                });
                setTimeout(() => {
                    try { if (typeof startMusic === 'function') startMusic(); } catch (e) {}
                    try { if (typeof runStep === 'function') runStep(); } catch (e) { console.error('runStep error:', e); }
                }, 1200);
            } catch (e) { console.error('Modal show error:', e); }
        }, 500);
    }

    function closeModal() {
        if (typeof playBackSound === 'function') playBackSound();
        const fog = document.getElementById('dt-fog-overlay');
        if (fog) fog.classList.add('active');
        modal.classList.remove('active');

        if (typeof stopMusic === 'function') stopMusic();
        if (typeof clearDialogue === 'function') clearDialogue();
        
        const acceptOverlay = document.getElementById('dt-accept-overlay');
        if (acceptOverlay) acceptOverlay.classList.remove('visible', 'fade-out');
        if (dialogue) dialogue.style.opacity = '1';

        if (typeof resetFinale === 'function') resetFinale();
        if (typeof clickEchoes !== 'undefined') clickEchoes.length = 0;
        targetProgress = 0;
        currentProgress = 0;

        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('dt-active');
            document.body.style.overflow = '';
            dialogue.innerHTML = '';
            modal.style.setProperty('--dt-progress', '0');
            setTimeout(() => { if (fog) fog.classList.remove('active'); }, 500);
        }, 700);
    }

    if (!modal || !openBtn || !dialogue) return;

    const ordersEnabled = typeof ENABLE_ORDERS !== 'undefined' ? ENABLE_ORDERS : true;
    if (!ordersEnabled) {
        openBtn.disabled = true;
        openBtn.title = 'Заказы временно не принимаются';
        openBtn.addEventListener('click', () => alert('⛔ Заказы временно не принимаются. Загляните позже!'));
        return;
    }

    const MAX_TOTAL_SIZE = 5 * 1024 * 1024;
    const state = {
        step: 0, name: '', material: '', food: '', color: '', colorHex: '', colorName: '', purpose: '',
        gift: '', fear: '', feeling: '', honest: '', pain: '', message: '', files: null
    };

    let currentProgress = 0;
    let targetProgress = 0;
    const PROGRESS_LERP = 0.035;
    let mouseNearHeart = 0;
    const clickEchoes = [];
    const personality = { heartHue: 340, spiralHue: 280, glowHue: 300, heartSat: 100, isAngry: false };

    function hexToHue(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { r = parseInt(hex[1]+hex[1], 16); g = parseInt(hex[2]+hex[2], 16); b = parseInt(hex[3]+hex[3], 16); }
        else if (hex.length === 7) { r = parseInt(hex.substring(1,3), 16); g = parseInt(hex.substring(3,5), 16); b = parseInt(hex.substring(5,7), 16); }
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
            h /= 6;
        }
        return Math.round(h * 360);
    }

    function updatePersonality() {
        let hHue = 340, sHue = 280, gHue = 300, hSat = 100, angry = false;
        if (state.feeling === 'ЛЮБОВЬ' || state.feeling === 'LOVE') { hHue = 340; sHue = 320; gHue = 340; }
        else if (state.feeling === 'НАДЕЖДА' || state.feeling === 'HOPE') { hHue = 200; sHue = 240; gHue = 220; }
        else if (state.feeling === 'СТРАХ' || state.feeling === 'FEAR') { hHue = 40; sHue = 280; gHue = 60; angry = true; }
        else if (state.feeling === 'ОТВРАЩЕНИЕ' || state.feeling === 'DISGUST') { hHue = 0; sHue = 200; gHue = 10; angry = true; }
        else if (state.feeling === 'СМЯТЕНИЕ' || state.feeling === 'CONFUSION') { hHue = 120; sHue = 180; gHue = 150; }

        if (state.material === 'ПЛОТЬ' || state.material === 'FLESH') hHue = 0;
        else if (state.material === 'СВЕТ' || state.material === 'LIGHT') { hHue = 60; sHue = 60; }
        else if (state.material === 'ТЬМА' || state.material === 'DARK') { hHue = 270; sHue = 270; }
        else if (state.material === 'ПУСТОТА' || state.material === 'VOID') { hHue = 180; sHue = 180; }

        if (state.purpose === 'ДЛЯ БИТВЫ' || state.purpose === 'FOR BATTLE') hHue = 0;
        else if (state.purpose === 'ДЛЯ ЛЮБВИ' || state.purpose === 'FOR LOVE') hHue = 330;
        else if (state.purpose === 'ДЛЯ РАЗРУШЕНИЯ' || state.purpose === 'FOR DESTRUCTION') { hHue = 15; sHue = 0; }

        if (state.food === 'БОЛЬ' || state.food === 'PAIN') hHue = (hHue + 300) % 360;
        else if (state.food === 'ХОЛОД' || state.food === 'COLD') hHue = (hHue + 180) % 360;
        else if (state.food === 'СЛАДКОЕ' || state.food === 'SWEET') hHue = (hHue + 15) % 360;
        else if (state.food === 'КИСЛОЕ' || state.food === 'SOUR') hHue = (hHue + 60) % 360;

        if (state.colorHex) sHue = hexToHue(state.colorHex);

        personality.heartHue = hHue;
        personality.spiralHue = sHue;
        personality.glowHue = gHue;
        personality.heartSat = hSat;
        personality.isAngry = angry;
    }

    (function initMouseTracking() {
        const handlerMove = (e) => {
            if (!modal.classList.contains('active')) return;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
            const maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.45;
            mouseNearHeart = Math.max(0, 1 - dist / maxDist);
        };
        const handlerClick = (e) => {
            if (!modal.classList.contains('active')) return;
            clickEchoes.push({ x: e.clientX / 3, y: e.clientY / 3, life: 0, maxLife: 38 });
        };
        document.addEventListener('mousemove', handlerMove, { passive: true });
        document.addEventListener('pointerdown', handlerClick, { passive: true });
    })();

    let finaleMode = 0;
    let finaleBoost = 0;
    let finaleStartTime = 0;

    function updateProgress() {
        targetProgress = Math.min(1, state.step / getSteps().length);
    }

    function getSteps() {
        return [
            { type: 'text', key: 'name', question: tDialog('name'), sub: tDialog('nameSub'),
              placeholder: tDialog('namePlaceholder'), maxLength: 24, optional: true,
              reaction: (st) => st.name ? (currentLang === 'ru' ? `Хорошо, ${st.name}.` : `Okay, ${st.name}.`) : tReact('name') },
              
            { type: 'choice', key: 'material', question: tDialog('material'),
              options: currentLang === 'ru' ? ['ПЛОТЬ', 'МЕТАЛЛ', 'СВЕТ', 'ТЬМА', 'СТЕКЛО', 'ПУСТОТА'] : ['FLESH', 'METAL', 'LIGHT', 'DARK', 'GLASS', 'VOID'], 
              reaction: tReact('material') },

            { type: 'choice', key: 'food', question: tDialog('food'),
              options: currentLang === 'ru' ? ['СЛАДКОЕ', 'МЯГКОЕ', 'КИСЛОЕ', 'СОЛЕНОЕ', 'ОСТРОЕ', 'ГОРЬКОЕ', 'МЕТАЛЛ', 'СВЕТ', 'ПЕПЕЛ', 'БОЛЬ', 'ХОЛОД'] : ['SWEET', 'SOFT', 'SOUR', 'SALTY', 'SPICY', 'BITTER', 'METAL', 'LIGHT', 'ASH', 'PAIN', 'COLD'], 
              reaction: tReact('food') },
              
            { type: 'color', key: 'color', question: tDialog('color'), 
              sub: tDialog('colorSub'), reaction: tReact('color') },

            { type: 'choice', key: 'purpose', question: tDialog('purpose'),
              options: currentLang === 'ru' ? ['ДЛЯ БИТВЫ', 'ДЛЯ ЛЮБВИ', 'ДЛЯ РАЗРУШЕНИЯ', 'ДЛЯ ЗАЩИТЫ', 'ДЛЯ СТРАДАНИЙ', 'ЧТОБЫ ОН ЖИЛ'] : ['FOR BATTLE', 'FOR LOVE', 'FOR DESTRUCTION', 'FOR PROTECTION', 'FOR SUFFERING', 'TO LIVE'], 
              reaction: tReact('purpose') },
              
            { type: 'choice', key: 'gift', question: tDialog('gift'),
              options: currentLang === 'ru' ? ['ДОБРОТА', 'УМ', 'АМБИЦИИ', 'ХРАБРОСТЬ', 'ГОЛОС', 'СИЛА', 'МУДРОСТЬ', 'ЖИЗНЬ', 'СМЕРТЬ', 'ВРЕМЯ'] : ['KINDNESS', 'MIND', 'AMBITION', 'BRAVERY', 'VOICE', 'STRENGTH', 'WISDOM', 'LIFE', 'DEATH', 'TIME'], 
              reaction: tReact('gift') },
              
            { type: 'choice', key: 'fear', question: tDialog('fear'),
              options: currentLang === 'ru' ? ['ТЕМНОТЫ', 'СЕБЯ', 'ТЕБЯ', 'ПУСТОТЫ', 'НИЧЕГО'] : ['DARKNESS', 'ITSELF', 'YOU', 'VOID', 'NOTHING'], 
              reaction: tReact('fear') },
              
            { type: 'choice', key: 'feeling', question: tDialog('feeling'),
              sub: tDialog('feelingSub'), 
              options: currentLang === 'ru' ? ['ЛЮБОВЬ', 'НАДЕЖДА', 'СТРАХ', 'ОТВРАЩЕНИЕ', 'БЕЗРАЗЛИЧИЕ', 'СМЯТЕНИЕ'] : ['LOVE', 'HOPE', 'FEAR', 'DISGUST', 'APATHY', 'CONFUSION'], 
              reaction: tReact('feeling') },
              
            { type: 'choice', key: 'honest', question: tDialog('honest'),
              options: currentLang === 'ru' ? ['ДА', 'НЕТ'] : ['YES', 'NO'], 
              reaction: tReact('honest') },
              
            { type: 'choice', key: 'pain', question: tDialog('pain'),
              options: currentLang === 'ru' ? ['ДА', 'НЕТ'] : ['YES', 'NO'], 
              reaction: tReact('pain') },
              
            { type: 'textarea', key: 'message', question: tDialog('message'),
              sub: tDialog('messageSub'), placeholder: tDialog('messagePlaceholder'), 
              reaction: tReact('message') },
              
            { type: 'file', key: 'files', question: tDialog('files'),
              sub: tDialog('filesSub'), optional: true, 
              reaction: tReact('files') }
        ];
    }

    // ============================================================
    //  PIXIJS 1:1 ИМИТАЦИЯ CANVAS 2D (ИСПРАВЛЕНО)
    // ============================================================
    (function initPixiEffects() {
        if (typeof PIXI === 'undefined') return;

        const PX = 3;
        
        // ВСЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ОБЪЯВЛЕНЫ ЗДЕСЬ, ДО RESIZE
        const particles = [];
        const soulComets = [];
        const soulSparks = [];
        const fogPixels = [];
        let fogInitialized = false;
        let cometLastSpawn = 0;
        let explosionStart = 0, lastExplosionSpark = 0;
        let shatterLines = [], shatterTime = 0, isFountainActive = false;
        const fountainParticles = [];
        const MAX_PARTICLES = 75;
        let time = 0;

        const app = new PIXI.Application({
            width: Math.max(2, Math.ceil(window.innerWidth / PX)),
            height: Math.max(2, Math.ceil(window.innerHeight / PX)),
            backgroundAlpha: 0,
            antialias: false,
            resolution: 1,
            autoDensity: false
        });

        app.view.style.position = 'absolute';
        app.view.style.top = '0';
        app.view.style.left = '0';
        app.view.style.width = '100vw';
        app.view.style.height = '100vh';
        app.view.style.zIndex = '1';
        app.view.style.pointerEvents = 'none';
        app.view.style.imageRendering = 'pixelated';

        modal.querySelectorAll('canvas').forEach(c => c.remove());
        modal.insertBefore(app.view, modal.firstChild);

        const staticLayer = new PIXI.Container();
        const trailLayer = new PIXI.Container();
        const glowLayer = new PIXI.Container();

        app.stage.addChild(staticLayer);
        app.stage.addChild(trailLayer);
        app.stage.addChild(glowLayer);

        const trailCanvas = document.createElement('canvas');
        const tctx = trailCanvas.getContext('2d');
        let trailTexture = PIXI.Texture.from(trailCanvas); // ДОБАВИТЬ let
        const trailSprite = new PIXI.Sprite(trailTexture);
        trailLayer.addChild(trailSprite);

        const glowCanvas = document.createElement('canvas');
        const gctx = glowCanvas.getContext('2d');
        let glowTexture = PIXI.Texture.from(glowCanvas); // ДОБАВИТЬ let
        const glowSprite = new PIXI.Sprite(glowTexture);
        glowLayer.addChild(glowSprite);

        const bloomCanvas = document.createElement('canvas');
        const bctx = bloomCanvas.getContext('2d');
        let bloomTexture = PIXI.Texture.from(bloomCanvas);
        const bloomSprite = new PIXI.Sprite(bloomTexture);
        staticLayer.addChild(bloomSprite);

        function resize() {
            const w = Math.max(2, Math.ceil(window.innerWidth / PX));
            const h = Math.max(2, Math.ceil(window.innerHeight / PX));
            
            app.renderer.resize(w, h);
            app.view.style.width = window.innerWidth + 'px';
            app.view.style.height = window.innerHeight + 'px';
            
            // БЕЗОПАСНОЕ ПЕРЕСОЗДАНИЕ ШЛЕЙФА
            trailCanvas.width = w; trailCanvas.height = h;
            trailTexture.destroy(true);
            trailTexture = PIXI.Texture.from(trailCanvas);
            trailSprite.texture = trailTexture;
            trailSprite.width = w; trailSprite.height = h;

            // БЕЗОПАСНОЕ ПЕРЕСОЗДАНИЕ СВЕЧЕНИЯ
            glowCanvas.width = w; glowCanvas.height = h;
            glowTexture.destroy(true);
            glowTexture = PIXI.Texture.from(glowCanvas);
            glowSprite.texture = glowTexture;
            glowSprite.width = w; glowSprite.height = h;

            // БЕЗОПАСНОЕ ПЕРЕСОЗДАНИЕ БЛУМА
            bloomCanvas.width = Math.max(2, Math.ceil(w / 4));
            bloomCanvas.height = Math.max(2, Math.ceil(h / 4));
            bloomTexture.destroy(true);
            bloomTexture = PIXI.Texture.from(bloomCanvas);
            bloomSprite.texture = bloomTexture;
            bloomSprite.width = w; bloomSprite.height = h;

            tctx.imageSmoothingEnabled = false;
            gctx.imageSmoothingEnabled = false;

            // Очищаем массивы, чтобы частицы пересоздались заново
            fogInitialized = false;
            particles.length = 0;
            soulComets.length = 0;
            soulSparks.length = 0;
            clickEchoes.length = 0;
        }
        resize();
        window.addEventListener('resize', resize);

        function hslToHex(h, s, l) {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return parseInt(`0x${f(0)}${f(8)}${f(4)}`, 16);
        }

        const fogGraphics = new PIXI.Graphics();
        const auraGraphics = new PIXI.Graphics();
        const magicCircleGraphics = new PIXI.Graphics();
        const spiralGraphics = new PIXI.Graphics();
        const rayGraphics = new PIXI.Graphics();
        const cometGraphics = new PIXI.Graphics();
        const heartGraphics = new PIXI.Graphics();
        const mirrorHeartGraphics = new PIXI.Graphics();
        const sparkGraphics = new PIXI.Graphics();
        const shockwaveGraphics = new PIXI.Graphics();
        const fountainGraphics = new PIXI.Graphics();
        const clickEchoGraphics = new PIXI.Graphics();

        staticLayer.addChild(fogGraphics, auraGraphics, magicCircleGraphics, spiralGraphics, rayGraphics, shockwaveGraphics, fountainGraphics, clickEchoGraphics);
        trailLayer.addChild(cometGraphics, heartGraphics, mirrorHeartGraphics, sparkGraphics);

        function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
        function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

        const SPIRAL_ARMS = 4;
        const SPIRAL_PARTICLES = [];
        let spiralInitialized = false;

        function initSpiral() {
            SPIRAL_PARTICLES.length = 0;
            for (let arm = 0; arm < SPIRAL_ARMS; arm++) {
                for (let i = 0; i < 32; i++) {
                    SPIRAL_PARTICLES.push({
                        arm: arm, s: i / 32, speed: 0.0035 + Math.random() * 0.0025,
                        size: Math.random() < 0.35 ? 2 : 1, hueBase: 265 + arm * 15
                    });
                }
            }
            spiralInitialized = true;
        }

        function spawnSoulComet(w, h) {
            const side = Math.floor(Math.random() * 4);
            const padding = 60;
            let x, y, angle;
            if (side === 0) { x = Math.random() * w; y = -padding; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
            else if (side === 1) { x = w + padding; y = Math.random() * h; angle = Math.PI + (Math.random() - 0.5) * 0.5; }
            else if (side === 2) { x = Math.random() * w; y = h + padding; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
            else { x = -padding; y = Math.random() * h; angle = (Math.random() - 0.5) * 0.5; }
            return { x, y, angle, speed: 1.4 + Math.random() * 0.9, size: 2 + Math.random() * 2, hue: 280 + Math.random() * 55, trail: [], age: 0 };
        }

        const RAY_COUNT = 32;
        const rayAngles = [];
        for (let i = 0; i < RAY_COUNT; i++) rayAngles.push((i * Math.PI * 2 / RAY_COUNT) + Math.random() * 0.1);

        function resetCanvasEffects() {
            // 1. Очищаем все массивы
            soulComets.length = 0; 
            soulSparks.length = 0; 
            particles.length = 0;
            fountainParticles.length = 0;
            fogPixels.length = 0;
            clickEchoes.length = 0;

            // 2. Сбрасываем таймеры и флаги
            cometLastSpawn = 0;
            explosionStart = 0; 
            lastExplosionSpark = 0;
            isFountainActive = false; 
            shatterTime = 0; 
            shatterLines = [];
            fogInitialized = false;

            // 3. Очищаем холст шлейфа (частицы)
            if (trailCanvas.width > 0 && trailCanvas.height > 0) {
                tctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            }
            trailTexture.update();
            
            // 4. ОЧИЩАЕМ ХОЛСТ СВЕЧЕНИЯ (ФОНТАНА)
            if (bloomCanvas.width > 0 && bloomCanvas.height > 0) {
                bctx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
            }
            bloomTexture.update();

            // 5. Принудительно очищаем все графические слои PixiJS
            fogGraphics.clear();
            auraGraphics.clear();
            magicCircleGraphics.clear();
            spiralGraphics.clear();
            rayGraphics.clear();
            cometGraphics.clear();
            heartGraphics.clear();
            mirrorHeartGraphics.clear();
            sparkGraphics.clear();
            shockwaveGraphics.clear();
            fountainGraphics.clear();
            clickEchoGraphics.clear();
        }
        window.__dtResetCanvas = resetCanvasEffects;

        function spawnParticle() {
            return { angle: Math.random() * Math.PI * 2, orbit: 12 + Math.random() * 65, size: 1 + Math.floor(Math.random() * 2), life: 0, maxLife: 180 + Math.random() * 280, speed: (0.004 + Math.random() * 0.018) * (Math.random() < 0.5 ? 1 : -1), hue: 250 + Math.random() * 70 };
        }

        const HEART_MAP = [
            [0,1,1,0,0,0,1,1,0],
            [1,1,1,1,0,1,1,1,1],
            [1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,0,0,1,0,0,0,0]
        ];

        function initFog(w, h) {
            fogPixels.length = 0;
            const count = Math.floor(w * 0.35);
            for (let i = 0; i < count; i++) {
                fogPixels.push({ x: Math.random() * w * 1.2, y: h * (0.75 + Math.random() * 0.25), size: 1 + Math.floor(Math.random() * 3), speed: 0.05 + Math.random() * 0.25, hue: 260 + Math.random() * 80 });
            }
            fogInitialized = true;
        }

        const EXPLOSION_DURATION = 1500;
        function getExplosionState() {
            if (!explosionStart) return null;
            const elapsed = performance.now() - explosionStart;
            if (elapsed < 0) return null;
            if (elapsed > EXPLOSION_DURATION) { explosionStart = 0; return null; }
            if (elapsed < 200) { const p = elapsed / 200; return { phase: 'charge', p, energyMult: 1 + p * 2.5, flash: 0, shake: p * 0.3, glowBoost: p * 0.4 }; }
            if (elapsed < 380) { const p = (elapsed - 200) / 180; return { phase: 'flash', p, energyMult: 3.5 - p * 0.3, flash: p < 0.3 ? p / 0.3 : (1 - (p - 0.3) / 0.7), shake: 1.0, glowBoost: 1.0 }; }
            if (elapsed < 1000) { const p = (elapsed - 380) / 620; return { phase: 'explosion', p, energyMult: 3.2 - p * 2.2, flash: 0, shake: (1 - p) * 0.85, glowBoost: 1 - p * 0.6 }; }
            const p = (elapsed - 1000) / (EXPLOSION_DURATION - 1000);
            return { phase: 'afterglow', p, energyMult: 1 - p * 0.4, flash: 0, shake: 0, glowBoost: (1 - p) * 0.25 };
        }

        window.__dtStartExplosion = function() {
            explosionStart = performance.now();
            if (dtMusicSource && dtMusicSource.playbackRate && dtMusicSource.playbackRate.cancelScheduledValues) {
                const ctx = initAudioContext();
                if (ctx) {
                    dtMusicSource.playbackRate.cancelScheduledValues(ctx.currentTime);
                    dtMusicSource.playbackRate.linearRampToValueAtTime(1.4, ctx.currentTime + 0.3);
                    dtMusicSource.playbackRate.linearRampToValueAtTime(0.6, ctx.currentTime + 1.5);
                }
            }
        };

        window.__dtShatterFountain = function() {
            shatterLines = []; shatterTime = 1; isFountainActive = true; fountainParticles.length = 0; 
            const w = app.screen.width;
            const h = app.screen.height;
            const cx = w / 2, cy = h / 2;
            const numCracks = 30 + Math.floor(Math.random() * 20);
            for (let i = 0; i < numCracks; i++) {
                const angle = Math.random() * Math.PI * 2;
                const segments = [];
                let currentX = cx, currentY = cy, currentAngle = angle;
                const length = (Math.max(w, h) / 2) + 50;
                let dist = 0;
                while (dist < length) {
                    const step = 15 + Math.random() * 30;
                    currentAngle += (Math.random() - 0.5) * 0.6;
                    currentX += Math.cos(currentAngle) * step; currentY += Math.sin(currentAngle) * step;
                    segments.push({ x: currentX, y: currentY }); dist += step;
                }
                shatterLines.push(segments);
            }
        };

        const innerEl = modal.querySelector('.dt-inner');
        function applyShake(intensity) {
            if (!innerEl) return;
            if (intensity < 0.02) { innerEl.style.transform = ''; return; }
            const amp = intensity * 14;
            const dx = (Math.random() - 0.5) * amp, dy = (Math.random() - 0.5) * amp;
            const rot = (Math.random() - 0.5) * intensity * 0.8;
            innerEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        }

        // --- Основной цикл рендера ---
        app.ticker.add(() => {
            // ВСЕГДА БЕРЕМ АКТУАЛЬНЫЙ РАЗМЕР ОКНА (ИГНОРИРУЕМ КЭШ PIXI)
            const w = Math.max(2, Math.ceil(window.innerWidth / PX));
            const h = Math.max(2, Math.ceil(window.innerHeight / PX));
            const cx = w / 2, cy = h / 2;
            const gcx = w / 2, gcy = h / 2;
            
            currentProgress += (targetProgress - currentProgress) * PROGRESS_LERP;
            if (Math.abs(targetProgress - currentProgress) < 0.001) currentProgress = targetProgress;
            const progress = currentProgress;

            if (finaleMode === 1 && finaleStartTime) {
                const elapsed = performance.now() - finaleStartTime;
                finaleBoost = Math.min(1, elapsed / 2000);
                finaleBoost = 1 - Math.pow(1 - finaleBoost, 2);
            } else if (finaleMode === 2) finaleBoost = 1;
            else finaleBoost = 0;

            const explosionState = getExplosionState();
            const baseEnergy = Math.min(1, easeInOutQuad(progress) * 0.95 + finaleBoost * 0.3);
            const energy = explosionState ? Math.min(4, baseEnergy * explosionState.energyMult) : baseEnergy;

            modal.style.setProperty('--dt-progress', progress.toFixed(3));

            fogGraphics.clear();
            auraGraphics.clear();
            magicCircleGraphics.clear();
            spiralGraphics.clear();
            rayGraphics.clear();
            cometGraphics.clear();
            heartGraphics.clear();
            mirrorHeartGraphics.clear();
            sparkGraphics.clear();
            shockwaveGraphics.clear();
            fountainGraphics.clear();
            clickEchoGraphics.clear();

            // 1. Туман (Fog)
            if (!fogInitialized) initFog(w, h);
            const fogAlpha = 0.06 + energy * 0.18;
            for (const p of fogPixels) {
                p.x += p.speed * (1 + energy * 1.5);
                if (p.x > w * 1.2) p.x = -10;
                const wobble = Math.sin(p.x * 0.02 + time * 0.02) * 3;
                fogGraphics.beginFill(hslToHex(p.hue, 80, 55), fogAlpha);
                fogGraphics.drawRect(Math.floor(p.x), Math.floor(p.y + wobble), p.size, p.size);
                fogGraphics.endFill();
            }

            // 2. Лучи (Rays)
            if (energy > 0.05) {
                const maxR = Math.min(w, h) * 1.1;
                const activeRays = Math.floor(RAY_COUNT * Math.min(1, energy / 0.6));
                for (let i = 0; i < activeRays; i++) {
                    const angle = rayAngles[i];
                    const flicker = 0.7 + Math.sin(time * 0.03 + i * 0.7) * 0.3;
                    const len = maxR * Math.min(1, energy * 1.3) * flicker;
                    if (len < 3) continue;
                    const steps = Math.floor(len / 2.5);
                    for (let s = 0; s < steps; s++) {
                        const t0 = s / steps;
                        const x = cx + Math.cos(angle) * len * t0;
                        const y = cy + Math.sin(angle) * len * t0 * 0.55;
                        const segAlpha = (1 - t0) * 0.7 * energy * flicker;
                        if (segAlpha < 0.03) continue;
                        const hue = 280 + i * 4, light = 60 + 30 * (1 - t0);
                        const sz = t0 < 0.15 ? 3 : (t0 < 0.4 ? 2 : 1);
                        rayGraphics.beginFill(hslToHex(hue, 100, light), segAlpha);
                        rayGraphics.drawRect(Math.floor(x), Math.floor(y), sz, sz);
                        rayGraphics.endFill();
                    }
                }
            }

            // 3. Аура (Aura)
            const auraProg = Math.min(1, energy * 0.85);
            if (auraProg > 0) {
                // Центрируем строго по размерам холста
                const maxR = Math.min(w, h) * 0.45; 
                const bands = 7;
                for (let i = bands; i >= 1; i--) {
                    const ratio = i / bands;
                    const radius = Math.floor(maxR * ratio * (0.4 + auraProg * 0.6));
                    const alpha = (1 - ratio) * 0.18 * (0.35 + auraProg * 0.65);
                    auraGraphics.beginFill(0x6e00be, alpha);
                    auraGraphics.drawCircle(Math.floor(w / 2), Math.floor(h / 2), radius);
                    auraGraphics.endFill();
                }
                if (auraProg > 0.3) {
                    const innerP = (auraProg - 0.3) / 0.7;
                    auraGraphics.beginFill(0xc864ff, 0.16 * innerP);
                    auraGraphics.drawCircle(Math.floor(w / 2), Math.floor(h / 2), Math.floor(maxR * 0.28 * innerP));
                    auraGraphics.endFill();
                }
            }

            // 4. Магический круг (Magic Circle)
            if (energy > 0.12) {
                const groundY = cy + Math.min(w, h) * 0.28;
                const radiusX = Math.min(w, h) * 0.5;
                const radiusY = radiusX * 0.28;
                const alpha = Math.min(1, (energy - 0.12) / 0.38);
                const scale = 0.7 + Math.min(1, energy / 0.6) * 0.3;

                const drawEllipse = (rx, ry, hue, a, dashed) => {
                    magicCircleGraphics.beginFill(hslToHex(hue, 100, 75), a);
                    const seg = 80;
                    for (let i = 0; i < seg; i++) {
                        if (dashed && i % 4 >= 2) continue;
                        const angle = (i / seg) * Math.PI * 2;
                        const x = cx + Math.cos(angle) * rx;
                        const y = groundY + Math.sin(angle) * ry;
                        magicCircleGraphics.drawRect(Math.floor(x), Math.floor(y), 2, 2);
                    }
                    magicCircleGraphics.endFill();
                };
                const rx = radiusX * scale;
                const ry = radiusY * scale;
                drawEllipse(rx, ry, 280, alpha * 0.95, false);
                if (energy > 0.3) drawEllipse(rx * 0.78, ry * 0.78, 300, alpha * Math.min(1, (energy - 0.3) / 0.4) * 0.7, true);
                if (energy > 0.5) drawEllipse(rx * 0.52, ry * 0.52, 320, alpha * Math.min(1, (energy - 0.5) / 0.4) * 0.6, false);
                
                const hasName = state.name && state.name.length > 0;
                if (hasName) {
                    const name = state.name.toUpperCase().slice(0, 16);
                    const count = Math.max(name.length, 4);
                    const rot = time * (0.008 + energy * 0.025);
                    for (let i = 0; i < count; i++) {
                        const char = name[i % name.length], angle = (i / count) * Math.PI * 2 + rot;
                        const x = cx + Math.cos(angle) * rx * 0.88, y = groundY + Math.sin(angle) * ry * 0.88;
                        const flick = 0.5 + Math.sin(time * 0.08 + i * 1.3) * 0.5, a = energy * flick;
                        magicCircleGraphics.beginFill(hslToHex(310 + i * 4, 100, 85), a);
                        magicCircleGraphics.drawRect(Math.floor(x - 2), Math.floor(y - 2), 4, 4);
                        magicCircleGraphics.endFill();
                    }
                } else {
                    const runeCount = Math.floor(6 + energy * 10);
                    const rot = time * (0.008 + energy * 0.025);
                    for (let i = 0; i < runeCount; i++) {
                        const angle = (i / runeCount) * Math.PI * 2 + rot;
                        const x = cx + Math.cos(angle) * rx * 0.88;
                        const y = groundY + Math.sin(angle) * ry * 0.88;
                        const flick = 0.4 + Math.sin(time * 0.08 + i * 1.7) * 0.6;
                        magicCircleGraphics.beginFill(hslToHex(310, 100, 82), alpha * flick);
                        magicCircleGraphics.drawRect(Math.floor(x), Math.floor(y - 2), 2, 5);
                        magicCircleGraphics.drawRect(Math.floor(x - 2), Math.floor(y), 6, 2);
                        magicCircleGraphics.endFill();
                    }
                }

                if (energy > 0.4) {
                    const triAlpha = Math.min(1, (energy - 0.4) / 0.3) * alpha;
                    const triRot = -time * (0.012 + energy * 0.02);
                    const triPts = [];
                    for (let i = 0; i < 3; i++) {
                        const angle = triRot + (i / 3) * Math.PI * 2 - Math.PI / 2;
                        triPts.push([cx + Math.cos(angle) * rx * 0.42, groundY + Math.sin(angle) * ry * 0.42]);
                    }
                    magicCircleGraphics.beginFill(hslToHex(290, 100, 78), triAlpha * 0.55);
                    for (let i = 0; i < 3; i++) {
                        const a = triPts[i], b = triPts[(i + 1) % 3];
                        for (let s = 0; s <= 24; s++) {
                            const x = a[0] + (b[0] - a[0]) * (s / 24);
                            const y = a[1] + (b[1] - a[1]) * (s / 24);
                            magicCircleGraphics.drawRect(Math.floor(x), Math.floor(y), 2, 2);
                        }
                    }
                    magicCircleGraphics.endFill();
                }
                if (energy > 0.55) {
                    const pillarIntensity = Math.min(1, (energy - 0.55) / 0.35);
                    const height = groundY - cy;
                    const numPixels = Math.floor(16 + pillarIntensity * 24);
                    for (let i = 0; i < numPixels; i++) {
                        const phase = (time * (0.012 + pillarIntensity * 0.012) + i / numPixels) % 1;
                        const y = groundY - phase * height;
                        const x = cx + Math.sin(phase * 8 + time * 0.05) * 3 * pillarIntensity;
                        const w2 = (1 - phase * 0.55) * 7 * pillarIntensity;
                        const a = pillarIntensity * 0.65 * Math.sin(phase * Math.PI);
                        if (a < 0.03) continue;
                        magicCircleGraphics.beginFill(hslToHex(300, 100, 78), a);
                        magicCircleGraphics.drawRect(Math.floor(x - w2), Math.floor(y), Math.max(1, Math.floor(w2 * 2)), 2);
                        magicCircleGraphics.endFill();
                    }
                }
            }

            // 5. Спирали (Spirals)
            if (energy > 0.08) {
                if (!spiralInitialized) initSpiral();
                const maxR = Math.min(w, h) * 0.72; // Круглая спираль в центре
                const revolutions = 2.3;
                for (const p of SPIRAL_PARTICLES) {
                    p.s += p.speed * (0.3 + energy * 4);
                    if (p.s > 1) p.s -= 1;
                    const baseAngle = (p.arm / SPIRAL_ARMS) * Math.PI * 2;
                    const theta = baseAngle + p.s * revolutions * Math.PI * 2;
                    const r = (1 - p.s) * maxR;
                    const x = cx + Math.cos(theta) * r;
                    const y = cy + Math.sin(theta) * r * 0.55;
                    const intensity = 0.15 + p.s * 0.85;
                    const alpha = intensity * energy * 0.95;
                    const hue = p.hueBase + p.s * 55;
                    const light = 55 + p.s * 40;
                    if (p.s > 0.06) {
                        for (let k = 1; k <= 2; k++) {
                            const trailS = p.s - k * 0.014;
                            if (trailS < 0) continue;
                            const trailAngle = baseAngle + trailS * revolutions * Math.PI * 2;
                            const trailR = (1 - trailS) * maxR;
                            const tx = cx + Math.cos(trailAngle) * trailR;
                            const ty = cy + Math.sin(trailAngle) * trailR * 0.55;
                            spiralGraphics.beginFill(hslToHex(hue, 100, light - 10), alpha * (0.35 / k));
                            spiralGraphics.drawRect(Math.floor(tx), Math.floor(ty), p.size, p.size);
                            spiralGraphics.endFill();
                        }
                    }
                    spiralGraphics.beginFill(hslToHex(hue, 100, light), alpha);
                    spiralGraphics.drawRect(Math.floor(x), Math.floor(y), p.size, p.size);
                    spiralGraphics.endFill();
                }
            }

            // 6. Кометы (Comets)
            if (energy > 0.3) {
                const now = performance.now();
                const spawnInterval = Math.max(100, 500 - (energy - 0.3) * 570);
                const maxComets = 1 + Math.floor((energy - 0.3) * 7);
                if (now - cometLastSpawn > spawnInterval && soulComets.length < maxComets) {
                    cometLastSpawn = now;
                    soulComets.push(spawnSoulComet(w, h));
                }
                for (let i = soulComets.length - 1; i >= 0; i--) {
                    const c = soulComets[i];
                    c.age++;
                    const dx = cx - c.x, dy = cy - c.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetAngle = Math.atan2(dy, dx);
                    let da = targetAngle - c.angle;
                    while (da > Math.PI) da -= Math.PI * 2;
                    while (da < -Math.PI) da += Math.PI * 2;
                    c.angle += da * 0.06 * (1 + energy * 0.8);
                    const speedBoost = 1 + (1 - Math.min(1, dist / 320)) * energy * 2.2;
                    c.x += Math.cos(c.angle) * c.speed * speedBoost;
                    c.y += Math.sin(c.angle) * c.speed * speedBoost;
                    c.trail.unshift({ x: c.x, y: c.y });
                    if (c.trail.length > 26) c.trail.pop();
                    if (dist < 10) {
                        for (let s = 0; s < 12; s++) {
                            const sa = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3.5;
                            soulSparks.push({ x: cx, y: cy, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp, life: 0, maxLife: 25 + Math.random() * 20, size: 1 + Math.random() * 2, hue: c.hue });
                        }
                        soulComets.splice(i, 1);
                        continue;
                    }
                    for (let k = c.trail.length - 1; k >= 0; k--) {
                        const p = c.trail[k], tp = 1 - k / c.trail.length;
                        const trailAlpha = tp * tp * 0.85 * energy, trailLight = 42 + tp * 38;
                        const sz = Math.ceil(c.size * tp);
                        if (sz < 1) continue;
                        cometGraphics.beginFill(hslToHex(c.hue, 100, trailLight), trailAlpha);
                        cometGraphics.drawRect(Math.floor(p.x - sz / 2), Math.floor(p.y - sz / 2), sz, sz);
                        cometGraphics.endFill();
                    }
                    const headAlpha = energy * (0.9 + Math.sin(time * 0.18 + c.age * 0.1) * 0.1), sz = Math.ceil(c.size);
                    cometGraphics.beginFill(hslToHex(c.hue, 100, 60), headAlpha * 0.35);
                    cometGraphics.drawRect(Math.floor(c.x - sz * 1.5), Math.floor(c.y - sz * 1.5), sz * 3, sz * 3);
                    cometGraphics.endFill();
                    cometGraphics.beginFill(hslToHex(c.hue, 100, 88), headAlpha);
                    cometGraphics.drawRect(Math.floor(c.x - sz / 2), Math.floor(c.y - sz / 2), sz, sz);
                    cometGraphics.endFill();
                    cometGraphics.beginFill(0xffffff, headAlpha);
                    cometGraphics.drawRect(Math.floor(c.x), Math.floor(c.y), 1, 1);
                    cometGraphics.endFill();
                }
            }

            // 7. Сердце (Heart)
            if (progress > 0.45 || energy > 0.3) {
                const hp = Math.max((progress - 0.45) / 0.55, Math.min(1, energy));
                const baseCell = (1 + hp * 2) * (1 + energy * 0.5);
                const beatRate = 0.9 + mouseNearHeart * 1.4;
                const beatPhase = ((time * 0.016 * beatRate) % 1);
                const beatPulse = Math.pow(Math.max(0, 1 - beatPhase * 4), 2);
                const pulse = 1 + Math.sin(time * (0.08 + energy * 0.15)) * (0.08 + energy * 0.12) + beatPulse * 0.18;
                const cell = baseCell * pulse;
                const hue = personality.heartHue;
                const mapW = HEART_MAP[0].length, mapH = HEART_MAP.length;
                const startX = Math.floor(cx - (mapW * cell) / 2), startY = Math.floor(cy - (mapH * cell) / 2);
                
                if (Math.min(1, hp) > 0.05) {
                    heartGraphics.beginFill(hslToHex(hue, 100, 55), 0.16 * Math.min(1, hp));
                    for (let y = 0; y < mapH; y++) {
                        for (let x = 0; x < mapW; x++) {
                            if (!HEART_MAP[y][x]) continue;
                            heartGraphics.drawRect(startX + x * cell - cell, startY + y * cell - cell, cell * 3, cell * 3);
                        }
                    }
                    heartGraphics.endFill();
                }
                heartGraphics.beginFill(hslToHex(hue, 100, 55));
                for (let y = 0; y < mapH; y++) {
                    for (let x = 0; x < mapW; x++) {
                        if (!HEART_MAP[y][x]) continue;
                        heartGraphics.drawRect(startX + x * cell, startY + y * cell, cell, cell);
                    }
                }
                heartGraphics.endFill();
                if (Math.min(1, hp) > 0.5) {
                    heartGraphics.beginFill(hslToHex(hue, 100, 88), 0.6 * (Math.min(1, hp) - 0.5) * 2);
                    heartGraphics.drawRect(startX + 2 * cell, startY + 2 * cell, cell, cell);
                    heartGraphics.drawRect(startX + 3 * cell, startY + 2 * cell, cell, cell);
                    heartGraphics.endFill();
                }

                // Зеркальное сердце (отражение)
                if (energy > 0.3) {
                    const gap = 75;
                    const staticCell = baseCell; // ИСПОЛЬЗУЕМ baseCell ВМЕСТО cell (чтобы не прыгало)
                    const startY2 = cy + (mapH * staticCell) / 2 + gap;
                    const startX2 = Math.floor(cx - (mapW * staticCell) / 2);
                    const squash = 0.35;
                    const waveSpeed = time * 0.05;
                    for (let y = 0; y < mapH; y++) {
                        for (let x = 0; x < mapW; x++) {
                            if (!HEART_MAP[y][x]) continue;
                            const depth = (mapH - 1 - y);
                            // Волна покачивания (рябь на воде) остается
                            const waveX = Math.sin(waveSpeed + depth * 0.8) * (staticCell * 0.6 + depth * 0.2);
                            const py = startY2 + depth * staticCell * squash;
                            const px = startX2 + x * staticCell + waveX;
                            const fade = 1 - (depth / mapH);
                            const alpha = fade * 0.35 * energy;
                            if (alpha < 0.02) continue;
                            mirrorHeartGraphics.beginFill(hslToHex(hue, 100, 55), alpha);
                            mirrorHeartGraphics.drawRect(Math.floor(px), Math.floor(py), Math.ceil(staticCell), Math.ceil(staticCell * squash) + 1);
                            mirrorHeartGraphics.endFill();
                        }
                    }
                }
            }

            // 8. Ударная волна (Shockwave)
            if (explosionStart) {
                const elapsed = performance.now() - explosionStart;
                const rings = [ { start: 200, dur: 700, maxR: 1.15, hue: 300 }, { start: 280, dur: 600, maxR: 0.85, hue: 280 }, { start: 360, dur: 500, maxR: 0.55, hue: 320 } ];
                for (const ring of rings) {
                    if (elapsed < ring.start || elapsed > ring.start + ring.dur) continue;
                    const t = (elapsed - ring.start) / ring.dur;
                    const r = easeOutCubic(t) * Math.min(w, h) * ring.maxR;
                    const alpha = (1 - t) * 0.95, thickness = (1 - t) * 6 + 1;
                    const seg = Math.floor(r * 0.7);
                    for (let i = 0; i < seg; i++) {
                        const angle = (i / seg) * Math.PI * 2;
                        const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r * 0.55;
                        shockwaveGraphics.beginFill(hslToHex(ring.hue, 100, 90 - t * 15), alpha);
                        shockwaveGraphics.drawRect(Math.floor(x - thickness / 2), Math.floor(y - thickness / 2), Math.ceil(thickness), Math.ceil(thickness));
                        shockwaveGraphics.endFill();
                    }
                }
            }

            // 9. Искры (Sparks)
            for (let i = soulSparks.length - 1; i >= 0; i--) {
                const sp = soulSparks[i];
                sp.life++;
                if (sp.life > sp.maxLife) { soulSparks.splice(i, 1); continue; }
                sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.93; sp.vy *= 0.93;
                const p = sp.life / sp.maxLife, alpha = (1 - p) * 0.95, light = 82 + p * 15;
                const sz = Math.max(1, Math.ceil(sp.size * (1 - p * 0.5)));
                sparkGraphics.beginFill(hslToHex(sp.hue, 100, light), alpha);
                sparkGraphics.drawRect(Math.floor(sp.x), Math.floor(sp.y), sz, sz);
                sparkGraphics.endFill();
            }

            // 10. Трещины (Shatter)
            if (shatterTime > 0 && shatterTime < 80) {
                shatterTime++;
                const alpha = Math.max(0, 1 - (shatterTime / 80));
                shockwaveGraphics.beginFill(0xffffff, alpha);
                for (const line of shatterLines) {
                    if (line.length > 0) {
                        for (let j = 0; j < line.length - 1; j++) {
                            const p1 = line[j], p2 = line[j + 1];
                            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                            const steps = Math.floor(dist);
                            for (let s = 0; s < steps; s++) {
                                const t = s / steps;
                                const x = p1.x + (p2.x - p1.x) * t;
                                const y = p1.y + (p2.y - p1.y) * t;
                                shockwaveGraphics.drawRect(Math.floor(x), Math.floor(y), 2, 2);
                            }
                        }
                    }
                }
                shockwaveGraphics.endFill();
            }

            // 11. Фонтан (Fountain)
            if (isFountainActive) {
                const PX_F = 1.5;
                const maxHeight = h * 1.2;
                for (let y = 0; y < maxHeight; y += PX_F) {
                    const yRatio = y / maxHeight; 
                    const baseWidth = 10 + Math.pow(yRatio, 1.5) * 140;
                    const wave = Math.sin(y * 0.03 - time * 0.15) * 30 * yRatio;
                    for (let x = -baseWidth; x <= baseWidth; x += PX_F) {
                        const distFromCenter = Math.abs(x) / Math.max(1, baseWidth);
                        let spawnChance = 1 - Math.pow(distFromCenter, 1.5);
                        spawnChance *= (1 - yRatio * 0.4);
                        if (Math.random() > spawnChance) continue;
                        let color = 0xffffff;
                        if (distFromCenter < 0.2) color = 0xffffff;
                        else if (distFromCenter < 0.6) color = 0xff00f2;
                        else color = 0xff00dd;
                        fountainGraphics.beginFill(color);
                        fountainGraphics.drawRect(Math.floor((cx + x + wave) / PX_F) * PX_F, Math.floor((cy - y) / PX_F) * PX_F, PX_F, PX_F);
                        fountainGraphics.endFill();
                    }
                }
                for (let i = 0; i < 40; i++) {
                    const seed = i * 13.37, timeOffset = time * 3 + seed * 10;
                    const spawnY = cy - maxHeight * 0.9, spawnX = cx + (Math.random() - 0.5) * 200;
                    const dropY = spawnY + (timeOffset % 150), dropX = spawnX + Math.sin(timeOffset) * 60;
                    if (dropY < cy) {
                        fountainGraphics.beginFill(0xff64ff, 1 - (dropY - spawnY) / 150);
                        fountainGraphics.drawRect(Math.floor(dropX / PX_F) * PX_F, Math.floor(dropY / PX_F) * PX_F, PX_F, PX_F);
                        fountainGraphics.endFill();
                    }
                }

                // Bloom
                bloomCanvas.width = w / 4;
                bloomCanvas.height = h / 4;
                const bw = bloomCanvas.width, bh = bloomCanvas.height;
                const bcx = (cx / w) * bw, bcy = (cy / h) * bh;
                const scale = bw / w;
                
                bctx.clearRect(0, 0, bw, bh);
                bctx.save();
                bctx.filter = 'blur(4px)'; 
                bctx.globalCompositeOperation = 'lighter';
                
                const baseGrad = bctx.createRadialGradient(bcx, bcy, 0, bcx, bcy, 80 * scale);
                baseGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                baseGrad.addColorStop(0.4, 'rgba(255, 0, 242, 0.8)');
                baseGrad.addColorStop(1, 'transparent');
                bctx.fillStyle = baseGrad; bctx.beginPath(); bctx.arc(bcx, bcy, 80 * scale, 0, Math.PI * 2); bctx.fill();
                
                bctx.fillStyle = 'rgba(255, 0, 242, 0.5)'; bctx.beginPath();
                bctx.moveTo(bcx - 20 * scale, bcy); bctx.lineTo(bcx - 120 * scale, bcy - maxHeight * scale); bctx.lineTo(bcx + 120 * scale, bcy - maxHeight * scale); bctx.lineTo(bcx + 20 * scale, bcy); bctx.fill();
                
                bctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; bctx.beginPath();
                bctx.moveTo(bcx - 5 * scale, bcy); bctx.lineTo(bcx - 30 * scale, bcy - maxHeight * scale); bctx.lineTo(bcx + 30 * scale, bcy - maxHeight * scale); bctx.lineTo(bcx + 5 * scale, bcy); bctx.fill();
                
                bctx.restore();
                bloomTexture.update();
                bloomSprite.width = w;
                bloomSprite.height = h;
            }

            // 12. Клик-эхо (Click Echoes)
            for (let i = clickEchoes.length - 1; i >= 0; i--) {
                const c = clickEchoes[i];
                c.life++;
                if (c.life > c.maxLife) { clickEchoes.splice(i, 1); continue; }
                const p = c.life / c.maxLife, r = p * 90, seg = Math.floor(r * 0.6), alpha = (1 - p) * 0.7;
                for (let s = 0; s < seg; s++) {
                    const a = (s / seg) * Math.PI * 2;
                    clickEchoGraphics.beginFill(hslToHex(personality.glowHue, 100, 78), alpha);
                    clickEchoGraphics.drawRect(Math.floor(c.x + Math.cos(a) * r), Math.floor(c.y + Math.sin(a) * r), 2, 2);
                    clickEchoGraphics.endFill();
                }
            }

            // 13. Trail Canvas (Шлейф частиц)
            const tw = trailCanvas.width;
            const th = trailCanvas.height;
            const fadeRate = Math.max(0.04, 0.12 - energy * 0.06);
            tctx.globalCompositeOperation = 'destination-out';
            tctx.fillStyle = `rgba(0, 0, 0, ${fadeRate})`;
            tctx.fillRect(0, 0, tw, th); 
            tctx.globalCompositeOperation = 'source-over';

            const maxP = MAX_PARTICLES + Math.floor(energy * 100);
            const target = Math.floor(progress * maxP);
            while (particles.length < target) particles.push(spawnParticle());
            while (particles.length > target) particles.pop();

            const tcx = tw / 2, tcy = th / 2; 

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]; p.life++;
                if (finaleMode === 1 || finaleMode === 2) {
                    p.orbit -= 0.25 + energy * 0.85;
                    if (p.orbit < 2.5 && finaleMode === 1) { particles[i] = spawnParticle(); particles[i].orbit = 60 + Math.random() * 20; continue; }
                    p.angle += p.speed * (1 + energy * 2);
                } else {
                    p.angle += p.speed;
                }
                if (p.life > p.maxLife && finaleMode === 0) { particles[i] = spawnParticle(); continue; }
                const ratio = p.life / p.maxLife;
                const alpha = finaleMode === 0 ? Math.sin(ratio * Math.PI) * 0.9 : 0.9;
                const x = tcx + Math.cos(p.angle) * p.orbit, y = tcy + Math.sin(p.angle) * p.orbit * 0.55;
                let hue = p.hue, light = 72;
                if (energy > 0.2) { hue = p.hue - (p.hue - 330) * Math.min(1, energy); light = 72 + Math.min(50, energy * 30); }
                tctx.fillStyle = `hsla(${hue}, 100%, ${light}%, ${alpha})`;
                tctx.fillRect(Math.floor(x), Math.floor(y), p.size, p.size);
            }
            trailTexture.update();

            // 14. Glow Canvas (Свечение)
            gctx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
            const glowIntensity = Math.min(1.5, energy * 0.45 + (explosionState ? explosionState.glowBoost * 1.2 : 0));
            if (glowIntensity > 0.01) {
                // Берем минимум от w и h, чтобы свечение было идеальным кругом
                const coreR = Math.min(w, h) * (0.3 + energy * 0.35); 
                const grad = gctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, coreR);
                grad.addColorStop(0, `hsla(320, 100%, 70%, ${Math.min(1, glowIntensity) * 0.55})`);
                grad.addColorStop(0.35, `hsla(280, 100%, 65%, ${Math.min(1, glowIntensity) * 0.32})`);
                grad.addColorStop(0.7, `hsla(260, 100%, 55%, ${Math.min(1, glowIntensity) * 0.12})`);
                grad.addColorStop(1, 'transparent');
                gctx.fillStyle = grad; gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);

                if (explosionState && explosionState.phase === 'flash') {
                    const whiteR = Math.min(w, h) * 0.4;
                    const wg = gctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, whiteR);
                    wg.addColorStop(0, `rgba(255, 255, 255, ${explosionState.flash})`);
                    wg.addColorStop(0.4, `rgba(255, 220, 255, ${explosionState.flash * 0.6})`);
                    wg.addColorStop(1, 'transparent');
                    gctx.fillStyle = wg; gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
                }
                if (explosionState && (explosionState.phase === 'explosion' || explosionState.phase === 'flash')) {
                    const t = explosionState.phase === 'flash' ? (explosionState.flash) : (1 - explosionState.glowBoost);
                    const ringR = Math.max(w, h) * 0.4 * Math.min(1, t * 1.2);
                    const rg = gctx.createRadialGradient(gcx, gcy, ringR * 0.7, gcx, gcy, ringR * 1.1);
                    rg.addColorStop(0, 'transparent'); rg.addColorStop(0.5, `hsla(300, 100%, 80%, ${(1 - t) * 0.7})`); rg.addColorStop(1, 'transparent');
                    gctx.fillStyle = rg; gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
                }
            }
            glowTexture.update();

            // 15. Тряска
            if (explosionState) applyShake(explosionState.shake);
            else if (innerEl && innerEl.style.transform) innerEl.style.transform = '';

            time++;
        });
    })();

    // ---- ФИНАЛЬНЫЕ ЭФФЕКТЫ ----
    function playSoulPourSound() {
        if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return;
        const ctx = initAudioContext();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(1400, now + 2.0);
        gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.07, now + 0.8); gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.1);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 2.2);
        setTimeout(() => {
            try {
                const o2 = ctx.createOscillator(), g2 = ctx.createGain();
                o2.type = 'sine'; o2.frequency.setValueAtTime(270, ctx.currentTime); o2.frequency.exponentialRampToValueAtTime(2100, ctx.currentTime + 1.8);
                g2.gain.setValueAtTime(0.001, ctx.currentTime); g2.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.8); g2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.9);
                o2.connect(g2); g2.connect(ctx.destination); o2.start(ctx.currentTime); o2.stop(ctx.currentTime + 2.0);
            } catch (e) {}
        }, 100);
    }

    function playSoulBurstSound() {
        if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return;
        const ctx = initAudioContext();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const delay = ctx.createDelay(2.0); delay.delayTime.value = 0.28;
        const feedback = ctx.createGain(); feedback.gain.value = 0.58;
        const wetGain = ctx.createGain(); wetGain.gain.value = 0.42;
        const dryGain = ctx.createGain(); dryGain.gain.value = 0.85;
        delay.connect(feedback); feedback.connect(delay); delay.connect(wetGain); wetGain.connect(ctx.destination); dryGain.connect(ctx.destination);
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(1600, now); osc.frequency.exponentialRampToValueAtTime(60, now + 1.2);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.3);
        osc.connect(gain); gain.connect(dryGain); gain.connect(delay); osc.start(now); osc.stop(now + 1.4);
        const sub = ctx.createOscillator(), subGain = ctx.createGain();
        sub.type = 'sine'; sub.frequency.setValueAtTime(38, now); subGain.gain.setValueAtTime(0.22, now); subGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.9);
        sub.connect(subGain); subGain.connect(ctx.destination); sub.start(now); sub.stop(now + 1.0);
        [400, 600, 900, 1200, 1600].forEach((freq, i) => {
            setTimeout(() => {
                try {
                    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
                    o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.00001, t + 0.9);
                    o.connect(g); g.connect(dryGain); g.connect(delay); o.start(t); o.stop(t + 1.0);
                } catch (e) {}
            }, i * 60);
        });
        setTimeout(() => { try { wetGain.disconnect(); delay.disconnect(); feedback.disconnect(); dryGain.disconnect(); } catch(e) {} }, 3000);
    }

    function playFountainShatterSound() {
        if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return;
        const ctx = initAudioContext();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 1.5), buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource(); noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter(); noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1500;
        const noiseGain = ctx.createGain(); noiseGain.gain.setValueAtTime(0.25, now); noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination); noise.start(now);
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now); osc.frequency.linearRampToValueAtTime(30, now + 1.5);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 2.1);
    }

    function triggerSoulPour() {
        finaleMode = 1; finaleStartTime = performance.now(); finaleBoost = 0;
        modal.classList.add('dt-finale');
        const pourEl = document.getElementById('dt-soul-pour');
        if (pourEl) pourEl.classList.add('active');
        playSoulPourSound();
    }

    function triggerSoulBurst() {
        finaleMode = 2;
        if (window.__dtStartExplosion) window.__dtStartExplosion();
        if (window.__dtShatterFountain) window.__dtShatterFountain();
        const flashEl = document.getElementById('dt-magic-flash');
        if (flashEl) { flashEl.classList.remove('active'); void flashEl.offsetWidth; flashEl.classList.add('active'); }
        const innerEl = modal.querySelector('.dt-inner');
        if (innerEl) { innerEl.classList.remove('rgb-glitching'); void innerEl.offsetWidth; innerEl.classList.add('rgb-glitching'); setTimeout(() => innerEl.classList.remove('rgb-glitching'), 420); }
        playSoulBurstSound(); playFountainShatterSound();
    }

    function playFinalAcceptance() {
        triggerSoulBurst();
        dialogue.style.transition = 'opacity 1s ease'; dialogue.style.opacity = '0';
        setTimeout(() => {
            const overlay = document.getElementById('dt-accept-overlay');
            if (overlay) overlay.classList.add('visible');
        }, 1500);
        setTimeout(() => {
            const overlay = document.getElementById('dt-accept-overlay');
            if (overlay) overlay.classList.add('fade-out');
        }, 6000);
        setTimeout(() => { closeModal(); }, 9000);
    }

    function resetFinale() {
        finaleMode = 0; finaleBoost = 0; finaleStartTime = 0;
        modal.classList.remove('dt-finale');
        const pourEl = document.getElementById('dt-soul-pour'); if (pourEl) pourEl.classList.remove('active');
        const flashEl = document.getElementById('dt-magic-flash'); if (flashEl) flashEl.classList.remove('active');
        if (window.__dtResetCanvas) window.__dtResetCanvas();
    }

    // ---- МУЗЫКА ----
    const MUSIC_URL = 'sounds/ANOTHER_HIM.ogg', MUSIC_VOLUME = 0.25, SPIN_UP_TIME = 2.0, START_RATE = 0.5, VOLUME_RAMP = 1.2;
    let dtMusicSource = null, dtMusicGain = null, dtMusicBuffer = null, dtMusicLoading = false, dtMusicFadeTimeout = null, dtMusicElement = null, dtMusicFadeInterval = null, dtMusicSpinInterval = null;

    async function tryLoadMusicBuffer() {
        if (dtMusicBuffer) return dtMusicBuffer;
        if (dtMusicLoading) return null;
        if (location.protocol === 'file:') return null; 
        dtMusicLoading = true;
        try {
            const ctx = initAudioContext(); if (!ctx) { dtMusicLoading = false; return null; }
            const res = await fetch(MUSIC_URL); if (!res.ok) throw new Error('HTTP ' + res.status);
            const ab = await res.arrayBuffer();
            dtMusicBuffer = await ctx.decodeAudioData(ab);
            dtMusicLoading = false;
            return dtMusicBuffer;
        } catch (e) {
            console.warn('[MUSIC] Web Audio не удался:', e.message);
            dtMusicLoading = false; return null;
        }
    }

    function startMusicElement() {
        if (dtMusicElement) return;
        try {
            dtMusicElement = new Audio(MUSIC_URL); dtMusicElement.loop = true;
            try { dtMusicElement.preservesPitch = false; dtMusicElement.mozPreservesPitch = false; dtMusicElement.webkitPreservesPitch = false; } catch (e) {}
            dtMusicElement.playbackRate = START_RATE; dtMusicElement.volume = 0;
            const startSpin = () => {
                const t0 = performance.now();
                if (dtMusicSpinInterval) clearInterval(dtMusicSpinInterval);
                dtMusicSpinInterval = setInterval(() => {
                    if (!dtMusicElement) { clearInterval(dtMusicSpinInterval); dtMusicSpinInterval = null; return; }
                    const elapsed = performance.now() - t0, p = Math.min(1, elapsed / (SPIN_UP_TIME * 1000)), eased = 1 - Math.pow(1 - p, 3);
                    dtMusicElement.playbackRate = START_RATE + (1.0 - START_RATE) * eased;
                    const vp = Math.min(1, elapsed / (VOLUME_RAMP * 1000)); dtMusicElement.volume = MUSIC_VOLUME * vp;
                    if (p >= 1 && vp >= 1) { clearInterval(dtMusicSpinInterval); dtMusicSpinInterval = null; dtMusicElement.playbackRate = 1.0; dtMusicElement.volume = MUSIC_VOLUME; }
                }, 30);
            };
            const p = dtMusicElement.play();
            if (p && p.then) p.then(startSpin).catch(() => {
                const retry = () => { if (dtMusicElement) dtMusicElement.play().then(startSpin).catch(() => {}); document.removeEventListener('pointerdown', retry); document.removeEventListener('keydown', retry); };
                document.addEventListener('pointerdown', retry, { once: true }); document.addEventListener('keydown', retry, { once: true });
            }); else startSpin();
        } catch (e) { console.error('[MUSIC] <audio> ошибка:', e.message); }
    }

    async function startMusic() {
        if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return;
        if (dtMusicSource || dtMusicElement) return;
        const buffer = await tryLoadMusicBuffer();
        if (buffer) {
            const ctx = initAudioContext(); if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            if (dtMusicSource) return;
            const now = ctx.currentTime;
            dtMusicSource = ctx.createBufferSource(); dtMusicSource.buffer = buffer; dtMusicSource.loop = true; dtMusicSource.loopStart = 0; dtMusicSource.loopEnd = buffer.duration;
            try { dtMusicSource.preservesPitch = false; } catch (e) {}
            dtMusicSource.playbackRate.setValueAtTime(START_RATE, now); dtMusicSource.playbackRate.linearRampToValueAtTime(1.0, now + SPIN_UP_TIME);
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(600, now); filter.frequency.exponentialRampToValueAtTime(20000, now + SPIN_UP_TIME); filter.Q.value = 0.5;
            dtMusicGain = ctx.createGain(); dtMusicGain.gain.setValueAtTime(0.001, now); dtMusicGain.gain.exponentialRampToValueAtTime(MUSIC_VOLUME, now + VOLUME_RAMP);
            dtMusicSource.connect(filter); filter.connect(dtMusicGain); dtMusicGain.connect(ctx.destination); dtMusicSource.start(0);
        } else startMusicElement();
    }

    function stopMusic() {
        if (dtMusicSource) {
            const ctx = initAudioContext(), source = dtMusicSource, gain = dtMusicGain;
            dtMusicSource = null; dtMusicGain = null;
            if (ctx && gain) {
                const now = ctx.currentTime, startVol = gain.gain.value || MUSIC_VOLUME;
                gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(startVol, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                if (dtMusicFadeTimeout) clearTimeout(dtMusicFadeTimeout);
                dtMusicFadeTimeout = setTimeout(() => { try { source.stop(); source.disconnect(); gain.disconnect(); } catch (e) {} }, 650);
            } else { try { source.stop(); } catch (e) {} }
        }
        if (dtMusicElement) {
            if (dtMusicSpinInterval) { clearInterval(dtMusicSpinInterval); dtMusicSpinInterval = null; }
            const el = dtMusicElement; dtMusicElement = null;
            if (dtMusicFadeInterval) clearInterval(dtMusicFadeInterval);
            const startVol = el.volume, steps = 20; let i = 0;
            dtMusicFadeInterval = setInterval(() => {
                i++; el.volume = Math.max(0, startVol * (1 - i / steps));
                if (i >= steps) { clearInterval(dtMusicFadeInterval); dtMusicFadeInterval = null; try { el.pause(); el.currentTime = 0; } catch (e) {} }
            }, 30);
        }
    }

    function playSelect() { if (typeof playSound === 'function') playSound(660, 0.06, 'square', 0.04); }
    function playConfirm() { if (typeof playSound === 'function') { playSound(880, 0.06, 'square', 0.05); setTimeout(() => playSound(1100, 0.08, 'square', 0.04), 50); } }
    function playCancel() { if (typeof playSound === 'function') playSound(330, 0.08, 'square', 0.04); }
    function playTypeSound() { if (typeof soundsEnabled !== 'undefined' && !soundsEnabled) return; if (typeof playSound === 'function') { playSound(600 + Math.random() * 150, 0.025, 'square', 0.015); } }

    // ---- TYPEWRITER ----
    let typeState = null;
    function typeText(el, text, speed, done) {
        if (typeState && typeState.timer) clearTimeout(typeState.timer);
        el.innerHTML = '';
        const words = text.split(/(\s+)/);
        typeState = { el, text, words, wordIndex: 0, charIndex: 0, timer: null, done, currentWordEl: null };
        (function step() {
            if (!typeState || typeState.el !== el) return;
            if (typeState.wordIndex >= typeState.words.length) {
                const d = typeState.done; typeState = null; if (d) d(); return;
            }
            const currentWord = typeState.words[typeState.wordIndex];
            if (typeState.charIndex === 0) {
                const wordSpan = document.createElement('span'); wordSpan.className = 'dt-word';
                el.appendChild(wordSpan); typeState.currentWordEl = wordSpan;
            }
            const ch = currentWord[typeState.charIndex];
            const charSpan = document.createElement('span'); charSpan.className = 'dt-char-pop';
            charSpan.textContent = ch === ' ' ? '\u00A0' : ch;
            typeState.currentWordEl.appendChild(charSpan);
            typeState.charIndex++;
            if (ch !== ' ' && typeState.charIndex % 2 === 0) playTypeSound();
            if (typeState.charIndex >= currentWord.length) { typeState.wordIndex++; typeState.charIndex = 0; }
            typeState.timer = setTimeout(step, speed);
        })();
    }
    function skipTyping() {
        if (!typeState) return;
        if (typeState.timer) clearTimeout(typeState.timer);
        const d = typeState.done; typeState.el.textContent = typeState.text; typeState = null; if (d) d();
    }
    dialogue.addEventListener('click', (e) => { if (typeState && !e.target.closest('button, input, textarea, .dt-file')) skipTyping(); });

    // ---- ОТПРАВКА ----
    function submitFormNative(sendBtn) {
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '...'; }
        const status = document.createElement('div'); status.className = 'dt-status';
        status.textContent = currentLang === 'ru' ? '⏳ Сосуд формируется...' : '⏳ Vessel is forming...';
        dialogue.appendChild(status);

        const form = document.createElement('form');
        form.action = 'https://formsubmit.co/goodmopsreset@gmail.com';
        form.method = 'POST'; form.enctype = 'multipart/form-data'; form.target = 'hidden_iframe'; form.style.display = 'none';

        const fields = {
            '_subject': 'Godoined Archive новая заявка', '_replyto': 'goodmopsreset@gmail.com', '_captcha': 'false',
            'name': state.name || 'Аноним', 'material': state.material, 'food': state.food, 'color': state.color,
            'purpose': state.purpose, 'gift': state.gift, 'fear': state.fear, 'feeling': state.feeling,
            'honest': state.honest, 'pain': state.pain, 'message': state.message
        };
        for (const key in fields) { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = fields[key]; form.appendChild(input); }

        if (state.files && state.files.length > 0) {
            state.files.forEach((file, index) => {
                const fileInput = document.createElement('input'); fileInput.type = 'file';
                fileInput.name = 'attachment' + (index + 1); fileInput.style.display = 'none';
                const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files;
                form.appendChild(fileInput);
            });
        }

        document.body.appendChild(form);
        form.submit();

        setTimeout(() => {
            form.remove(); 
            status.textContent = currentLang === 'ru' ? '✅ Связь установлена. Завершаем ритуал...' : '✅ Connection established. Finishing ritual...';
            playFinalAcceptance();
        }, 2500);
    }

    function sendViaMailto() {
        const subject = encodeURIComponent('Godoined Archive новая заявка');
        const body = encodeURIComponent(
            `Имя: ${state.name || 'Аноним'}\nМатериал: ${state.material}\nЕда: ${state.food}\nЦвет: ${state.color}\n` +
            `Предназначение: ${state.purpose}\nДар: ${state.gift}\nСтрах: ${state.fear}\n` +
            `Чувства: ${state.feeling}\nЧестность: ${state.honest}\nБоль: ${state.pain}\n\n` +
            `Описание:\n${state.message}\n\n---\nПрикрепите референсы к этому письму.`
        );
        window.open(`mailto:goodmopsreset@gmail.com?subject=${subject}&body=${body}`, '_blank');
    }

    // ---- ДИАЛОГ ----
    function clearDialogue() {
        if (typeState && typeState.timer) clearTimeout(typeState.timer);
        typeState = null; dialogue.innerHTML = '';
        if (window.dtKeyHandler) { document.removeEventListener('keydown', window.dtKeyHandler); window.dtKeyHandler = null; }
    }
    const pause = (ms) => new Promise(res => setTimeout(res, ms));

    function speak(text, speed = 35) {
        return new Promise(resolve => {
            const el = document.createElement('div'); el.className = 'dt-question';
            dialogue.appendChild(el); typeText(el, text, speed, resolve);
        });
    }
    function react(text, speed = 28) {
        return new Promise(resolve => {
            const el = document.createElement('div'); el.className = 'dt-reaction';
            dialogue.appendChild(el); typeText(el, text, speed, resolve);
        });
    }

    async function runStep() {
        updateProgress();
        const steps = getSteps();
        if (state.step >= steps.length) { renderSummary(); return; }
        clearDialogue();
        const step = steps[state.step];

        const q = document.createElement('div'); q.className = 'dt-question'; dialogue.appendChild(q);

        typeText(q, step.question, 35, async () => {
            if (step.sub) {
                const sub = document.createElement('div'); sub.className = 'dt-sub';
                sub.textContent = step.sub; dialogue.appendChild(sub);
            }
            await pause(400);
            if (step.type === 'text') renderTextInput(step);
            else if (step.type === 'textarea') renderTextarea(step);
            else if (step.type === 'file') renderFileInput(step);
            else if (step.type === 'choice') renderChoices(step);
            else if (step.type === 'color') renderColorInput(step);
        });
    }

    function renderTextInput(step) {
        const wrap = document.createElement('div'); wrap.className = 'dt-input-wrap';
        const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'dt-input';
        inp.placeholder = step.placeholder || ''; inp.maxLength = step.maxLength || 99; inp.autocomplete = 'off';
        inp.value = state[step.key] || '';
        inp.addEventListener('input', () => { const pos = inp.selectionStart; inp.value = inp.value.toUpperCase(); inp.setSelectionRange(pos, pos); });
        wrap.appendChild(inp);

        const actions = document.createElement('div'); actions.className = 'dt-actions';

        if (step.optional) {
            const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'dt-btn dt-btn-secondary';
            skip.textContent = tDialog('btnSkip');
            skip.addEventListener('click', () => { state[step.key] = ''; playSelect(); goNext(step); });
            actions.appendChild(skip);
        }
        const next = document.createElement('button'); next.type = 'button'; next.className = 'dt-btn';
        next.textContent = tDialog('btnNext');
        next.addEventListener('click', () => { state[step.key] = inp.value.trim().toUpperCase(); playConfirm(); goNext(step); });

        actions.appendChild(next); dialogue.appendChild(wrap); dialogue.appendChild(actions);

        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); next.click(); } });
        setTimeout(() => inp.focus(), 100);
    }

    function renderTextarea(step) {
        const ta = document.createElement('textarea'); ta.className = 'dt-textarea';
        ta.placeholder = step.placeholder || ''; ta.value = state[step.key] || '';

        const actions = document.createElement('div'); actions.className = 'dt-actions';
        const next = document.createElement('button'); next.type = 'button'; next.className = 'dt-btn'; next.textContent = tDialog('btnNext');
        next.addEventListener('click', () => {
            const val = ta.value.trim();
            if (!val) {
                ta.style.borderColor = '#ff4444'; ta.style.boxShadow = '4px 4px 0 #400';
                setTimeout(() => { ta.style.borderColor = ''; ta.style.boxShadow = ''; }, 600);
                ta.focus(); return;
            }
            state[step.key] = val; playConfirm(); goNext(step);
        });
        actions.appendChild(next); dialogue.appendChild(ta); dialogue.appendChild(actions);
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); next.click(); } });
        setTimeout(() => ta.focus(), 100);
    }

    function renderFileInput(step) {
        const inp = document.createElement('input'); inp.type = 'file'; inp.className = 'dt-file'; inp.accept = 'image/*'; inp.multiple = true;

        const actions = document.createElement('div'); actions.className = 'dt-actions';

        if (step.optional) {
            const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'dt-btn dt-btn-secondary';
            skip.textContent = tDialog('btnSkip');
            skip.addEventListener('click', () => { state.files = null; playSelect(); goNext(step); });
            actions.appendChild(skip);
        }
        const next = document.createElement('button'); next.type = 'button'; next.className = 'dt-btn'; next.textContent = tDialog('btnNext');
        next.addEventListener('click', () => {
            if (inp.files && inp.files.length > 0) {
                let total = 0; for (let f of inp.files) total += f.size;
                if (total > MAX_TOTAL_SIZE) {
                    const err = document.createElement('div'); err.className = 'dt-status error';
                    err.textContent = currentLang === 'ru' ? `❌ Слишком большой размер: ${(total / 1024 / 1024).toFixed(1)} МБ (макс 5 МБ)` : `❌ File too large: ${(total / 1024 / 1024).toFixed(1)} MB (max 5 MB)`;
                    dialogue.appendChild(err); return;
                }
                state.files = Array.from(inp.files);
            } else { state.files = null; }
            playConfirm(); goNext(step);
        });
        actions.appendChild(next); dialogue.appendChild(inp); dialogue.appendChild(actions);
    }

    function renderChoices(step) {
        const container = document.createElement('div'); container.className = 'dt-choices'; dialogue.appendChild(container);
        let focusedIdx = step.options.indexOf(state[step.key]); if (focusedIdx < 0) focusedIdx = 0;
        const btns = [];

        function updateFocus(idx) { btns.forEach((b, i) => b.classList.toggle('focused', i === idx)); }
        function selectChoice(idx) { state[step.key] = step.options[idx]; playConfirm(); goNext(step); }

        step.options.forEach((opt, i) => {
            const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dt-choice';
            btn.innerHTML = `<span class="dt-soul-cursor"></span><span>${opt}</span>`;
            btn.addEventListener('click', () => { focusedIdx = i; updateFocus(i); selectChoice(i); });
            btn.addEventListener('mouseenter', () => { focusedIdx = i; updateFocus(i); playSelect(); });
            container.appendChild(btn); btns.push(btn);
        });
        updateFocus(focusedIdx);

        window.dtKeyHandler = (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault(); const dir = e.key === 'ArrowDown' ? 1 : -1;
                focusedIdx = (focusedIdx + dir + btns.length) % btns.length; updateFocus(focusedIdx); playSelect();
            } else if (e.key === 'Enter' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); selectChoice(focusedIdx); }
        };
        document.addEventListener('keydown', window.dtKeyHandler);
    }

    function renderColorInput(step) {
        const wrap = document.createElement('div'); wrap.className = 'dt-color-wrap';
        const colorPicker = document.createElement('input'); colorPicker.type = 'color'; colorPicker.className = 'dt-color-picker'; colorPicker.value = state.colorHex || '#ff00f2';
        const colorNameInput = document.createElement('input'); colorNameInput.type = 'text'; colorNameInput.className = 'dt-input';
        colorNameInput.placeholder = tDialog('colorPlaceholder'); colorNameInput.maxLength = 20;
        colorNameInput.style.textTransform = 'uppercase'; colorNameInput.style.fontSize = '1rem'; colorNameInput.style.marginTop = '10px';
        colorNameInput.value = state.colorName || '';

        const updateColorUI = () => { colorNameInput.style.color = colorPicker.value; colorNameInput.style.textShadow = `0 0 10px ${colorPicker.value}`; colorNameInput.style.borderBottomColor = colorPicker.value; };
        colorPicker.addEventListener('input', updateColorUI); updateColorUI();

        const actions = document.createElement('div'); actions.className = 'dt-actions';
        const next = document.createElement('button'); next.type = 'button'; next.className = 'dt-btn'; next.textContent = tDialog('btnNext');
        next.addEventListener('click', () => {
            state.colorHex = colorPicker.value;
            const customName = colorNameInput.value.trim().toUpperCase();
            state.color = customName || state.colorHex.toUpperCase();
            playConfirm(); goNext(step);
        });

        actions.appendChild(next); wrap.appendChild(colorPicker); wrap.appendChild(colorNameInput); dialogue.appendChild(wrap); dialogue.appendChild(actions);
    }

    async function goNext(step) {
        clearDialogue(); await pause(300);
        let reactionText = step.reaction;
        if (typeof reactionText === 'function') reactionText = reactionText(state);
        if (reactionText) { await react(reactionText); await pause(600); }
        updatePersonality(); state.step++; runStep();
    }

    async function renderSummary() {
        updateProgress(); triggerSoulPour(); clearDialogue(); await speak(tDialog('summaryTitle'));
        const sum = document.createElement('div'); sum.className = 'dt-summary';
        const fileCount = state.files ? state.files.length : 0;
        
        sum.innerHTML = `
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ИМЯ' : 'NAME'}:</span><span class="dt-summary-value">${escapeHtml(state.name || '—')}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'МАТЕРИАЛ' : 'MATERIAL'}:</span><span class="dt-summary-value">${state.material}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ЕДА' : 'FOOD'}:</span><span class="dt-summary-value">${state.food}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ЦВЕТ' : 'COLOR'}:</span><span class="dt-summary-value" style="color: ${state.colorHex || '#fff'}; text-shadow: 0 0 10px ${state.colorHex || '#fff'};">${state.color}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ПРЕДНАЗНАЧЕНИЕ' : 'PURPOSE'}:</span><span class="dt-summary-value">${state.purpose}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ДАР' : 'GIFT'}:</span><span class="dt-summary-value">${state.gift}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'СТРАХ' : 'FEAR'}:</span><span class="dt-summary-value">${state.fear}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ЧУВСТВА' : 'FEELING'}:</span><span class="dt-summary-value">${state.feeling}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ЧЕСТНОСТЬ' : 'HONEST'}:</span><span class="dt-summary-value">${state.honest}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'БОЛЬ' : 'PAIN'}:</span><span class="dt-summary-value">${state.pain}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'ОПИСАНИЕ' : 'DESCRIPTION'}:</span><span class="dt-summary-value">${escapeHtml(state.message).replace(/\n/g, '<br>')}</span></div>
            <div><span class="dt-summary-label">${currentLang === 'ru' ? 'РЕФЕРЕНСЫ' : 'REFERENCES'}:</span><span class="dt-summary-value">${fileCount > 0 ? fileCount + (currentLang === 'ru' ? ' файл(ов)' : ' file(s)') : '—'}</span></div>
        `;
        dialogue.appendChild(sum); await pause(300);

        const q2 = document.createElement('div'); q2.className = 'dt-reaction'; dialogue.appendChild(q2);
        await new Promise(res => typeText(q2, tDialog('summarySure'), 28, res));
        await pause(300);

        const actions = document.createElement('div'); actions.className = 'dt-actions';

        const back = document.createElement('button'); back.type = 'button'; back.className = 'dt-btn dt-btn-secondary';
        back.textContent = tDialog('btnBack');
        back.addEventListener('click', () => { state.step = getSteps().length - 1; playCancel(); runStep(); });

        const send = document.createElement('button'); send.type = 'button'; send.className = 'dt-btn'; send.id = 'dt-send';
        send.textContent = tDialog('btnSend');
        send.addEventListener('click', () => submitFormNative(send));

        const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'dt-btn dt-btn-secondary'; alt.id = 'dt-alt-send';
        alt.style.display = 'inline-block'; alt.textContent = tDialog('btnMail'); alt.addEventListener('click', sendViaMailto);

        actions.appendChild(back); actions.appendChild(send); actions.appendChild(alt); dialogue.appendChild(actions);
    }

    openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
})();

// ============================================================
//  ЖИВОЙ РЕТРО-СЛОЙ
// ============================================================
window.RETRO = (function () {
    const LS = { visits: 'retro-visits', opens: 'retro-opens', openedNames: 'retro-opened-names', sound: 'retro-sound' };

    function lsGet(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; } }
    function lsSet(key, value) { try { localStorage.setItem(key, String(value)); } catch (e) {} }
    function lsGetJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
    function lsSetJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

    function toast(title, text) {
        const box = document.getElementById('toast-container'); if (!box) return;
        const el = document.createElement('div'); el.className = 'toast';
        const t = document.createElement('span'); t.className = 'toast-title'; t.textContent = title;
        const b = document.createElement('span'); b.textContent = text;
        el.appendChild(t); el.appendChild(b); box.appendChild(el); playToastSound();
        while (box.children.length > 4) box.removeChild(box.firstChild);
        setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 4200);
    }

    const clockEl = document.getElementById('hud-clock'), fpsEl = document.getElementById('hud-fps'), uptimeEl = document.getElementById('footer-uptime'), bootTime = Date.now();
    function pad(n) { return String(n).padStart(2, '0'); }

    function tickClock() {
        const d = new Date();
        if (clockEl) clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        if (uptimeEl) {
            const s = Math.floor((Date.now() - bootTime) / 1000);
            uptimeEl.textContent = (currentLang === 'ru' ? 'АПТАЙМ: ' : 'UPTIME: ') + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
        }
    }
    setInterval(tickClock, 1000); tickClock();

    let frames = 0, lastFpsTs = performance.now();
    (function fpsLoop(now) {
        frames++;
        if (now - lastFpsTs >= 1000) {
            if (fpsEl) fpsEl.textContent = Math.round((frames * 1000) / (now - lastFpsTs)) + ' FPS';
            frames = 0; lastFpsTs = now;
        }
        requestAnimationFrame(fpsLoop);
    })(performance.now());

    const soundBtn = document.getElementById('sound-toggle');
    function applySoundState() {
        if (!soundBtn) return;
        soundBtn.textContent = soundsEnabled ? '🔊' : '🔇';
        soundBtn.title = soundsEnabled ? (currentLang === 'ru' ? 'Звук: вкл (нажми, чтобы выкл)' : 'Sound: on (click to mute)') : (currentLang === 'ru' ? 'Звук: выкл (нажми, чтобы вкл)' : 'Sound: off (click to unmute)');
    }
    if (lsGet(LS.sound, '1') === '0') soundsEnabled = false;
    applySoundState();
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            soundsEnabled = !soundsEnabled; lsSet(LS.sound, soundsEnabled ? '1' : '0'); applySoundState();
            if (soundsEnabled) { playClickSound(); toast(currentLang === 'ru' ? 'ЗВУК' : 'SOUND', currentLang === 'ru' ? 'Звуковые эффекты включены' : 'Sound effects on'); }
            else { toast(currentLang === 'ru' ? 'ЗВУК' : 'SOUND', currentLang === 'ru' ? 'Звуковые эффекты выключены' : 'Sound effects off'); }
            updateTicker();
        });
    }

    function archiveStats() {
        const models = allModels.length; let renders = 0, videos = 0;
        allModels.forEach(m => { renders += (m.renders || []).length; videos += (m.videos || []).length; });
        return { models, renders, videos };
    }

    function animateCount(el, target) {
        if (!el) return;
        const start = parseInt(el.textContent, 10) || 0;
        if (start === target) { el.textContent = target; return; }
        const dur = 900, t0 = performance.now();
        (function step(now) {
            const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }

    const LEVELS = [ { min: 0, name: 'НОВИЧОК', en: 'NOVICE' }, { min: 5, name: 'ИССЛЕДОВАТЕЛЬ', en: 'EXPLORER' }, { min: 15, name: 'ХРАНИТЕЛЬ АРХИВА', en: 'ARCHIVE KEEPER' }, { min: 30, name: 'ЛЕГЕНДА АРХИВА', en: 'ARCHIVE LEGEND' } ];
    function levelFor(opens) {
        let cur = LEVELS[0]; LEVELS.forEach(l => { if (opens >= l.min) cur = l; });
        const next = LEVELS.find(l => l.min > opens);
        return { name: currentLang === 'ru' ? cur.name : cur.en, next: next ? { min: next.min, name: currentLang === 'ru' ? next.name : next.en } : null };
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
        const lvlEl = document.getElementById('cp-level'), nextEl = document.getElementById('cp-next');
        if (lvlEl) lvlEl.textContent = (currentLang === 'ru' ? '>> УРОВЕНЬ: ' : '>> LEVEL: ') + lvl.name;
        if (nextEl) {
            nextEl.textContent = lvl.next
                ? (currentLang === 'ru' ? '>> СЛЕД. ЧЕКПОИНТ: ' : '>> NEXT CHECKPOINT: ') + lvl.next.name + (currentLang === 'ru' ? ' ЧЕРЕЗ ' : ' IN ') + (lvl.next.min - opens)
                : (currentLang === 'ru' ? '>> ВСЕ ЧЕКПОИНТЫ ПОЛУЧЕНЫ' : '>> ALL CHECKPOINTS RECEIVED');
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
        const fanfare = () => { if (typeof playAchievementSound === 'function') playAchievementSound(); };
        if (opens === 1) {
            toast(currentLang === 'ru' ? 'CHECKPOINT #1' : 'CHECKPOINT #1', currentLang === 'ru' ? 'Первое открытие модели — архив изучается!' : 'First model opened — archive is being explored!');
            setTimeout(fanfare, 350);
        } else if (isNew && names.length >= s.models && s.models > 0) {
            toast(currentLang === 'ru' ? 'ДОСТИЖЕНИЕ' : 'ACHIEVEMENT', currentLang === 'ru' ? 'Все модели архива просмотрены! Ты хранитель.' : 'All models viewed! You are the keeper.');
            setTimeout(fanfare, 350);
        } else if (opens % 10 === 0) {
            toast('CHECKPOINT #' + opens, (currentLang === 'ru' ? 'Моделей открыто: ' : 'Models opened: ') + opens + (currentLang === 'ru' ? '. Продолжай в том же духе!' : '. Keep it up!'));
            setTimeout(fanfare, 350);
        }
    }

    const tickerTrack = document.getElementById('ticker-track');
    function updateTicker() {
        if (!tickerTrack) return;
        const s = archiveStats();
        const visits = lsGet(LS.visits, '0');
        const sound = soundsEnabled ? (currentLang === 'ru' ? 'ЗВУК ВКЛ' : 'SOUND ON') : (currentLang === 'ru' ? 'ЗВУК ВЫКЛ' : 'SOUND OFF');
        let msg = '';
        if (currentLang === 'ru') {
            msg = 'АРХИВ 3D МОДЕЛЕЙ // В АРХИВЕ ' + s.models + ' МОДЕЛЕЙ, ' + s.renders + ' РЕНДЕРОВ И ' + s.videos + ' ВИДЕО // ТЫ ЗДЕСЬ БЫЛ ' + visits + ' РАЗ // ' + sound + ' // НОВЫЕ МОДЕЛИ ДОБАВЛЯЮТСЯ // ';
        } else {
            msg = '3D MODEL ARCHIVE // ARCHIVE CONTAINS ' + s.models + ' MODELS, ' + s.renders + ' RENDERS AND ' + s.videos + ' VIDEOS // YOU WERE HERE ' + visits + ' TIMES // ' + sound + ' // NEW MODELS ADDED // ';
        }
        tickerTrack.innerHTML = '';
        for (let i = 0; i < 2; i++) { const seg = document.createElement('span'); seg.className = 'ticker-seg'; seg.textContent = msg; tickerTrack.appendChild(seg); }
    }

    const visits = (parseInt(lsGet(LS.visits, '0'), 10) || 0) + 1;
    lsSet(LS.visits, visits);

    const consolePanel = document.getElementById('console-panel'), consoleToggle = document.getElementById('console-toggle'), consoleClose = document.getElementById('console-close');
    function setConsoleVisible(visible) {
        if (!consolePanel) return;
        consolePanel.classList.toggle('visible', visible);
        if (consoleToggle) consoleToggle.classList.toggle('console-on', visible);
        if (visible && typeof window.__CONSOLE_RENDER__ === 'function') window.__CONSOLE_RENDER__();
    }
    if (consoleToggle) consoleToggle.addEventListener('click', () => { playClickSound(); setConsoleVisible(!consolePanel.classList.contains('visible')); });
    if (consoleClose) consoleClose.addEventListener('click', () => setConsoleVisible(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === 'ё' || e.key === '~') {
            if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
            e.preventDefault(); playClickSound(); setConsoleVisible(!consolePanel.classList.contains('visible'));
        }
        if (e.key === 'Escape' && consolePanel && consolePanel.classList.contains('visible')) setConsoleVisible(false);
    });

    const glitchEl = document.querySelector('.glitch-title'), flashEl = document.getElementById('glitch-flash');
    function randomGlitch() {
        if (glitchEl) { glitchEl.classList.add('glitching'); setTimeout(() => glitchEl.classList.remove('glitching'), 320); }
        if (flashEl && Math.random() < 0.6) { flashEl.classList.add('active'); setTimeout(() => flashEl.classList.remove('active'), 380); }
        setTimeout(randomGlitch, 4000 + Math.random() * 7000);
    }
    setTimeout(randomGlitch, 3000);

    let lastPixel = 0;
    document.addEventListener('mousemove', (e) => {
        const now = performance.now(); if (now - lastPixel < 70) return; lastPixel = now;
        const p = document.createElement('div'); p.className = 'cursor-pixel';
        p.style.left = (e.clientX - 3) + 'px'; p.style.top = (e.clientY - 3) + 'px';
        document.body.appendChild(p); setTimeout(() => p.remove(), 620);
    }, { passive: true });

    function onReady() {
        refreshStats(); updateTicker();
        toast(currentLang === 'ru' ? 'АРХИВ ЗАГРУЖЕН' : 'ARCHIVE LOADED', (currentLang === 'ru' ? 'В системе ' : 'System contains ') + allModels.length + (currentLang === 'ru' ? ' моделей. Осмотрись!' : ' models. Look around!'));
    }
    let readyFired = false, readyAttempts = 0;
    (function waitModels() {
        if (allModels.length > 0) { if (!readyFired) { readyFired = true; onReady(); } }
        else if (readyAttempts++ < 40) setTimeout(waitModels, 400);
    })();

    const verEl = document.getElementById('footer-version');
    if (verEl && typeof APP_VERSION !== 'undefined') verEl.textContent = (currentLang === 'ru' ? 'ВЕРСИЯ: ' : 'VERSION: ') + APP_VERSION;

    return { toast, refreshStats, recordOpen, updateTicker };
})();

// ============================================================
//  SHARE — ССЫЛКА НА МОДЕЛЬ (ИМЯ + ОПИСАНИЕ + ПРЕВЬЮ)
// ============================================================
(function initShareSystem() {
    // Кэш открытой ссылки — для кнопки "Копировать" внутри карточки
    let currentSharedUrl = '';

    // ---- Сжатие превью до 400×400 ----
    function makeShareThumbnail(src, maxSize = 400, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // crossOrigin не ставим — картинки локальные (та же origin)
            img.onload = () => {
                try {
                    const w0 = img.naturalWidth || img.width;
                    const h0 = img.naturalHeight || img.height;
                    if (!w0 || !h0) return reject(new Error('0×0 image'));

                    const ratio = Math.min(maxSize / w0, maxSize / h0, 1);
                    const w = Math.max(1, Math.round(w0 * ratio));
                    const h = Math.max(1, Math.round(h0 * ratio));

                    const c = document.createElement('canvas');
                    c.width = w;
                    c.height = h;
                    c.getContext('2d').drawImage(img, 0, 0, w, h);

                    let url = c.toDataURL('image/webp', quality);
                    if (!url.startsWith('data:image/webp')) {
                        url = c.toDataURL('image/jpeg', quality);
                    }
                    resolve(url);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error('load failed'));
            img.src = src;
        });
    }

    // ---- Сбор данных модели ----
    async function buildShareData(model) {
        const data = {
            n: model.displayName || model.name || 'Без имени',
            d: model.description || '',
            t: (model.tags || []).map(t => typeof t === 'string' ? { name: t } : t)
        };
        if (model.nsfw) data.f = 1;
        if (model.comingSoon) data.cs = 1;

        // Пытаемся получить миниатюру превью
        const imgSrc = model.preview || (model.name ? `models/${model.name}/icon.webp` : '');
        if (imgSrc) {
            try {
                data.i = await makeShareThumbnail(imgSrc, 400, 0.7);
            } catch (e) {
                console.warn('[SHARE] Thumbnail failed:', e);
                // Fallback — путь строкой (не встроен в base64)
                data.ip = imgSrc;
            }
        }
        return data;
    }

    // ---- Base64url кодирование (UTF-8 safe) ----
    function encodeShare(data) {
        const bytes = new TextEncoder().encode(JSON.stringify(data));
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function decodeShare(str) {
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return JSON.parse(new TextDecoder().decode(bytes));
    }

    // ---- Toast через существующий элемент ----
    function shareToast(text) {
        const msg = document.getElementById('share-message');
        if (!msg) return;
        const orig = msg.textContent;
        msg.textContent = text;
        msg.style.display = 'inline-block';
        clearTimeout(shareToast._t);
        shareToast._t = setTimeout(() => {
            msg.style.display = 'none';
            msg.textContent = orig;
        }, 2500);
    }

    // ---- Главная функция: поделиться моделью ----
    async function shareModel(model) {
        if (!model) return;
        try { playShareSound(); } catch (e) {}

        try {
            const data = await buildShareData(model);
            const url = location.origin + location.pathname + '#share=' + encodeShare(data);
            const kb = Math.round(url.length / 1024);

            console.log('[SHARE] URL length:', url.length, 'chars (~' + kb + 'KB)');

            if (url.length > 60000) {
                const ok = confirm(
                    `Ссылка получается длинной (${kb} КБ).\n` +
                    `Firefox и старый Safari могут её не открыть.\n\nПродолжить?`
                );
                if (!ok) return;
            }

            // Мобилки — нативный share
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: data.n,
                        text: (data.d || '').replace(/\[[^\]]+\]/g, '').substring(0, 200),
                        url
                    });
                    shareToast('Ссылка отправлена!');
                    return;
                } catch (e) {
                    if (e.name === 'AbortError') return;
                    console.warn('[SHARE] navigator.share failed:', e);
                }
            }

            // Десктоп — в буфер
            try {
                await navigator.clipboard.writeText(url);
                shareToast(`Ссылка скопирована (${kb} КБ)`);
            } catch (e) {
                prompt('Скопируйте ссылку:', url);
            }
        } catch (e) {
            console.error('[SHARE] error:', e);
            shareToast('Ошибка: ' + e.message);
        }
    }

    // ---- Показ карточки по ссылке ----
    function showSharedCard(data) {
        const modal = document.getElementById('shared-model-modal');
        if (!modal) {
            console.error('[SHARE] #shared-model-modal не найден');
            return;
        }

        document.getElementById('shared-name').textContent = data.n || 'Без имени';

        // Теги
        document.getElementById('shared-tags').innerHTML = (data.t || []).map(tag => {
            const name = typeof tag === 'string' ? tag : (tag.name || '');
            const color = typeof tag === 'string' ? null : tag.color;
            let style = '';
            let cls = '';
            if (color === 'rainbow') cls = 'rainbow-text';
            else if (color) style = ` style="color:${color}; border-color:${color}; background:rgba(0,0,0,0.5);"`;
            return `<span class="tag ${cls}"${style}>${escapeHtml(name)}</span>`;
        }).join('');

        // Бейджи
        const badges = document.getElementById('shared-badges');
        badges.innerHTML = '';
        if (data.f) badges.innerHTML += '<span class="tag" style="color:var(--danger);border-color:var(--danger);background:rgba(255,0,0,0.15);font-weight:bold;">18+</span>';
        if (data.cs) badges.innerHTML += '<span class="tag" style="color:#888;border-color:#888;background:rgba(0,0,0,0.3);">SOON</span>';

        // Описание
        document.getElementById('shared-desc').innerHTML =
            parseBBCode(data.d || '').replace(/\n/g, '<br>');

        // Превью
        const imgEl = document.getElementById('shared-preview-img');
        const imgSrc = data.i || data.ip || '';
        if (imgSrc) {
            imgEl.src = imgSrc;
            imgEl.onerror = () => { imgEl.src = 'https://placehold.co/400x400?text=NO+PREVIEW'; };
        } else {
            imgEl.src = 'https://placehold.co/400x400?text=NO+PREVIEW';
        }

        // Кнопка "Копировать ссылку" внутри карточки
        const copyBtn = document.getElementById('shared-copy-btn');
        if (copyBtn) {
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(currentSharedUrl || location.href);
                    try { playShareSound(); } catch (e) {}
                    shareToast('Ссылка скопирована!');
                } catch (e) {
                    prompt('Скопируйте ссылку:', currentSharedUrl || location.href);
                }
            };
        }

        try { playModalOpenSound(); } catch (e) {}
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
        document.body.style.overflow = 'hidden';
    }

    function closeSharedModal() {
        const modal = document.getElementById('shared-model-modal');
        if (!modal) return;
        try { playModalCloseSound(); } catch (e) {}
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        // Чистим hash, чтобы F5 не открыл карточку снова
        if (location.hash.startsWith('#share=')) {
            history.replaceState(null, '', location.pathname + location.search);
        }
        currentSharedUrl = '';
    }

    // ---- Проверка входящей ссылки ----
    function handleSharedLink() {
        if (!location.hash.startsWith('#share=')) return false;
        try {
            const raw = location.hash.substring(7);
            const data = decodeShare(raw);
            currentSharedUrl = location.href;
            showSharedCard(data);
            return true;
        } catch (e) {
            console.error('[SHARE] decode failed:', e);
            alert('Ссылка повреждена или несовместима с текущей версией сайта.');
            history.replaceState(null, '', location.pathname + location.search);
            return false;
        }
    }

    // ---- Публичный API ----
    window.shareModel = shareModel;
    window.handleSharedLink = handleSharedLink;

    // ---- Закрытие модалки ----
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('shared-model-modal');
        if (!modal) return;

        document.getElementById('shared-model-close')?.addEventListener('click', closeSharedModal);
        document.getElementById('shared-model-overlay')?.addEventListener('click', closeSharedModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeSharedModal();
            }
        });
    });
})();

// ============================================================
//  HOT RELOAD (ОТКЛЮЧЕН ДЛЯ file://)
// ============================================================
(function initHotReload() {
    if (location.protocol === 'file:') {
        console.log('[GODOINED ARCHIVE] Hot-reload отключён (страница открыта через file://)');
        return;
    }
    const FILES = ['index.html', 'style.css', 'script.js', 'models_list.json', 'version.js'];
    const CHECK_MS = 2500;
    let baseline = null, checking = false;
    const host = location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
    const devOverride = /(?:\?|&)dev(?:[=&]|$)/.test(location.search);
    if (!isLocal && !devOverride) { console.log('[GODOINED ARCHIVE] Hot-reload выключен на проде (включить: ?dev в адресе)'); return; }

    function hashText(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
        return h.toString(16);
    }
    async function snapshot() {
        const parts = [];
        for (const file of FILES) {
            try {
                const res = await fetch(file + '?_t=' + Date.now(), { cache: 'no-store' });
                parts.push(file + ':' + (res.ok ? hashText(await res.text()) : 'ERR' + res.status));
            } catch (e) { parts.push(file + ':NA'); }
        }
        return parts.join('|');
    }
    async function check() {
        if (checking) return; checking = true;
        try {
            const snap = await snapshot();
            if (baseline === null) baseline = snap;
            else if (snap !== baseline) {
                console.log('[GODOINED ARCHIVE] Обнаружены изменения в файлах — перезагрузка...');
                if (window.RETRO && window.RETRO.toast) window.RETRO.toast('ОБНОВЛЕНИЕ', 'Файлы изменились — страница перезагружается...');
                setTimeout(() => location.reload(), 600); return;
            }
        } catch (e) { } finally { checking = false; }
    }
    function busy() {
        const modal = document.getElementById('render-modal');
        const order = document.getElementById('order-modal');
        const active = document.activeElement;
        const typing = active && /INPUT|TEXTAREA|SELECT/.test(active.tagName);
        return (modal && modal.style.display === 'flex') || (order && order.style.display === 'flex') || typing;
    }
    async function tick() { if (!busy()) await check(); setTimeout(tick, CHECK_MS); }
    setTimeout(tick, CHECK_MS);
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К')) { e.preventDefault(); location.reload(); }
    });
})();