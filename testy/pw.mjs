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
  /* Praca zaplanowana przez Reacta (2026-11-04): jego planista budzi sie wiadomoscia przez
     `MessageChannel`, nie zegarem. Miedzy dwoma renderami (np. po wczytaniu projektu, zanim efekt
     zaplanuje autozapis) nie czekal zaden zegar, a strona wygladala na bezczynna — `otwier` na
     standalone czytal zapis sprzed autozapisu. Wyslana, a jeszcze nieodebrana wiadomosc = zajeta. */
  const MC = window.MessageChannel;
  const onmsg = MC && Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
  window.__wiadomosci = 0;
  if (MC && onmsg) window.MessageChannel = function () {
    const ch = new MC();
    const post = ch.port2.postMessage.bind(ch.port2);
    ch.port2.postMessage = function (...a) { window.__wiadomosci++; return post(...a); };
    let h = null;
    Object.defineProperty(ch.port1, 'onmessage', {
      configurable: true,
      get: () => h,
      set: (f) => {
        h = f;
        onmsg.set.call(ch.port1, f ? function (e) { window.__wiadomosci = Math.max(0, window.__wiadomosci - 1); return f.call(this, e); } : null);
      },
    });
    return ch;
  };
};

/* Zajeta = laduje sie, czeka na zegar albo jeszcze sie przewija (plynne
   `scrollIntoView` — np. „Pokaz rysunek” — przesuwa strone przez kilkaset ms,
   a zegara przy tym nie ma). */
const zajeta = (page) => page.evaluate(() => new Promise((r) => {
  const y0 = window.scrollY;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const root = document.getElementById('root');
    const laduje = !!root && /adowanie/.test(root.textContent || '') && !root.querySelector('section');
    const przewija = Math.abs(window.scrollY - y0) > 0.5;
    r((window.__zegary ? window.__zegary.size : 0) + (window.__wiadomosci || 0) + (laduje ? 1 : 0) + (przewija ? 1 : 0));
  }));
})).catch(() => 0);

/* Po wczytaniu strony czekamy, az aplikacja wystartuje (2026-11-04), w obu trybach: standalone
   kompiluje kod w przegladarce (ok. 3,5 s), a przy kilku suitach naraz dluzej niz pauza testu —
   `otwier` czytal zapis w localStorage, zanim aplikacja go wczytala i zapisala (5 z 5 przy pieciu
   naraz). Warunek, nie pauza: koniec, gdy w #root nie ma juz „Ładowanie…”. */
const URUCHOMIONA = () => {
  const root = document.getElementById('root');
  return !root || !!root.querySelector('section') || !/adowanie/.test(root.textContent || '');
};
const poStarcie = (page) => {
  if (page.__poStarcie) return page;
  page.__poStarcie = true;
  for (const k of ['goto', 'reload']) {
    const f = page[k].bind(page);
    page[k] = async (...a) => {
      const w = await f(...a);
      await page.waitForFunction(URUCHOMIONA, null, { timeout: 60000 }).catch(() => {});
      return w;
    };
  }
  return page;
};

const przyspiesz = (page) => {
  if (WOLNO || page.__przyspieszona) return page;
  page.__przyspieszona = true;
  const pauza = page.waitForTimeout.bind(page);
  /* Bezczynna dwa razy z rzedu (2026-11-04): pod obciazeniem (5 suit naraz) pierwsza „cicha”
     klatka trafiala przed nastepnym krokiem aplikacji — efekt po przeliczonym rozkroju
     (`plytywlasne`), bryla 3D (`audytmacierz`), poczatek plynnego przewijania (`wyslij`) —
     i test czytal stary stan; wolno przechodzily. */
  page.waitForTimeout = async (ms) => {
    const t0 = Date.now();
    await pauza(Math.min(ms, 40));
    let cicho = 0;
    while (Date.now() - t0 < ms) {
      if (!(await zajeta(page))) { if (++cicho >= 2) return; } else cicho = 0;
      await pauza(Math.min(30, Math.max(0, ms - (Date.now() - t0))));
    }
  };
  /* Przed przeladowaniem kasujemy czekajace zegary strony (2026-11-04): test wpisuje projekt do
     localStorage i przeladowuje, a autozapis poprzedniego kroku (800 ms) potrafil wystrzelic
     miedzy wpisaniem a przeladowaniem i nadpisac go starym (`audytgpt15` N189 pod obciazeniem).
     Strona i tak znika; test, ktory czeka na autozapis, czeka przed przeladowaniem. */
  const przeladuj = page.reload.bind(page);
  page.reload = async (...a) => {
    await page.evaluate(() => { if (window.__zegary) [...window.__zegary].forEach((id) => clearTimeout(id)); }).catch(() => {});
    return przeladuj(...a);
  };
  return page;
};

/* Paski u gory zwijaja sie przy przewijaniu w dol (2026-10-19). Testy klikaja
   kafelki szafek po przewinieciu strony do kart nizej — domyslnie bez tego;
   suity, ktore to sprawdzaja (`przewijanie`, `niskieokno`), wlaczaja je
   wlasnym `addInitScript(() => { window.__mpBezZwijania = false; })`. */
/* Karty Formatki / Rozkroj / Produkty / Wycena sa od 2026-10-24 po jednej
   z przelacznikiem Szafka / Pomieszczenie / Projekt. Suity sprzed tej zmiany
   czytaja dawne osobne karty (szafki i projektu naraz) — dostaja je tu; suita
   `karty` sprawdza nowy uklad z `window.__mpKartyOsobno = false`. */
const BEZ_ZWIJANIA = () => { window.__mpBezZwijania = true; window.__mpKartyOsobno = true; };

const kontekst = async (ctx) => {
  await ctx.addInitScript(BEZ_ZWIJANIA);
  if (!WOLNO) await ctx.addInitScript(SLEDZ_ZEGARY);
  const nowa = ctx.newPage.bind(ctx);
  ctx.newPage = async (...a) => przyspiesz(poStarcie(await nowa(...a)));
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
