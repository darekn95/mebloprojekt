/* Symulacja wysuwu szuflad (prosba uzytkownika 2026-10-04: „przeprowadź własne
   symulacje, czy nie ma dodatkowych kolizji”). Niezalezna od kontroli
   w aplikacji: bierze tylko bryly 3D (zamkniete), sama grupuje je na szuflady
   i wysuwa kazda szuflade osobno co 5 mm na pelna dlugosc prowadnicy (NL),
   reszta zamknieta. Kazda bryla ruchoma (front, uchwyt, boki V-BOX, dno, tyl)
   nie moze wejsc w nic nieruchomego: korpus, wzmocnienia, plecy, blat roboczy
   nad szafka (dodawany tu wprost: 38 mm na gorze korpusu, 10 mm przed fronty)
   ani w zamkniete szuflady obok. Do tego tabela luzow nad bokami i tylem. */
export const K = '#cc2222', F = '#2222cc', P = '#22aa22', METAL = '#8b8b93', UCHWYT = '#3f3f46', HDF = '#e7e5e4';
const nachodzi = (a, c) => [0, 1, 2].every((k) => Math.min(a[k + 3], c[k + 3]) - Math.max(a[k], c[k]) > 0.5);
export const symuluj = (bryly, { H, blat = false, nl = [] } = {}) => {
  // fronty (nakladane przed korpusem, wpuszczane w otworze) — w szafce z samymi szufladami wszystkie bryly frontu
  // front szuflady to ten, w ktorego pasie (x i y) jest bok skrzynki — drzwi obok zostaja nieruchome
  const boki = bryly.filter((s) => s.color === METAL);
  // (oba boki skrzynki w obrysie frontu ±15 mm — drzwi obok, za przegroda, maja najwyzej jeden w poblizu)
  const fronty = bryly.filter((s) => s.color === F && boki.filter((b) => b.p[0] >= s.p[0] - 15 && b.p[3] <= s.p[3] + 15
    && b.p[1] >= s.p[1] - 1 && b.p[1] <= s.p[4] + 1).length >= 2).sort((a, b) => a.p[1] - b.p[1]);
  if (!fronty.length) return [];
  const lico = Math.min(...fronty.map((f) => f.p[2]));
  const szuflady = fronty.map((f, i) => ({ i, front: f, czesci: [f] }));
  const doKtorej = (s) => {
    // skrzynka i uchwyt naleza do szuflady, w ktorej pasie frontu lezy ich dol
    // i w pasie jego szerokosci — przy dwoch kolumnach szuflad na tej samej wysokosci
    // czesci prawej kolumny trafialy do szuflady z lewej (test losowych edycji 2026-10-04)
    const y = s.color === UCHWYT ? (s.p[1] + s.p[4]) / 2 : s.p[1];
    const xm = (s.p[0] + s.p[3]) / 2;
    return szuflady.find((d) => y >= d.front.p[1] - 1 && y <= d.front.p[4] + 1
      && xm >= d.front.p[0] - 15 && xm <= d.front.p[3] + 15);
  };
  const stale = [];
  bryly.forEach((s) => {
    if (fronty.includes(s)) return;
    const ruch = s.color === METAL || s.color === P || (s.color === UCHWYT && s.p[1] >= 0 && s.p[2] < lico + 1);
    const d = ruch ? doKtorej(s) : null;
    if (d) d.czesci.push(s); else stale.push({ ...s, co: s.color === K ? 'korpus/wzmocnienie' : s.color === HDF ? 'plecy' : s.color });
  });
  if (blat) {
    const x0 = Math.min(...bryly.map((s) => s.p[0])), x1 = Math.max(...bryly.map((s) => s.p[3]));
    // blat roboczy: od gory korpusu 38 mm, wystaje 10 mm przed najdalej wysuniete lico frontow
    stale.push({ p: [x0, H, lico - 10, x1, H + 38, 600], co: 'blat' });
  }
  const wynik = [];
  szuflady.forEach((d, i) => {
    // pelny wysuw = dlugosc prowadnicy; bez podanej NL bierzemy ja z dlugosci boku skrzynki (NL − 2)
    const bok = d.czesci.find((c) => c.color === METAL);
    const droga = nl[i] || (bok ? Math.round(bok.p[5] - bok.p[2]) + 2 : 450);
    const inne = szuflady.filter((x) => x !== d).flatMap((x) => x.czesci.map((c) => ({ ...c, co: `szuflada ${x.i + 1}` })));
    const przeszkody = [...stale, ...inne];
    const kolizje = new Map();
    for (let s = 0; s <= droga; s += 5) {
      d.czesci.forEach((c) => {
        const p = [c.p[0], c.p[1], c.p[2] - s, c.p[3], c.p[4], c.p[5] - s];
        przeszkody.forEach((o) => {
          if (!nachodzi(p, o.p)) return;
          const czym = c.color === F ? 'front' : c.color === METAL ? 'bok skrzynki' : c.color === UCHWYT ? 'uchwyt' : 'dno/tył';
          const k = `${czym} × ${o.co}`;
          if (!kolizje.has(k)) kolizje.set(k, s);
        });
      });
    }
    // luzy: nad bokami i nad tylem do najnizszej przeszkody nad skrzynka na jej drodze
    const boki = d.czesci.filter((c) => c.color === METAL);
    const tyl = d.czesci.filter((c) => c.color === P).sort((a, b) => b.p[4] - a.p[4])[0];
    const gora = boki.length ? Math.max(...boki.map((c) => c.p[4])) : null;
    const zakresZ = boki.length ? [Math.min(...boki.map((c) => c.p[2])) - droga, Math.max(...boki.map((c) => c.p[5]))] : [0, 0];
    const xs = boki.length ? [Math.min(...boki.map((c) => c.p[0])), Math.max(...boki.map((c) => c.p[3]))] : [0, 0];
    const nad = przeszkody.filter((o) => gora != null && o.p[1] >= gora - 0.5 && o.p[0] < xs[1] && o.p[3] > xs[0]
      && o.p[2] < zakresZ[1] && o.p[5] > zakresZ[0]);
    const sufit = nad.length ? nad.reduce((m, o) => (o.p[1] < m.p[1] ? o : m)) : null;
    wynik.push({ szuflada: i + 1, front: `${Math.round(d.front.p[1])}–${Math.round(d.front.p[4])}`,
      boki: boki.length ? `${Math.round(boki[0].p[1])}–${Math.round(gora)}` : '—',
      tyl: tyl ? `${Math.round(tyl.p[1])}–${Math.round(tyl.p[4])}` : '—',
      sufit: sufit ? `${Math.round(sufit.p[1])} (${sufit.co})` : '—',
      luzBoki: sufit && gora != null ? Math.round(sufit.p[1] - gora) : null,
      luzTyl: sufit && tyl ? Math.round(sufit.p[1] - tyl.p[4]) : null,
      kolizje: [...kolizje.entries()].map(([k, s]) => `${k} przy ${s} mm`) });
  });
  return wynik;
};
