import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push('[pe] '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push('[c] '+m.text());});
await p.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload({waitUntil:'networkidle'});
await p.waitForTimeout(1200);
console.log('render:', await p.evaluate(()=>document.body.innerText.includes('Korpus')));
// zaslepka nad szafka
await p.getByText('Zaślepka nad szafką',{exact:true}).click(); await p.waitForTimeout(400);
console.log('formatka zaslepka:', await p.evaluate(()=>document.body.innerText.includes('Zaślepka górna')));
// fix gora
try { await p.getByText('góra',{exact:true}).first().click(); await p.waitForTimeout(500);
  console.log('fix gora - drzwi skrocone:', await p.evaluate(()=>{const m=document.body.innerText.match(/297×(\d+)/);return m?m[1]:'brak drzwi';}));
} catch(e){console.log('brak fix gora',e.message.split('\n')[0]);}
// dodaj wzmocnienie pionowe
try { await p.getByText('+ wzmocnienie',{exact:true}).first().click(); await p.waitForTimeout(300);
  await p.getByText('Pionowy',{exact:true}).first().click(); await p.waitForTimeout(400);
  console.log('formatka pionowa:', await p.evaluate(()=>document.body.innerText.includes('Wzmocnienie pionowe')));
} catch(e){console.log('blad pionowy',e.message.split('\n')[0]);}
// widoki bez bledow
for (const v of ['Z boku','Z góry','3D','Zamk.']) { const bf=errs.length; try{await p.getByText(v,{exact:true}).click();await p.waitForTimeout(300);}catch(e){} console.log('widok',v,errs.length>bf?'BLAD':'ok'); }
console.log('BLEDY:', errs.length?errs.join('\n'):'(brak)');
await b.close();
