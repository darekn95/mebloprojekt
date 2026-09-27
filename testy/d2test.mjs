import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push('[pe] '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push('[c] '+m.text());});
const ok=(l,c,e='')=>console.log((c?'  OK   ':'  BLAD ')+l+(e?' — '+e:''));
await p.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload({waitUntil:'networkidle'});
await p.waitForTimeout(1200);
ok('aplikacja się renderuje', await p.evaluate(()=>document.body.innerText.includes('Korpus')));
// blenda nad szafka (dawniej „Zaslepka nad szafka") — karta jest domyslnie zwinieta
const kartaB = p.locator('section').filter({has:p.locator('h2',{hasText:/^Blenda nad szafką$/})}).first();
await kartaB.locator('header button').first().click(); await p.waitForTimeout(300);
await kartaB.getByText('Blenda nad szafką',{exact:true}).last().click(); await p.waitForTimeout(500);
ok('formatka „Blenda nad szafką” w zestawieniu', await p.evaluate(()=>[...document.querySelectorAll('td')].some(td=>td.textContent.trim()==='Blenda nad szafką')));
// fix gora
try { await p.getByText('góra',{exact:true}).first().click(); await p.waitForTimeout(500);
  // wysokosc drzwi z podpisu frontu na rysunku („297×655")
  const hDrzwi = await p.evaluate(()=>{const t=[...document.querySelectorAll('#rysunek svg text')].map(e=>e.textContent.trim())
    .filter(x=>/^\d+×\d+$/.test(x)).map(x=>x.split('×').map(Number)).filter(([w])=>w>150);return t.length?Math.max(...t.map(([,h])=>h)):null;});  // najwyzszy front to drzwi, fix ma ok. 60
  ok('fix u góry skraca drzwi (poniżej 714)', hDrzwi>0 && hDrzwi<714, String(hDrzwi));
} catch(e){console.log('brak fix gora',e.message.split('\n')[0]);}
// dodaj wzmocnienie pionowe
try { await p.getByText('+ wzmocnienie',{exact:true}).first().click(); await p.waitForTimeout(300);
  await p.getByText('Pionowy',{exact:true}).first().click(); await p.waitForTimeout(400);
  ok('formatka „Wzmocnienie pionowe”', await p.evaluate(()=>document.body.innerText.includes('Wzmocnienie pionowe')));
} catch(e){console.log('blad pionowy',e.message.split('\n')[0]);}
// widoki bez bledow
for (const v of ['Z boku','Z góry','3D','Zamk.']) { const bf=errs.length; try{await p.getByRole('button',{name:v,exact:true}).first().click();await p.waitForTimeout(300);}catch(e){} ok('widok '+v+' bez błędów', errs.length===bf, errs.slice(bf).join('; ')); }
console.log('BLEDY:', errs.length?errs.join('\n'):'(brak)');
await b.close();
