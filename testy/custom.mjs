import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 720, D: 500, handleName: 'Uchwyt relingowy 160' };
  const mat = { board: { name: 'Płyta', thickness: 18, color: '#123456' } };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab, mat }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const lab = await card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...new Set([...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[1].innerText.trim()))]);
console.log('  etykieta przy własnym kolorze:', lab.join(' | '));
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(400);
const rows = await wyc.evaluate((s) => [...s.querySelectorAll('tbody tr')].map(tr => {
  const td = [...tr.querySelectorAll('td')]; const i = tr.querySelector('input');
  return `${td[0].innerText.trim().split('\n')[0]} | dom.=${i ? i.placeholder : '-'}`;
}));
rows.filter(r => /Uchwyt|Płyta/.test(r)).forEach(r => console.log('   ', r));
await browser.close();
