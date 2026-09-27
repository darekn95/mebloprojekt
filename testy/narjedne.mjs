import pw from './pw.mjs';
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
  /* Drzwi szafki naroznej dopasowuja sie do lica same — podpowiedz pojawia sie
     dopiero wtedy, gdy szerokosc wpisano recznie i nie pasuje (np. po zmianie
     glebokosci sasiada). Stad reczne 500 mm. */
  items:[C('A1',600,'c1'),C('rogowa',900,'c1',{corner:{on:true,arm:500,doors:'wsporniki'},
    levels:[{h:null,cols:[{kind:'doors',doors:1,w:null,doorWidths:[500],shelfTargets:[null,null]}]}]}),
    C('B1',700,'c2')]}));});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(2400);
let uw = await card(/Uwagi/).innerText();
console.log('   '+uw.replace(/\n+/g,' / ').slice(0,300));
/* Jedne drzwi przy rogu wypelniaja lico az do maskownicy katownika same —
   recznie wpisana szerokosc (tu 500) jest pomijana, bo po zmianie glebokosci
   sasiada zostawiala szpare. Dawna podpowiedz „Zrob jedne drzwi" nie ma wiec
   czego naprawiac. Lico: 900 - 600 - 18 - 42 - 2 (luz) = 238, bierzemy je
   z uwagi o waskim froncie, zeby test nie trzymal kopii rachunku. */
const lico = Number((/front od strony ciągu „A” ma (\d+) mm/.exec(uw)||[])[1]);
ok('lico przed narożnikiem 238 mm', lico===238, String(lico));
await page.getByRole('button',{name:'Zamk.',exact:true}).first().click();
await page.waitForTimeout(800);
const fronty = await page.evaluate(()=>[...document.querySelectorAll('#rysunek svg text')]
  .map(t=>t.textContent.trim()).filter(t=>/^\d+×\d+$/.test(t)).map(t=>Number(t.split('×')[0])));
console.log('   fronty: '+JSON.stringify(fronty));
/* Drzwi = lico minus luz od krawedzi korpusu (2) — nie wpisane 500. */
ok('drzwi dopasowane do lica, nie wpisane 500', fronty.length===1 && fronty[0]<=lico && fronty[0]>=lico-6,
  JSON.stringify({fronty, lico}));
ok('brak podpowiedzi o jednych drzwiach (nie ma czego poprawiać)', !/Zrób jedne drzwi/.test(uw));
ok('brak błędu o niewypełnionym paśmie', !/nie wypełniają pasma/.test(uw), uw.slice(0,200));
ok('brak ostrzeżenia o szparze przy maskownicy', !/szpary/.test(uw), uw.slice(0,200));
console.log('BLEDY:', err.length?err.join('; '):'(brak)');
await b.close();
