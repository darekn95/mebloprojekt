/* Formatki wezsze niz 60 mm (MIN_PART). Uzytkownik 2026-10-11: firma nie tnie
   wezszych — do zamowienia idzie 60, a uwaga to blad z pytaniem (moze to pomylka
   przy wpisywaniu); po „Tak, docinam ręcznie” — ostrzezenie o recznym docieciu.
   Dotyczy formatek szafki, ramienia szafki w L, cokolu ciagu i wstawki w rogu. */
import pw from './pw.mjs';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const err=[]; page.on('pageerror', e=>err.push(e.message));
const ok=(l,c,e='')=>console.log((c?'  OK   ':'  BLAD ')+l+(e?' — '+e:''));
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html',{waitUntil:'networkidle'});
const card=(re)=>page.locator('section').filter({has:page.locator('h2',{hasText:re})}).first();
const wczytaj=async(p)=>{ await page.evaluate((q)=>{localStorage.clear(); localStorage.setItem('szafki:projekt',JSON.stringify(q));},p);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1500); };
const seed=(W)=>wczytaj({name:'T',active:0,prices:{},runs:[],
    items:[{cab:{name:'A',W,H:720,D:600,levels:[{h:null,cols:[{kind:'doors',doors:1,w:null}]}]},mat:null,runId:null,offset:0}]});
const uwagi=async()=>await card(/^Uwagi/).count()? await card(/^Uwagi/).innerText():'';
const ikony=()=>page.evaluate(()=>{ const sec=[...document.querySelectorAll('section')].find((s)=>/^Uwagi/.test(s.querySelector('h2')?.textContent||''));
  const l=(sec?sec.innerText:'').split('\n').map((x)=>x.trim()); return l.flatMap((x,i)=>/firma nie tnie formatek/.test(x)?[l[i-1]]:[]); });
const tabela=(re)=>page.evaluate((src)=>{ const sec=[...document.querySelectorAll('section')].find((s)=>new RegExp(src).test(s.querySelector('h2')?.textContent||''));
  if(!sec) return []; const t=sec.querySelector('table'); if(!t) return [];
  const th=[...t.querySelectorAll('thead th')].map((x)=>x.textContent.trim());
  return [...t.querySelectorAll('tbody tr')].map((tr)=>{ const td=[...tr.children].map((x)=>x.textContent.trim()); const o={}; th.forEach((h,i)=>{o[h]=td[i];}); return o; }); }, re.source);
const num=(s)=>Number(String(s||'').replace(/\s/g,'').replace(',','.'))||0;

await seed(600);
let uw = await uwagi();
ok('normalna szafka bez uwagi o formatce', !/firma nie tnie formatek/.test(uw), uw.slice(0,120));
await seed(90);  // waska szafka: wieniec/dno wychodza ok. 54 mm
uw = await uwagi();
console.log('   '+uw.split('\n').filter((l)=>/firma nie tnie/.test(l)).join(' / ').slice(0,300));
ok('wąska formatka zgłoszona jako błąd', (await ikony()).length > 0 && (await ikony()).every((i)=>i==='×'), JSON.stringify(await ikony()));
ok('pytanie, czy to nie pomyłka, i mowa o ręcznym docinaniu', /Czy to nie pomyłka przy wpisywaniu wymiaru\?/.test(uw) && /dociąć ręcznie/.test(uw), uw.slice(0,220));
let f = await tabela(/^Formatki do zamówienia/);
const wezsze = f.filter((r)=>r['Długość']!=null && Math.min(num(r['Długość']),num(r['Szerokość']))>0 && Math.min(num(r['Długość']),num(r['Szerokość']))<60);
ok('w zamówieniu żadna formatka węższa niż 60 mm', !wezsze.length && f.length>0, wezsze.map((r)=>`${r.Element} ${r['Długość']}×${r['Szerokość']}`).join(', '));
const przyciski = card(/^Uwagi/).getByRole('button', { name: 'Tak, docinam ręcznie' });
const ile = await przyciski.count();
ok('przycisk „Tak, docinam ręcznie” przy każdej wąskiej formatce', ile > 0, String(ile));
for (let k = 0; k < ile; k++) { await card(/^Uwagi/).getByRole('button', { name: 'Tak, docinam ręcznie' }).first().click(); await page.waitForTimeout(800); }
uw = await uwagi();
ok('po potwierdzeniu: bez błędu, ostrzeżenie „do ręcznego docięcia”', !/Czy to nie pomyłka/.test(uw) && /do ręcznego docięcia/.test(uw), uw.split('\n').filter((l)=>/docięcia|pomyłka/.test(l)).join(' / ').slice(0,300));
const zapis = await page.evaluate(()=>JSON.parse(localStorage.getItem('szafki:projekt')));
ok('potwierdzenie zapisane w szafce', (zapis.items[0].cab.dociac||[]).length === ile, JSON.stringify(zapis.items[0].cab.dociac));

console.log('\n== cokół ciągu 50 mm ==');
const PL = { on: true, height: 50, mode: 'under', setback: 0 };
await wczytaj({ name:'T', active:0, prices:{}, runs:[{ id:'c1', name:'Ściana 1', wallW:null, gap:0, mountY:0, H:720, D:570, plinth:PL, worktop:false, corner:null }],
  items:[0,1].map((i)=>({ cab:{ name:'A'+i, W:600, H:720, D:570, plinth:PL, legs:{on:true,height:50}, levels:[{h:null,cols:[{kind:'doors',doors:2,w:null}]}] }, runId:'c1', offset:0 })) });
uw = await uwagi();
ok('cokół 50 mm: błąd z pytaniem', /Formatka „Cokół ciągu” ma \d+ × 50 mm, a firma nie tnie/.test(uw), uw.split('\n').filter((l)=>/Cokół/.test(l)).join(' / ').slice(0,300));
const proj = await tabela(/^Formatki całego projektu/);
const cok = proj.filter((r)=>/^Cokół/.test(r.Element||''));
ok('w zamówieniu cokół o wysokości 60', cok.length>0 && cok.every((r)=>Math.min(num(r['Długość']),num(r['Szerokość']))===60), cok.map((r)=>`${r['Długość']}×${r['Szerokość']}`).join(', '));
await card(/^Uwagi/).getByRole('button', { name: 'Tak, docinam ręcznie' }).first().click(); await page.waitForTimeout(800);
const z2 = await page.evaluate(()=>JSON.parse(localStorage.getItem('szafki:projekt')));
ok('potwierdzenie cokołu zapisane w ciągu', (z2.runs[0].dociac||[]).length === 1, JSON.stringify(z2.runs[0].dociac));
ok('cokół: po potwierdzeniu ostrzeżenie', /Cokół ciągu” \d+ × 50 mm do ręcznego docięcia/.test(await uwagi()));
console.log('BLEDY:', err.length?err.join('; '):'(brak)');
ok('strona bez błędów', !err.length, err.join('; '));
await b.close();
