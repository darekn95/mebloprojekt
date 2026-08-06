import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push('[pageerror] '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push('[console] '+m.text());});
await p.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload({waitUntil:'networkidle'});
await p.waitForTimeout(1200);
console.log('render:', await p.evaluate(()=>document.body.innerText.includes('Korpus')));
// dodaj wzmocnienie w kolumnie
try { await p.getByText('+ wzmocnienie',{exact:true}).first().click(); await p.waitForTimeout(500);} catch(e){console.log('brak + wzmocnienie');}
console.log('formatka czolowa:', await p.evaluate(()=>document.body.innerText.includes('Wzmocnienie czołowe')));
// zaznacz "Skraca drzwi"
try { await p.getByText('Skraca drzwi',{exact:true}).first().click(); await p.waitForTimeout(500);} catch(e){console.log('brak Skraca drzwi');}
const doorH = await p.evaluate(()=>{const m=document.body.innerText.match(/297×(\d+)/);return m?m[1]:null;});
console.log('wys. drzwi po skroceniu:', doorH, '(bylo 716, ma byc mniej)');
// przejrzyj widoki
for (const v of ['Otw.','Z boku','Z góry','Z tyłu','3D','Zamk.']) {
  const before=errs.length; try{await p.getByText(v,{exact:true}).click();await p.waitForTimeout(300);}catch(e){}
  console.log('widok',v, errs.length>before?'BLAD':'ok');
}
// zmien orientacje na Poziomy i Pionowy
try { await p.getByText('Poziomy',{exact:true}).first().click(); await p.waitForTimeout(400);
  console.log('formatka pozioma:', await p.evaluate(()=>document.body.innerText.includes('Wzmocnienie poziome')));
} catch(e){console.log('brak Poziomy');}
try { await p.getByText('Pionowy',{exact:true}).first().click(); await p.waitForTimeout(400);
  console.log('formatka pionowa:', await p.evaluate(()=>document.body.innerText.includes('Wzmocnienie pionowe')));
} catch(e){console.log('brak Pionowy');}
console.log('BLEDY:', errs.length?errs.join('\n'):'(brak)');
await b.close();
