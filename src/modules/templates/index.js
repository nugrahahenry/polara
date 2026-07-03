// ─── modules/templates/index.js ──────────────────────────────────────────────
// Registry template. Tiap template = { id, name, category, premium, html } ATAU
// { id, name, category, premium, file } — file di-load lazy lewat loader.js
// (fetch + DOMParser, ambil <style>+.ph-canvas dari file HTML standalone GPT).
// Prioritas viral (RISET.md): Newspaper, Y2K Korean, Vintage Film, Purikura, Live Frame.
import { loadTemplateFragment } from './loader.js';

const kosmik = {
  id: 'kosmik', name: 'Kosmik', category: 'kosmik', premium: false,
  html: `
  <div class="ph-canvas" style="width:1080px;height:1350px;position:relative;overflow:hidden;
       background:radial-gradient(120% 90% at 50% 0%, #1b1b3a 0%, #0a0a14 70%);
       font-family:'Space Grotesk',sans-serif;color:#e8e8f2;">
    <div style="position:absolute;inset:0;background-image:
         radial-gradient(1.5px 1.5px at 18% 28%, #ffffffcc, transparent),
         radial-gradient(1px 1px at 68% 18%, #ffffff99, transparent),
         radial-gradient(1.5px 1.5px at 42% 66%, #ffffffaa, transparent),
         radial-gradient(1px 1px at 86% 56%, #ffffff88, transparent),
         radial-gradient(1px 1px at 30% 85%, #ffffff77, transparent);"></div>
    <div class="ph-slot" data-slot="1" style="position:absolute;left:90px;top:150px;width:900px;height:900px;
         border-radius:24px;overflow:hidden;border:2px solid #8b7bff66;box-shadow:0 0 70px #8b7bff44;
         background:#1a1a2e;display:flex;align-items:center;justify-content:center;color:#666;font-size:2rem;">FOTO 1</div>
    <div style="position:absolute;left:0;right:0;top:1085px;text-align:center;">
      <div class="ph-caption" style="font-size:48px;font-weight:700;letter-spacing:.5px;">Polara</div>
      <div class="ph-date" style="font-size:28px;opacity:.55;margin-top:6px;">—</div>
    </div>
    <div class="ph-brand" style="position:absolute;right:38px;bottom:30px;font-size:26px;opacity:.75;color:#8b7bff;">Polara ✦</div>
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
