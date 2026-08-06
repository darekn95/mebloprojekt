import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push(m.text());});
await p.goto('http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload({waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const wienBefore = await p.evaluate(()=>document.body.innerText.includes('Dno / wieniec')||document.body.innerText.includes('Wieniec'));
// klik "brak" (pierwszy = Wieniec L)
await p.getByText('brak',{exact:true}).first().click();
await p.waitForTimeout(600);
const wienAfter = await p.evaluate(()=>{
  // czy w liscie formatek jest jeszcze Wieniec?
  return /Wieniec|Dno \/ wieniec/.test(document.body.innerText);
});
const hasDno = await p.evaluate(()=>/(^|\s)Dno(\s|$)/m.test(document.body.innerText));
await p.locator('svg').first().screenshot({path:'./shot-brak.png'});
console.log('Wieniec w formatkach PRZED:', wienBefore, '| PO brak:', wienAfter, '(oczekiwane false)');
console.log('BLEDY:', errs.length?errs.join(' | '):'(brak)');
await b.close();
