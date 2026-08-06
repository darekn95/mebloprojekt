import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const err=[]; page.on('pageerror', e=>err.push(e.message));
const ok=(l,c,e='')=>console.log((c?'  OK   ':'  BLAD ')+l+(e?' — '+e:''));
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
const card=(re)=>page.locator('section').filter({has:page.locator('h2',{hasText:re})}).first();
const seed=async(W)=>{ await page.evaluate((w)=>{localStorage.clear();
  localStorage.setItem('szafki:projekt',JSON.stringify({name:'T',active:0,prices:{},runs:[],
    items:[{cab:{name:'A',W:w,H:720,D:600,levels:[{h:null,cols:[{kind:'doors',doors:1,w:null}]}]},mat:null,runId:null,offset:0}]}));},W);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(2200); };
await seed(600);
let uw = await card(/Uwagi/).count()? await card(/Uwagi/).innerText():'';
ok('normalna szafka bez uwagi o formatce', !/poniżej 60 mm/.test(uw), uw.slice(0,120));
await seed(90);  // waska szafka: wieniec/dno wychodza ok. 54 mm
uw = await card(/Uwagi/).count()? await card(/Uwagi/).innerText():'';
console.log('   '+uw.replace(/\n+/g,' / ').slice(0,260));
ok('waska formatka zgłoszona', /poniżej 60 mm/.test(uw), uw.slice(0,200));
ok('mowa o ręcznym docinaniu', /dociąć ręcznie/.test(uw), uw.slice(0,220));
console.log('BLEDY:', err.length?err.join('; '):'(brak)');
await b.close();
