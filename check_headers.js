const http = require('http');

http.get('http://localhost:5000/health', (res) => {
    console.log('X-Content-Type-Options:', res.headers['x-content-type-options']);
    console.log('X-Frame-Options:', res.headers['x-frame-options']);
    console.log('Referrer-Policy:', res.headers['referrer-policy']);
});
