import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const err=[]; page.on('pageerror', e=>err.push(e.message));
const ok=(l,c,e='')=>console.log((c?'  OK   ':'  BLAD ')+l+(e?' — '+e:''));
const card=(re)=>page.locator('section').filter({has:page.locator('h2',{hasText:re})}).first();
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
const PL={on:true,height:100,mode:'under',setback:0};
await page.evaluate(()=>{localStorage.clear();
 const PL={on:true,height:100,mode:'under',setback:0};
 const C=(n,W,r,ex={})=>({cab:Object.assign({name:n,W,H:720,D:600,plinth:PL,
   levels:[{h:null,cols:[{kind:'doors',doors:1,w:null,shelfTargets:[null,null]}]}]},ex),runId:r,offset:0});
 localStorage.setItem('szafki:projekt',JSON.stringify({name:'T',active:1,prices:{},
  runs:[{id:'c1',name:'A',wallW:null,gap:0,mountY:0,H:720,D:600,plinth:PL,corner:null},
        {id:'c2',name:'B',wallW:null,gap:0,mountY:0,H:720,D:600,plinth:PL,
         corner:{of:'c1',at:'end',owner:'of',clear:0,top:null,cut:'prosty'}}],
  items:[C('A1',600,'c1'),C('rogowa',900,'c1',{corner:{on:true,arm:500,doors:'wsporniki'}}),C('B1',700,'c2')]}));});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(2400);
let uw = await card(/Uwagi/).innerText();
console.log('   '+uw.replace(/\n+/g,' / ').slice(0,300));
ok('podpowiedź o jednych drzwiach', /Zrób jedne drzwi na 300 mm/.test(uw), uw.slice(0,220));
await card(/Uwagi/).getByRole('button',{name:/Ustaw jedne drzwi 300 mm/}).click();
await page.waitForTimeout(1200);
const kol = await page.evaluate(()=>JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.levels[0].cols
  .map(c=>({w:c.w,doors:c.doors,dw:c.doorWidths})));
console.log('   kolumny: '+JSON.stringify(kol));
ok('jedna kolumna, jedne drzwi 300', kol.length===1 && kol[0].doors===1 && kol[0].dw[0]===300, JSON.stringify(kol));
uw = await card(/Uwagi/).count()? await card(/Uwagi/).innerText():'';
ok('brak błędu o niewypełnionym paśmie', !/nie wypełniają pasma/.test(uw), uw.slice(0,200));
ok('ostrzeżenie o froncie znika', !/nad ramieniem frontu nie ma/.test(uw), uw.slice(0,200));
console.log('BLEDY:', err.length?err.join('; '):'(brak)');
await b.close();
