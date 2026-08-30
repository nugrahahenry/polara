import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';


const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const proofTableCss = await fs.readFile(new URL('../styles/proof-table.css', import.meta.url), 'utf8');
const socialLinks = [
  ['WhatsApp Henry Nugraha', 'https://wa.me/6289513595554'],
  ['Instagram @hnry.dev', 'https://instagram.com/hnry.dev'],
  ['GitHub Henry Nugraha', 'https://github.com/nugrahahenry'],
];


function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


test('footer Polara exposes the maker identity and privacy truth', () => {
  assert.match(html, /class="maker-seal"/);
  assert.match(
    html,
    /class="maker-link"[^>]*href="https:\/\/hnry\.dev"[^>]*>Henry Nugraha<\/a>/,
  );
  assert.match(html, /Your photos stay in this browser\. Nothing is uploaded, and no account is needed\./);
  assert.match(html, /© 2026 Polara · Digital photobooth/);
});


test('desktop shell keeps Proof Table context and a horizontal footer foundation', () => {
  assert.match(html, /class="stage-docket"/);
  assert.match(html, /id="stageDocketStep"/);
  assert.match(html, /id="stageDocketFormat"/);
  assert.match(html, /class="footer-end"/);
  assert.match(html, /class="footer-proof-label"/);
  assert.match(
    proofTableCss,
    /@media \(min-width: 1100px\)[\s\S]*?\.footer-inner\s*\{[^}]*grid-template-columns:/,
  );
});


test('footer compacts into a two-column proof ticket on small screens', () => {
  assert.match(
    proofTableCss,
    /@media \(max-width: 1099px\)[\s\S]*?\.footer-inner\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/,
  );
  assert.match(proofTableCss, /@media \(max-width: 520px\)[\s\S]*?\.social-label\s*\{[^}]*display:\s*none/);
});


test('social links are accessible, safe, and keep 44px targets', () => {
  for (const [label, href] of socialLinks) {
    const anchorPattern = new RegExp(
      `<a[^>]*class="social-link[^"]*"[^>]*href="${escapeRegExp(href)}"[^>]*>`,
      'i',
    );
    const anchor = html.match(anchorPattern)?.[0];

    assert.ok(anchor, `Missing social link: ${href}`);
    assert.match(anchor, /target="_blank"/);
    assert.match(anchor, /rel="noopener noreferrer"/);
    assert.match(anchor, new RegExp(`aria-label="${escapeRegExp(label)}"`));
  }

  assert.match(html, /\.social-link\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
});


test('short landscape keeps the maker footer reachable after the workspace', () => {
  assert.match(html, /styles\/proof-table\.css\?v=310/);
  assert.doesNotMatch(
    proofTableCss,
    /\.progress-wrap,\s*\.status-bar,\s*\.app-footer\s*\{\s*display:\s*none\s*!important;/,
  );
  assert.match(
    proofTableCss,
    /\.progress-wrap,\s*\.status-bar\s*\{\s*display:\s*none\s*!important;/,
  );
});
