import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const PROJ = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const VENDOR = "/tmp/claude-0/-home-user-mebloprojekt/89068941-15d9-56b6-b1d0-03c416ab4e9c/scratchpad/vendorpkg/node_modules";
const OUT = new URL("./mebloprojekt-app.html", import.meta.url).pathname;

const require = createRequire(VENDOR + "/");
const Babel = require("@babel/standalone");

// 1. Wczytaj i przeksztalc szafki.jsx (ta sama logika co preview.html, ale w Node)
const source = await readFile(`${PROJ}/szafki.jsx`, "utf8");
const previewSource =
  source
    .replace(/import React, \{([^}]+)\} from ["']react["'];/, "const {$1} = React;")
    .replace(/export default function App\s*\(/, "function App(") +
  `\n\nReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));`;

let compiled = Babel.transform(previewSource, {
  presets: [["react", { runtime: "classic" }]],
  comments: false,
  filename: "szafki.jsx",
}).code;

// Escape kazdej jednostki UTF-16 spoza ASCII na \uXXXX -> caly plik jest
// czysto ASCII i renderuje sie poprawnie niezaleznie od kodowania strony
// (brak mojibake polskich znakow). Regex uzywa tylko escapow ASCII.
compiled = compiled.replace(/[^\x00-\x7F]/g, (ch) =>
  "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0")
);

// 2. Wczytaj biblioteki produkcyjne (sa czysto ASCII)
const react = await readFile(`${VENDOR}/react/umd/react.production.min.js`, "utf8");
const reactDom = await readFile(`${VENDOR}/react-dom/umd/react-dom.production.min.js`, "utf8");
const tailwind = await readFile(`${VENDOR}/@tailwindcss/browser/dist/index.global.js`, "utf8");

const esc = (s) => s.replaceAll("</script", "<\\/script");

// 3. Zloz zawartosc strony (bez html/head/body — artefakt owija ja sam).
//    Tekst ladowania jako encje HTML, zeby tez byl ASCII-safe.
const html = `<div id="root">
  <div style="padding:24px;font-family:system-ui,sans-serif;color:#57534e">&#321;adowanie MebloProjekt&#8230;</div>
</div>
<script>${esc(react)}</script>
<script>${esc(reactDom)}</script>
<script>${esc(tailwind)}</script>
<script>
try {
${esc(compiled)}
} catch (e) {
  document.getElementById("root").innerHTML =
    '<pre style="padding:24px;color:#b91c1c;white-space:pre-wrap;font-family:monospace">' +
    String(e && (e.stack || e.message || e)).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) +
    '</pre>';
}
</script>
`;

await writeFile(OUT, html);

let nonAscii = 0;
for (let i = 0; i < html.length; i++) if (html.charCodeAt(i) > 127) nonAscii++;
console.log("Zapisano:", OUT);
console.log("Rozmiar:", (html.length / 1024).toFixed(0), "KB");
console.log("Znakow poza ASCII w calym pliku (powinno byc 0):", nonAscii);
