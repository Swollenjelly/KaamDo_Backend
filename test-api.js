const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ role: 'vendor' }, 'Jelly123', {
    subject: '1',
    expiresIn: '2h'
});

console.log("Generated test vendor token:", token);

http.get({
    hostname: 'localhost',
    port: 4000,
    path: '/api/completedJob',
    headers: {
        Authorization: `Bearer ${token}`
    }
}, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        console.log('CompletedJob Response:', res.statusCode, data);
    });
});
