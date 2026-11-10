// scripts/generate-og.js
const fs = require('fs');
const path = require('path');

// Базовый URL сайта на GitHub Pages (передаётся из workflow)
const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '') + '/';

// Читаем список моделей
const models = JSON.parse(fs.readFileSync('models_list.json', 'utf8'));

// Папка, куда будем генерировать страницы (совпадает с той, что деплоится)
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';

models.forEach(model => {
    const { name, displayName, description, preview } = model;
    if (!name) return;

    // Формируем абсолютный URL для картинки
    const previewPath = preview || `models/${name}/icon.webp`;
    const imageUrl = `${BASE_URL}${previewPath.replace(/^\//, '')}`;
    const pageUrl = `${BASE_URL}model/${name}/`;

    // Экранируем спецсимволы для безопасности
    const escapeHtml = (str = '') => str.replace(/[&<>"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    }[m]));

    // Убираем BB-код из описания для соцсетей (опционально)
    const plainDescription = (description || '').replace(/\[.*?\]/g, '').substring(0, 160);

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(displayName || name)} — 3D модель</title>

    <!-- Open Graph (Discord, Telegram, VK и др.) -->
    <meta property="og:title" content="${escapeHtml(displayName || name)}">
    <meta property="og:description" content="${escapeHtml(plainDescription)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(displayName || name)}">
    <meta name="twitter:description" content="${escapeHtml(plainDescription)}">
    <meta name="twitter:image" content="${imageUrl}">

    <!-- Мгновенный редирект на главную с параметром model -->
    <script>
        location.replace('${BASE_URL}?model=${encodeURIComponent(name)}');
    </script>
    <noscript>
        <meta http-equiv="refresh" content="0; url=${BASE_URL}?model=${encodeURIComponent(name)}">
    </noscript>
</head>
<body></body>
</html>`;

    // Создаём папку model/name и записываем файл
    const dir = path.join(OUTPUT_DIR, 'model', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`✅ Сгенерирована страница: model/${name}/index.html`);
});

console.log('🎉 Все страницы для соцсетей готовы!');