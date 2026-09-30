import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('dist/index.html','utf8');
const css=readFileSync('dist/style.css','utf8');
const model=readFileSync('dist/model.mjs','utf8').replace(/^export /gm,'');
const app=readFileSync('dist/app.js','utf8').replace(/^import .*\n/,'');
const output=source.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="app.js"></script>',()=>`<script type="module">${model}\n${app}</script>`);
writeFileSync('Велес — калькулятор.html',output);
console.log('Standalone calculator bundled.');
