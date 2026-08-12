import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const S='./';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
const ok=(l,c,e='')=>console.log((c?'  OK   ':'  BLAD ')+l+(e?' — '+e:''));
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil:'networkidle' });
const PL={on:true,height:100,mode:'under',setback:0};
await page.evaluate(() => {
  localStorage.clear();
  const PL={on:true,height:100,mode:'under',setback:0};
  const C=(n,W,r,ex={})=>({cab:Object.assign({name:n,W,H:720,D:600,plinth:PL,
    levels:[{h:null,cols:[{kind:'doors',doors:1,w:null}]}]},ex),runId:r,offset:0});
  localStorage.setItem('szafki:projekt', JSON.stringify({name:'T',active:1,prices:{},
    runs:[{id:'c1',name:'A',wallW:null,gap:0,mountY:0,H:720,D:600,plinth:PL,corner:null},
          {id:'c2',name:'B',wallW:null,gap:0,mountY:0,H:720,D:600,plinth:PL,
           corner:{of:'c1',at:'end',owner:'of',clear:0,top:null,cut:'prosty'}}],
    items:[C('A1',600,'c1'), C('rogowa',900,'c1',{corner:{on:true,arm:500,doors:'wsporniki'},
      levels:[{h:null,cols:[{kind:'doors',doors:1,w:null,noDiv:true},{kind:'doors',doors:0,w:600}]}]}),
      C('B1',700,'c2')]}));
});
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(2400);
const txt=()=>page.evaluate(()=>[...document.querySelectorAll('svg text')].map(t=>t.textContent.trim()));
await page.getByText('Ciąg',{exact:true}).first().click(); await page.waitForTimeout(900);
await page.getByText('Zamk.',{exact:true}).first().click(); await page.waitForTimeout(900);
let t=await txt();
ok('ramię widać w widoku ciągu', t.some(x=>/^ramię 500$/.test(x)), t.join(' | '));
await page.locator('svg').first().screenshot({path:S+'ciag-arm.png'});
// zawiasy tylko w otwartym
const puszki=()=>page.evaluate(()=>[...document.querySelectorAll('svg rect')].filter(r=>r.getAttribute('fill')==='#a1a1aa').length);
const zam=await puszki();
await page.getByText('Otw.',{exact:true}).first().click(); await page.waitForTimeout(900);
const otw=await puszki();
console.log('   puszki zawiasów: zamk.', zam, ' otw.', otw);
ok('w zamkniętym nie ma zawiasów ramienia', zam===0, String(zam));
ok('w otwartym są', otw>0, String(otw));
/* Ramie lezy w pasie sasiedniej sciany, wiec w widoku TAMTEGO ciagu tez musi
   byc widoczne — inaczej ciag za rogiem wyglada tak, jakby naroznika nie bylo. */
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  p.active = 2;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(2400);
await page.getByText('Ciąg',{exact:true}).first().click(); await page.waitForTimeout(900);
await page.getByText('Zamk.',{exact:true}).first().click(); await page.waitForTimeout(900);
t = await txt();
ok('ramię widać też w widoku ciągu za rogiem', t.some(x=>/^ramię 500$/.test(x)), t.join(' | '));
console.log('BLEDY:', errors.length?errors.join('; '):'(brak)');
await b.close();
