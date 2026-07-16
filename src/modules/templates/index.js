// ─── modules/templates/index.js ──────────────────────────────────────────────
// Registry template. Tiap template = { id, name, category, premium, html } ATAU
// { id, name, category, premium, file } — file di-load lazy lewat loader.js
// (fetch + DOMParser, ambil <style>+.ph-canvas dari file HTML standalone GPT).
// Prioritas viral (RISET.md): Newspaper, Y2K Korean, Vintage Film, Purikura, Live Frame.
import { loadTemplateFragment, loadTemplateDoc, buildTemplateDoc } from './loader.js';

const kosmik = {
  id: 'kosmik', name: 'Kosmik', category: 'kosmik', premium: false,
  html: `
  <div class="ph-canvas" style="width:1080px;height:1350px;position:relative;overflow:hidden;font-family:'Fredoka','Space Grotesk',sans-serif;color:#eef;background:radial-gradient(130% 100% at 50% -10%, #2b2456 0%, #15123a 42%, #0a0a1c 100%);">
    <div style="position:absolute;inset:0;background:radial-gradient(55% 40% at 14% 18%, rgba(139,123,255,.38), transparent 70%),radial-gradient(50% 34% at 86% 14%, rgba(78,183,248,.30), transparent 70%),radial-gradient(60% 46% at 72% 92%, rgba(236,94,158,.24), transparent 70%);"></div>
    <div style="position:absolute;inset:0;background-image:radial-gradient(1.7px 1.7px at 12% 20%,#fff,transparent),radial-gradient(1.2px 1.2px at 66% 12%,#fff9,transparent),radial-gradient(1.9px 1.9px at 40% 60%,#fff,transparent),radial-gradient(1.2px 1.2px at 86% 52%,#fffb,transparent),radial-gradient(1px 1px at 24% 82%,#fff8,transparent),radial-gradient(1.5px 1.5px at 92% 80%,#fff,transparent),radial-gradient(1px 1px at 55% 30%,#fff7,transparent),radial-gradient(1.3px 1.3px at 8% 54%,#fff9,transparent),radial-gradient(1px 1px at 74% 68%,#fff8,transparent);"></div>
    <div style="position:absolute;right:-70px;top:-70px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle at 34% 30%, #c3b6ff, #6a5acd 58%, #35296f);box-shadow:0 0 90px 12px rgba(139,123,255,.5);opacity:.9;"></div>
    <div style="position:absolute;top:74px;left:0;right:0;text-align:center;">
      <div style="font-weight:700;font-size:50px;letter-spacing:1px;color:#fff;text-shadow:0 0 26px rgba(139,123,255,.85);">Polara <span style="color:#ffe26f;">✦</span></div>
      <div style="font-size:19px;letter-spacing:8px;opacity:.55;margin-top:4px;">C O S M I C</div>
    </div>
    <div class="ph-slot" data-slot="1" style="position:absolute;left:140px;top:172px;width:800px;height:1000px;border-radius:30px;overflow:hidden;border:2px solid rgba(139,123,255,.6);box-shadow:0 0 64px rgba(139,123,255,.5),inset 0 0 42px rgba(0,0,0,.45);background:#14122e;display:flex;align-items:center;justify-content:center;color:#5a5a7a;font-size:2rem;">FOTO</div>
    <div style="position:absolute;left:66px;top:150px;font-size:36px;color:#ffe26f;text-shadow:0 0 14px #ffe26f;">✦</div>
    <div style="position:absolute;right:74px;bottom:240px;font-size:28px;color:#8fd3ff;text-shadow:0 0 14px #8fd3ff;">✦</div>
    <div style="position:absolute;left:88px;bottom:280px;font-size:20px;color:#fff;opacity:.85;">✧</div>
    <div style="position:absolute;left:0;right:0;bottom:56px;text-align:center;">
      <div class="ph-caption" style="font-weight:600;font-size:42px;color:#fff;text-shadow:0 0 16px rgba(139,123,255,.7);">Nama</div>
      <div class="ph-date" style="font-size:24px;opacity:.55;margin-top:4px;letter-spacing:2px;"> </div>
    </div>
    <div class="ph-brand" style="position:absolute;right:32px;bottom:26px;font-size:22px;opacity:.7;color:#8b7bff;">made with Polara</div>
    <div class="ph-sticker-layer" style="position:absolute;inset:0;pointer-events:none;"></div>
  </div>`,
};

const TEMPLATES_DIR = 'src/modules/templates/';

// 5 prioritas viral 🔴 (RISET.md)
const polaraDaily = { id: 'polara-daily', name: 'Polara Daily', category: 'newspaper', premium: false, file: TEMPLATES_DIR + 'polara-daily.single.html' };
const seoulSnapY2k = { id: 'seoul-snap-y2k', name: 'Seoul Snap Y2K', category: 'y2k-korean', premium: false, file: TEMPLATES_DIR + 'seoul-snap-y2k.single.html' };
const vintageFilmLofi = { id: 'vintage-film-lofi', name: 'Vintage Film Lo-Fi', category: 'vintage-film', premium: false, file: TEMPLATES_DIR + 'vintage-film-lofi.strip.html' };
const pocaPurikura = { id: 'poca-purikura', name: 'Poca Purikura', category: 'purikura', premium: false, file: TEMPLATES_DIR + 'poca-purikura.single.v2.html' };
const liveFrameCinemagraph = { id: 'live-frame-cinemagraph', name: 'Live Frame Cinemagraph', category: 'live-frame', premium: false, file: TEMPLATES_DIR + 'live-frame-cinemagraph.strip.html' };

// 5 sekunder 🟠🟡 (RISET.md)
const cyberY2kNeon = { id: 'cyber-y2k-neon', name: 'Cyber Y2K Neon', category: 'cyber-y2k', premium: false, file: TEMPLATES_DIR + 'cyber-y2k-neon.single.html' };
const auraGradientDreamy = { id: 'aura-gradient-dreamy', name: 'Aura Gradient', category: 'aura-gradient', premium: false, file: TEMPLATES_DIR + 'aura-gradient-dreamy.single.html' };
const darkRomanticEditorial = { id: 'dark-romantic-editorial', name: 'Dark Romantic', category: 'dark-romantic', premium: false, file: TEMPLATES_DIR + 'dark-romantic-editorial.single.html' };
const cottagecoreBotanical = { id: 'cottagecore-botanical', name: 'Cottagecore', category: 'cottagecore', premium: false, file: TEMPLATES_DIR + 'cottagecore-botanical.single.html' };
const tradingCardId = { id: 'trading-card-id', name: 'Trading Card', category: 'trading-card', premium: false, file: TEMPLATES_DIR + 'trading-card-id.single.html' };

export const templates = [
  kosmik,
  polaraDaily, seoulSnapY2k, vintageFilmLofi, pocaPurikura, liveFrameCinemagraph,
  cyberY2kNeon, auraGradientDreamy, darkRomanticEditorial, cottagecoreBotanical, tradingCardId,
];
export const getTemplate = (id) => templates.find(t => t.id === id) || templates[0];

// Balikin markup .ph-canvas (+ style) siap-pakai, baik dari `html` inline maupun `file` lazy-load.
export async function resolveTemplateHtml(template) {
  return template.file ? loadTemplateFragment(template.file) : template.html;
}

// Dimensi kanvas: file *.strip.* = 720×1800 (3 slot foto), sisanya 1080×1350 (1 slot, 4:5).
export const templateDims = (t) => (t.file && t.file.includes('.strip.')) ? { w: 720, h: 1800, slots: 3 } : { w: 1080, h: 1350, slots: 1 };

// Dokumen HTML utuh buat iframe thumbnail preview (lihat loader.js).
const KOSMIK_FONT = '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">';
export async function resolveTemplateDoc(t) {
  return t.file ? loadTemplateDoc(t.file) : buildTemplateDoc(KOSMIK_FONT, '', t.html);
}
