const fs = require('fs');
let html = fs.readFileSync('src/app/pages/dashboard/dashboard.html', 'utf8');

html = html.replace(/<button class=\"nav-item(?: active)?\" data-sec=\"([^\"]+)\" id=\"[^\"]+\">/g, '<button class=\"nav-item\" [class.active]=\"activeSection === \'$1\'\" (click)=\"switchSection(\'$1\')\">');
html = html.replace(/<div class=\"sec(?: active)? fade-up\" id=\"sec-([^\"]+)\">/g, '<div class=\"sec fade-up\" [class.active]=\"activeSection === \'$1\'\">');
html = html.replace(/<div class=\"sec(?: active)?\" id=\"sec-([^\"]+)\">/g, '<div class=\"sec\" [class.active]=\"activeSection === \'$1\'\">');

fs.writeFileSync('src/app/pages/dashboard/dashboard.html', html);
