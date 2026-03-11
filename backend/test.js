const https = require('https');
const jwt = require('./node_modules/jsonwebtoken');

const token = jwt.sign({id:1,role:'Admin',name:'admin',branch_id:1}, 'ihms_super_secret_key_2026');

const req = https.request({
  hostname: 'hospital-g8fe.onrender.com',
  port: 443,
  path: '/api/diseases',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ disease_name: 'TestDisease', patient_id: null }));
req.end();
