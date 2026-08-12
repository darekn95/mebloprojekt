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
/* Dostepne swiatlo to szerokosc korpusu minus glebokosc sasiedniego ciagu,
   minus grubosc frontu ramienia (jego lico stoi przed korpusem ramienia),
   minus katownik z luzem — nachodzaca plyta wchodzi w kwadrat styku obu lic,
   wiec poza naroze wystaje o grubosc frontu mniej: 900 - 600 - 18 - 42 - 3
   = 237. Bierzemy je
   z podpowiedzi, zeby test nie trzymal wlasnej kopii tego rachunku. */
const swiatlo = Number((/Zrób jedne drzwi na (\d+) mm/.exec(uw)||[])[1]);
ok('podpowiedź o jednych drzwiach', swiatlo>0, uw.slice(0,220));
ok('światło liczone z lica ramienia i po kątowniku', swiatlo===237, String(swiatlo));
await card(/Uwagi/).getByRole('button',{name:new RegExp('Ustaw jedne drzwi '+swiatlo+' mm')}).click();
await page.waitForTimeout(1200);
const kol = await page.evaluate(()=>JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.levels[0].cols
  .map(c=>({w:c.w,doors:c.doors,dw:c.doorWidths})));
console.log('   kolumny: '+JSON.stringify(kol));
ok('jedna kolumna, jedne drzwi na dostępne światło',
  kol.length===1 && kol[0].doors===1 && kol[0].dw[0]===swiatlo, JSON.stringify(kol));
uw = await card(/Uwagi/).count()? await card(/Uwagi/).innerText():'';
ok('brak błędu o niewypełnionym paśmie', !/nie wypełniają pasma/.test(uw), uw.slice(0,200));
ok('ostrzeżenie o froncie znika', !/nad ramieniem frontu nie ma/.test(uw), uw.slice(0,200));
console.log('BLEDY:', err.length?err.join('; '):'(brak)');
await b.close();
