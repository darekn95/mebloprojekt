import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errors.push(m.text());});
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await page.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await page.reload({waitUntil:'networkidle'});
await page.waitForTimeout(1200);
// wlacz "We frezie"
await page.getByText('We frezie',{exact:true}).click(); await page.waitForTimeout(400);
// znajdz pola w sekcji frezu: label Szerokosc/Glebokosc/Luz z hint frezu/we frezie
const vals = await page.evaluate(()=>{
  // szukaj etykiet frezu i odczytaj wartosci inputow obok
  const out={};
  const fields=[...document.querySelectorAll('div')].filter(d=>{
    const t=d.textContent||'';
    return d.querySelector('input') && /^(Szerokość|Głębokość|Luz)\s*frezu?/.test(t.replace(/\s+/g,' ').trim());
  });
  // fallback: znajdz po tekscie "Szerokość" + "frezu" itd - uzyj kolejnosci w gridzie
  const grid=[...document.querySelectorAll('.grid')].find(g=>/Szerokość[\s\S]*frezu[\s\S]*Głębokość[\s\S]*frezu/.test(g.textContent));
  if(grid){ const ins=[...grid.querySelectorAll('input')]; return ins.map(i=>i.value); }
  return null;
});
console.log('Wartosci pol frezu [Szerokosc, Glebokosc, Luz]:', JSON.stringify(vals), '(oczekiwane 4,16,1)');
console.log('BLEDY:', errors.length?errors.join(' | '):'(brak)');
await browser.close();
