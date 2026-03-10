const fs = require('fs');
const path = require('path');
function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            replaceInDir(filePath);
        } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('http://localhost:5000/api')) {
                content = content.replace(/http:\/\/localhost:5000\/api/g, '/api');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Updated ' + filePath);
            }
        }
    });
}
replaceInDir(path.join(process.cwd(), 'frontend', 'src'));
