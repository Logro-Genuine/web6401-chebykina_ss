const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const port = Number(process.env.PORT || 3000);
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
};
const pages = new Set(['index.html', 'course.html', 'lesson.html', 'profile.html', 'results.html']);

function sendJson(response, status, data) {
    response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'});
    response.end(JSON.stringify(data));
}

// принимает заявки, сохранения в бд нет
const server = http.createServer(async (request, response) => {
    try {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (pathname === '/api/applications') {
            if (request.method !== 'POST') {
                response.setHeader('Allow', 'POST');
                return sendJson(response, 405, {message: 'Используй POST.'});
            }
            if (!request.headers['content-type']?.startsWith('application/json')) {
                return sendJson(response, 415, {message: 'Ожидается JSON.'});
            }
            let body = '';
            request.setEncoding('utf8');
            for await (const chunk of request) {
                body += chunk;
                if (Buffer.byteLength(body) > 4096) {
                    return sendJson(response, 413, {message: 'Заявка слишком большая.'});
                }
            }
            let data;
            try {
                data = JSON.parse(body);
            } catch {
                return sendJson(response, 400, {message: 'Неверный JSON.'});
            }
            if (
                !data || typeof data.name !== 'string' ||
                data.name.trim().length < 2 || data.name.length > 80 ||
                typeof data.email !== 'string' || data.email.length > 120 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
                !['html', 'css', 'python'].includes(data.course) ||
                data.consent !== true
            ) {
                return sendJson(response, 400, {message: 'Проверь поля заявки.'});
            }
            return sendJson(response, 201, {
                message: 'Заявка принята учебным сервером. Спасибо за интерес к курсу!',
            });
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.setHeader('Allow', 'GET, HEAD');
            return sendJson(response, 405, {message: 'Метод не поддерживается.'});
        }
        const file = pathname === '/' ? 'index.html' : pathname.slice(1);
        const isAsset = /^(css|js|images)\/[a-zA-Z0-9_-]+\.(css|js|png|jpg)$/.test(file);
        if (!pages.has(file) && !isAsset) {
            return sendJson(response, 404, {message: 'Страница не найдена.'});
        }
        const content = await fs.readFile(path.join(__dirname, file));
        response.writeHead(200, {'Content-Type': contentTypes[path.extname(file)]});
        response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
        sendJson(response, error.code === 'ENOENT' ? 404 : 500, {
            message: error.code === 'ENOENT' ? 'Файл не найден.' : 'Ошибка сервера.',
        });
    }
});

server.listen(port, '127.0.0.1', () => {
    console.log(`ЛЮМЕНАР: http://localhost:${port}`);
});
