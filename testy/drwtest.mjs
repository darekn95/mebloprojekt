import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push(m.text());});
await p.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload({waitUntil:'networkidle'});
await p.waitForTimeout(1200);
// przelacz kolumne na Szuflady
try { await p.getByText('Szuflady',{exact:true}).first().click(); await p.waitForTimeout(500);} catch(e){console.log('brak Szuflady tab');}
// dodaj szuflade jesli jest przycisk
try { await p.getByText('+ szuflada',{exact:true}).first().click(); await p.waitForTimeout(500);} catch(e){}
const hasSwiatlo = await p.evaluate(()=>document.body.innerText.includes('światło'));
console.log('Renderuje sie:', await p.evaluate(()=>document.body.innerText.includes('Korpus')));
console.log('Etykieta "światło" widoczna:', hasSwiatlo);
console.log('BLEDY:', errs.length?errs.join(' | '):'(brak)');
await b.close();
