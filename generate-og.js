const fs = require('fs');
const path = require('path');

// Базовый URL (передается из GitHub Actions)
const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '') + '/';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';

console.log('=== НАЧАЛО ГЕНЕРАЦИИ ===');
console.log('Базовый URL:', BASE_URL);

try {
    // Читаем JSON
    const models = JSON.parse(fs.readFileSync('models_list.json', 'utf8'));
    console.log('Найдено моделей:', models.length);

    models.forEach(model => {
        const name = model.name;
        if (!name) return;

        const displayName = model.displayName || name;
        const description = model.description || '';
        const preview = model.preview || `models/${name}/icon.webp`;

        const imageUrl = `${BASE_URL}${preview.replace(/^\//, '')}`;
        const pageUrl = `${BASE_URL}model/${name}/`;

        const escapeHtml = (str = '') => str.replace(/[&<>"]/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
        }[m]));

        const plainDescription = description.replace(/\[.*?\]/g, '').substring(0, 160);

        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(displayName)} — 3D модель</title>
    <meta property="og:site_name" content="GODOINED ARCHIVE">
    <meta property="og:title" content="${escapeHtml(displayName)}">
    <meta property="og:description" content="${escapeHtml(plainDescription)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(displayName)}">
    <meta name="twitter:description" content="${escapeHtml(plainDescription)}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="theme-color" content="#a32d99">
    <script>
        location.replace('${BASE_URL}?model=${encodeURIComponent(name)}');
    </script>
    <noscript>
        <meta http-equiv="refresh" content="0; url=${BASE_URL}?model=${encodeURIComponent(name)}">
    </noscript>
</head>
<body></body>
</html>`;

        // ВОТ ЗДЕСЬ СОЗДАЕТСЯ ПАПКА model
        const dir = path.join(OUTPUT_DIR, 'model', name);
        console.log(`Создаю папку: ${dir}`);
        
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
        
        console.log(`✅ Успешно: model/${name}/index.html`);
    });

    console.log('=== ГЕНЕРАЦИЯ ЗАВЕРШЕНА ===');
} catch (e) {
    console.error('❌ ОШИБКА:', e);
    process.exit(1);
}