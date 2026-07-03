// ─── modules/templates/loader.js ──────────────────────────────────────────────
// Template file HTML dari GPT itu dokumen standalone (<html><head><body>) dengan
// CSS level-halaman (html/body/* /:root). Kalau di-inject apa adanya, CSS itu
// BOCOR ke seluruh app (body app ke-override → tema & layout rusak).
// Loader ini: fetch file → ambil <style>+.ph-canvas → SCOPE semua CSS-nya ke
// .ph-canvas biar nggak bocor → suntik font <link> Google Fonts sekali ke document.
const fragmentCache = new Map();

export async function loadTemplateFragment(path) {
  if (fragmentCache.has(path)) return fragmentCache.get(path);

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Gagal load template ${path}: ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

  // Font Google Fonts dari <head> template → suntik ke document utama (sekali).
  doc.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link.cloneNode(true));
    }
  });

  const canvas = doc.querySelector('.ph-canvas');
  if (!canvas) throw new Error(`Template ${path} nggak punya .ph-canvas`);

  const rawCss = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const scopedCss = scopeCss(rawCss, '.ph-canvas');

  const html = `<style>${scopedCss}</style>${canvas.outerHTML}`;
  fragmentCache.set(path, html);
  return html;
}

// Scope semua rule CSS ke `scope` (.ph-canvas) pakai CSSOM browser (handle @media,
// @keyframes, dst dengan benar). Rule level-halaman (html/body) dibuang; :root & *
// diarahkan ke scope biar CSS variables & reset tetap jalan TAPI nggak bocor keluar.
function scopeCss(cssText, scope) {
  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  document.head.appendChild(styleEl);
  let rules;
  try {
    rules = styleEl.sheet.cssRules;
  } catch {
    styleEl.remove();
    return cssText; // fallback: kalau CSSOM gagal, mending render (bocor) daripada kosong
  }
  const out = [];
  for (const rule of rules) {
    const s = scopeRule(rule, scope);
    if (s) out.push(s);
  }
  styleEl.remove();
  return out.join('\n');
}

function scopeRule(rule, scope) {
  if (rule.type === 1) { // CSSStyleRule
    const sel = scopeSelectorList(rule.selectorText, scope);
    return sel ? `${sel}{${rule.style.cssText}}` : '';
  }
  if (rule.type === 4) { // CSSMediaRule
    const inner = [...rule.cssRules].map(r => scopeRule(r, scope)).filter(Boolean).join('\n');
    return inner ? `@media ${rule.media.mediaText}{${inner}}` : '';
  }
  return rule.cssText; // @keyframes / @font-face / lainnya → biarin apa adanya
}

function scopeSelectorList(selectorText, scope) {
  const scoped = selectorText.split(',').map(sel => scopeOne(sel.trim(), scope)).filter(Boolean);
  return scoped.join(',');
}

function scopeOne(sel, scope) {
  if (!sel) return '';
  if (sel === ':root') return scope;                              // CSS vars → definisikan di .ph-canvas
  if (sel === '*') return `${scope} *`;                            // universal reset → scope ke dalam
  if (/^(html|body)\b/.test(sel)) return '';                       // page-level → buang (jangan bocor)
  if (sel === scope || sel.startsWith(scope)) return sel;          // udah di root canvas
  return `${scope} ${sel}`;                                        // sisanya = descendant → prefix scope
}
