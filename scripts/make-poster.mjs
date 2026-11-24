// Writes a printable in-store poster (poster.html) with a QR code to the signup page.
// Called from postbuild-seo.mjs so the QR always matches STORE.siteUrl. Open /poster.html and print.
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';

export async function makePoster(root, outDir) {
  const store = readFileSync(join(root, 'src/app/core/data/store.data.ts'), 'utf8');
  const field = (name) => store.match(new RegExp(`${name}:\\s*(['"])(.*?)\\1`))[2];
  const site = field('siteUrl').replace(/\/$/, '');
  const name = field('name');
  const address = field('address');
  const phone = field('phoneDisplay');
  const reward = field('short');
  const terms = field('terms');

  const target = `${site}/?src=store-poster`;
  const qr = await QRCode.toString(target, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#004438', light: '#ffffff' } });
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  writeFileSync(
    join(outDir, 'poster.html'),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>In-store poster – ${esc(name)}</title>
<style>
  @page { size: letter; margin: 0.4in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1f1814; background: #eee; }
  .toolbar { display: flex; gap: 12px; justify-content: center; padding: 12px; }
  .toolbar button { padding: 10px 18px; border: 0; border-radius: 8px; background: #004438; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
  .poster { width: 7.7in; min-height: 10.1in; margin: 0 auto 24px; padding: 0.45in 0.5in; background: #fff5d7; border-top: 0.35in solid #004438; display: grid; gap: 0.18in; align-content: start; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.15); }
  .brand { display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 900; font-size: 20pt; color: #004438; }
  .brand img { width: 0.6in; height: 0.6in; border-radius: 12px; }
  h1 { margin: 0; font-size: 46pt; line-height: 1; color: #b2292e; }
  h1 span { color: #004438; }
  .sub { margin: 0; font-size: 15pt; color: #4f433e; }
  .qr { justify-self: center; width: 3.3in; padding: 0.12in; background: #fff; border: 4px solid #004438; border-radius: 16px; }
  .qr svg { display: block; width: 100%; height: auto; }
  .scan { margin: 0; font-size: 18pt; font-weight: 900; color: #004438; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0.2in; text-align: left; }
  .col { padding: 0.16in 0.2in; border-radius: 12px; background: #fff; }
  .col h2 { margin: 0 0 6px; font-size: 14pt; color: #004438; }
  .col ol { margin: 0; padding-left: 1.2em; font-size: 11.5pt; line-height: 1.45; }
  .terms { margin: 0; font-size: 9pt; color: #7b6b63; }
  .footer { margin: 0; font-size: 11pt; font-weight: 700; color: #004438; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .poster { margin: 0 auto; box-shadow: none; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Print poster</button></div>
<main class="poster">
  <div class="brand"><img src="icons/icon-192x192.png" alt=""> ${esc(name)}</div>
  <h1>3 steps to a<br><span>${esc(reward)} 🥤</span></h1>
  <p class="sub">Sign up, turn on deal alerts, and your next soda is on us.<br>Plus pizza specials &amp; giveaway entries first.</p>
  <div class="qr">${qr}</div>
  <p class="scan">Scan with your phone camera</p>
  <div class="cols">
    <div class="col">
      <h2>iPhone</h2>
      <ol>
        <li>Scan and open in <b>Safari</b>, then sign up.</li>
        <li>Tap <b>Share</b> → <b>Add to Home Screen</b>.</li>
        <li>Open the <b>pizza icon</b> → <b>Turn on notifications</b>.</li>
      </ol>
    </div>
    <div class="col">
      <h2>Android</h2>
      <ol>
        <li>Scan and sign up.</li>
        <li>Tap <b>Turn on notifications</b> → <b>Allow</b>.</li>
        <li>Optional: tap <b>Install the app</b>.</li>
      </ol>
    </div>
  </div>
  <p class="footer">Show the green ✓ at the counter to claim your ${esc(reward)}.</p>
  <p class="terms">${esc(terms)}</p>
  <p class="footer">${esc(address)} · ${esc(phone)}</p>
</main>
</body>
</html>
`,
  );
  return target;
}
