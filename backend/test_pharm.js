const https = require('https');
const jwt = require('./node_modules/jsonwebtoken');
const token = jwt.sign({id:1,role:'Admin',name:'admin',branch_id:1}, 'ihms_super_secret_key_2026');

https.get('https://hospital-g8fe.onrender.com/api/pharmacy', {
  headers: { 'Authorization': 'Bearer ' + token }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('PHARMACY STATUS:', res.statusCode, 'BODY:', body));
});
