var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js')
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var cookie = require('cookie');

function authIsOwner(request, response) {
    var isOwner = false;
    var cookies = {};
    if (request.headers.cookie) {
        cookies = cookie.parse(request.headers.cookie);
    }
    if (cookies.email === 'yorez' && cookies.password === '1111') {
        isOwner = true;
    }
    return isOwner;
}

function authStatusUI(request, response) {
    var authStatusUI = '<a href="/login">login</a>';
    if (authIsOwner(request, response)) {
        authStatusUI = '<a href="/logout_process">logout</a>';
    }
    return authStatusUI;
}

var app = http.createServer(function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if (pathname === '/') {
        if (queryData.id === undefined) {
            fs.readdir('./data', function (error, filelist) {
                var title = 'WELCOME';
                var description = 'make coding with node.js!!';
                var list = template.List(filelist);
                var html = template.HTML(title, list, description,
                    `<a href="/create">CREATE</a>`, authStatusUI(request, response));
                response.writeHead(200);
                response.end(html);
            });
        } else {
            fs.readdir('./data', function (error, filelist) {
                var filterID = path.parse(queryData.id).base;
                fs.readFile(`data/${filterID}`, 'utf8', function (err, description) {
                    var title = queryData.id;
                    var sanitizeTitle = sanitizeHtml(title);
                    var sanitizeDescription = sanitizeHtml(description, { allowedTags: ['h1'] });
                    var list = template.List(filelist);
                    var html = template.HTML(sanitizeTitle, list, sanitizeDescription,
                        `<a href="/create">CREATE</a>
                        <a href="/update?id=${title}">UPDATE</a>
                        <form action="/delete_process" method="post">
                        <input type="hidden" name="id" value="${title}">
                        <input type="submit" value="delete">
                        </form>`, authStatusUI(request, response));
                    response.writeHead(200);
                    response.end(html);
                });
            });

        }
    } else if (pathname === '/create') {
        fs.readdir('./data', function (error, filelist) {
            var description = `
            <form action="/create_process" method="post">
            <p><input name="title" type="text" placeholder="title"></p>
            <p><textarea name="description" placeholder="description"></textarea></p>
            <p><input type="submit"></p>
            </form>
            `;
            var list = template.List(filelist);
            var html = template.HTML('CREATE', list, description,
                `<a href="/create">CREATE</a>`, authStatusUI(request, response));
            response.writeHead(200);
            response.end(html);
        });
    } else if (pathname === '/create_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                response.writeHead(302, { Location: `/?id=${title}` });
                response.end();
            });
        });
    } else if (pathname === '/update') {
        fs.readdir('./data', function (error, filelist) {
            var title = queryData.id;
            var list = template.List(filelist);
            var filterID = path.parse(queryData.id).base;
            fs.readFile(`data/${filterID}`, 'utf8', function (err, description) {
                var html = template.HTML('UPDATE', list, `
                <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <p><input name="title" type="text" placeholder="title" value="${title}"></p>
                <p><textarea name="description" placeholder="description">${description}</textarea></p>
                <p><input type="submit"></p>
                </form>
                `,
                    `<a href="/create">CREATE</a>`, authStatusUI(request, response));
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if (pathname === '/update_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            fs.rename(`data/${id}`, `data/${title}`, function (error) {
                fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                    response.writeHead(302, { Location: `/?id=${title}` });
                    response.end();
                });
            });
        });
    } else if (pathname === '/delete_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var filterID = path.parse(id).base;
            fs.unlink(`data/${filterID}`, function (error) {
                response.writeHead(302, { Location: `/` });
                response.end();
            });
        });
    } else if (pathname === '/login') {
        fs.readdir('./data', function (error, filelist) {
            var description = `
            <form action="/login_process" method="post">
            <p><input name="email" type="text" placeholder="email"></p>
            <p><input name="password" type="password" placeholder="password"></p>
            <p><input type="submit"></p>
            </form>
            `;
            var list = template.List(filelist);
            var html = template.HTML('Login', list, description,
                `<a href="/create">CREATE</a>`, authStatusUI(request, response));
            response.writeHead(200);
            response.end(html);
        });
    } else if (pathname === '/login_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            if (post.email === 'yorez' && post.password === '1111') {
                response.writeHead(302, {
                    'Set-Cookie': [
                        `email=${post.email}`,
                        `password=${post.password}`,
                        `nickname=young`
                    ],
                    Location: '/'
                });
                response.end();
            } else {
                response.end("1");
            }
        });
    } else if (pathname === '/logout_process') {

        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            response.writeHead(302, {
                'Set-Cookie': [
                    `email=;Max-age=0`,
                    `password=;Max-age=0`,
                    `nickname=;Max-age=0`
                ],
                Location: '/'
            });
            response.end();
        });

    } else {
        response.writeHead(404);
        response.end('not found');
    }
});

app.listen(3000);
