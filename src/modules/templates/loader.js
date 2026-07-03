// ─── modules/templates/loader.js ──────────────────────────────────────────────
// Template file HTML dari GPT itu dokumen standalone (<html><head><body>).
// Loader ini fetch file itu apa adanya, lalu ambil cuma <style> + .ph-canvas
// (jadi file asli nggak perlu dipotong manual tiap kali GPT bikin versi baru).
// Font <link> Google Fonts di <head> template ikut disuntik ke document sekali
// (biar nggak dobel kalau template yang sama dipilih ulang).
const fragmentCache = new Map();

export async function loadTemplateFragment(path) {
  if (fragmentCache.has(path)) return fragmentCache.get(path);

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Gagal load template ${path}: ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

  doc.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link.cloneNode(true));
    }
  });

  const style = doc.querySelector('style');
  const canvas = doc.querySelector('.ph-canvas');
  if (!canvas) throw new Error(`Template ${path} nggak punya .ph-canvas`);

  const html = `${style ? style.outerHTML : ''}${canvas.outerHTML}`;
  fragmentCache.set(path, html);
  return html;
}
