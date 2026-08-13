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
  assert.match(html, /class="maker-link"[^>]*>Henry Nugraha<\/a>/);
  assert.match(html, /Your photos stay on your device — no upload, no account\./);
  assert.match(html, /© 2026 Polara · Digital photobooth/);
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
  assert.match(html, /styles\/proof-table\.css\?v=16/);
  assert.doesNotMatch(
    proofTableCss,
    /\.progress-wrap,\s*\.status-bar,\s*\.app-footer\s*\{\s*display:\s*none\s*!important;/,
  );
  assert.match(
    proofTableCss,
    /\.progress-wrap,\s*\.status-bar\s*\{\s*display:\s*none\s*!important;/,
  );
});
