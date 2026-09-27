/* Playwright dla testow — z szybszym czekaniem.
   Testy czekaja `page.waitForTimeout(N)` po kazdym kliknieciu i przeladowaniu
   (razem ok. 800 takich miejsc). Tutaj ta pauza konczy sie wczesniej, gdy
   strona jest bezczynna: aplikacja jest narysowana (nie wisi „Ladowanie…”), nie
   czeka na zaden swoj zegar (np. autozapis po 800 ms) i minely dwie klatki
   rysowania. N zostaje gornym limitem, wiec test nigdy nie czeka dluzej niz
   dotad. `PW_WOLNO=1` przywraca sztywne pauzy (do porownan, gdy cos sie sypie).

   Uzycie w tescie zamiast sciezki do Playwrighta:
     import pw from './pw.mjs'; */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';

const WOLNO = !!process.env.PW_WOLNO;

/* Wstrzykiwane w strone przed jej skryptami: liczy zegary krotsze niz 3 s,
   ktore jeszcze nie wystrzelily (dluzsze to np. zwalnianie adresu pliku —
   na nie test nie czeka). */
const SLEDZ_ZEGARY = () => {
  if (window.__zegary) return;
  const set = window.setTimeout, clr = window.clearTimeout;
  const zeg = new Set();
  window.__zegary = zeg;
  window.setTimeout = function (fn, ms, ...a) {
    const id = set.call(window, function () {
      zeg.delete(id);
      return typeof fn === 'function' ? fn.apply(this, a) : undefined;
    }, ms);
    if ((Number(ms) || 0) < 3000) zeg.add(id);
    return id;
  };
  window.clearTimeout = function (id) { zeg.delete(id); return clr.call(window, id); };
};

const zajeta = (page) => page.evaluate(() => new Promise((r) => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const root = document.getElementById('root');
    const laduje = !!root && /adowanie/.test(root.textContent || '') && !root.querySelector('section');
    r((window.__zegary ? window.__zegary.size : 0) + (laduje ? 1 : 0));
  }));
})).catch(() => 0);

const przyspiesz = (page) => {
  if (WOLNO || page.__przyspieszona) return page;
  page.__przyspieszona = true;
  const pauza = page.waitForTimeout.bind(page);
  page.waitForTimeout = async (ms) => {
    const t0 = Date.now();
    await pauza(Math.min(ms, 40));
    while (Date.now() - t0 < ms) {
      if (!(await zajeta(page))) return;
      await pauza(Math.min(30, Math.max(0, ms - (Date.now() - t0))));
    }
  };
  return page;
};

const kontekst = async (ctx) => {
  if (!WOLNO) await ctx.addInitScript(SLEDZ_ZEGARY);
  const nowa = ctx.newPage.bind(ctx);
  ctx.newPage = async (...a) => przyspiesz(await nowa(...a));
  return ctx;
};

const przegladarka = (b) => {
  const nowyKontekst = b.newContext.bind(b);
  b.newContext = async (...a) => kontekst(await nowyKontekst(...a));
  // b.newPage tworzy wlasny kontekst — skrypt dokladamy do niego
  b.newPage = async (...a) => {
    const ctx = await b.newContext(...a);
    const p = await ctx.newPage();
    p.close = ((zamknij) => async (...x) => { await zamknij(...x); await ctx.close().catch(() => {}); })(p.close.bind(p));
    return p;
  };
  return b;
};

const chromium = new Proxy(pw.chromium, {
  get(t, k) {
    if (k === 'launch') return async (...a) => przegladarka(await t.launch(...a));
    const v = t[k];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default new Proxy(pw, { get: (t, k) => (k === 'chromium' ? chromium : t[k]) });
export { chromium };
