// ─── modules/templates/index.js ──────────────────────────────────────────────
// Registry template. Tiap template = { id, name, category, premium, html } ATAU
// { id, name, category, premium, file } — file di-load lazy lewat loader.js
// (fetch + DOMParser, ambil <style>+.ph-canvas dari file HTML standalone GPT).
// Prioritas viral (RISET.md): Newspaper, Y2K Korean, Vintage Film, Purikura, Live Frame.
import { loadTemplateFragment, loadTemplateDoc, buildTemplateDoc } from './loader.js';

const kosmik = {
  id: 'kosmik', name: 'Kosmik', category: 'kosmik', mode: 'single', premium: false,
  status: 'temporary-code-frame', thumbnailSrc: null, overlaySrc: null,
  html: `
  <div class="ph-canvas" style="width:1080px;height:1350px;position:relative;overflow:hidden;font-family:'Fredoka','Nunito',sans-serif;color:#eef;background:radial-gradient(130% 100% at 50% -10%, #2b2456 0%, #15123a 42%, #0a0a1c 100%);">
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

// Frame P0 yang belum punya file legacy dibuat code-based melalui kontrak yang
// sama. Saat overlay P1 siap, cukup isi overlaySrc/thumbnailSrc di registry.
function codeFrame({ id, familyId, name, category, mode, tone, background, accent, ink, label }) {
  const strip = mode === 'strip';
  const width = strip ? 720 : 1080;
  const height = strip ? 1800 : 1350;
  const slotTop = strip ? 214 : 174;
  const slotHeight = strip ? 388 : 960;
  const slotWidth = strip ? 568 : 888;
  const slotLeft = strip ? 76 : 96;
  const slotGap = 426;
  const slotBorder = category === 'vintage-film' ? '#f4e5c7' : '#fff';
  const slotRadius = category === 'vintage-film' ? 8 : category === 'y2k-korean' ? 24 : 30;
  const slots = Array.from({ length: strip ? 3 : 1 }, (_, index) => `
    <div class="ph-slot" data-slot="${index + 1}" style="position:absolute;left:${slotLeft}px;top:${slotTop + index * slotGap}px;width:${slotWidth}px;height:${slotHeight}px;overflow:hidden;border:${strip ? 7 : 10}px solid ${slotBorder};border-radius:${slotRadius}px;background:${background};box-shadow:0 18px 38px rgba(75,46,31,.2);display:grid;place-items:center;color:${ink};font:700 ${strip ? 28 : 42}px Fredoka,sans-serif;z-index:8;">FOTO${strip ? ` ${index + 1}` : ''}</div>
  `).join('');

  const familyChrome = category === 'purikura'
    ? `<div style="position:absolute;inset:28px;border:7px solid #fff;border-radius:42px;box-shadow:0 0 0 4px rgba(255,143,189,.34),inset 0 0 0 3px rgba(75,46,31,.08);z-index:2;"></div>
      <div style="position:absolute;left:112px;right:112px;top:54px;height:98px;border:7px solid #fff;border-radius:999px;background:linear-gradient(180deg,#ffb9d5,#ff8fbd);box-shadow:0 12px 28px rgba(75,46,31,.16);display:grid;place-items:center;font:700 38px Fredoka,sans-serif;color:#fff;z-index:10;">${label}</div>
      <div style="position:absolute;left:-28px;top:96px;width:122px;height:122px;border-radius:50%;background:#ffe26f;border:7px solid #fff;z-index:4;"></div>
      <div style="position:absolute;right:-34px;top:690px;width:138px;height:138px;border-radius:50%;background:#cab8ff;border:7px solid #fff;z-index:4;"></div>
      <div style="position:absolute;left:-30px;bottom:86px;width:116px;height:116px;border-radius:50%;background:#8fd3ff;border:7px solid #fff;z-index:4;"></div>`
    : category === 'y2k-korean'
      ? `<div style="position:absolute;inset:30px;border:7px solid rgba(255,255,255,.94);border-radius:38px;box-shadow:0 0 0 4px rgba(255,143,189,.2),0 24px 58px rgba(56,38,31,.12);z-index:2;"></div>
        <div style="position:absolute;left:58px;right:58px;top:52px;height:112px;border:4px solid rgba(56,38,31,.14);border-radius:30px;background:rgba(255,255,255,.88);box-shadow:0 12px 28px rgba(56,38,31,.1);display:flex;align-items:center;justify-content:space-between;padding:0 28px;z-index:10;">
          <span style="display:flex;align-items:center;gap:12px;font:700 18px 'Space Mono',monospace;letter-spacing:.08em;"><span style="width:18px;height:18px;border-radius:50%;background:#ff5f86;box-shadow:0 0 0 6px rgba(255,95,134,.16);"></span>REC 2003</span>
          <strong style="font:700 30px Fredoka,sans-serif;">${label}</strong>
          <span style="width:58px;height:28px;border:4px solid #38261f;border-radius:8px;box-shadow:inset -14px 0 #8fd3ff;"></span>
        </div>
        <div style="position:absolute;right:-40px;top:570px;width:142px;height:142px;border-radius:42px;background:#cab8ff;border:7px solid #fff;transform:rotate(12deg);z-index:4;"></div>
        <div style="position:absolute;left:-38px;bottom:116px;width:126px;height:126px;border-radius:50%;background:#ffe26f;border:7px solid #fff;z-index:4;"></div>`
      : `<div style="position:absolute;inset:34px 46px;border:5px solid rgba(255,246,223,.42);background:linear-gradient(180deg,rgba(255,246,223,.07),rgba(255,246,223,.02));box-shadow:inset 0 0 70px rgba(0,0,0,.42);z-index:2;"></div>
        <div style="position:absolute;left:18px;top:44px;bottom:44px;width:34px;background:repeating-linear-gradient(180deg,#f4e5c7 0 26px,transparent 26px 52px);opacity:.72;z-index:4;"></div>
        <div style="position:absolute;right:18px;top:44px;bottom:44px;width:34px;background:repeating-linear-gradient(180deg,#f4e5c7 0 26px,transparent 26px 52px);opacity:.72;z-index:4;"></div>
        <div style="position:absolute;left:112px;right:112px;top:58px;height:82px;border-block:3px solid rgba(255,246,223,.48);display:grid;place-items:center;font:700 34px 'Libre Baskerville',Georgia,serif;letter-spacing:.08em;color:#fff2d0;z-index:10;">${label}</div>`;

  const rootBackground = category === 'purikura'
    ? 'radial-gradient(circle at 10% 10%,#ffe26f 0 6%,transparent 6.5%),radial-gradient(circle at 91% 12%,#8fd3ff 0 8%,transparent 8.5%),radial-gradient(circle at 10% 88%,#cab8ff 0 8%,transparent 8.5%),linear-gradient(145deg,#fffaf4,#ffe8f1 52%,#e7f6ff)'
    : category === 'y2k-korean'
      ? 'linear-gradient(rgba(255,143,189,.13) 2px,transparent 2px),linear-gradient(90deg,rgba(110,199,255,.13) 2px,transparent 2px),linear-gradient(145deg,#fffaf7,#fff0f7 48%,#eaf6ff)'
      : 'radial-gradient(circle at 10% 16%,rgba(243,162,95,.34),transparent 24%),radial-gradient(circle at 90% 82%,rgba(207,89,75,.24),transparent 28%),linear-gradient(180deg,#2a1d16,#17110d 52%,#2a1b15)';
  const rootBackgroundSize = category === 'y2k-korean' ? '40px 40px,40px 40px,auto' : 'auto';
  const metaColor = category === 'vintage-film' ? '#f4e5c7' : ink;

  return {
    id, familyId, name, category, mode, tone, premium: false,
    status: 'temporary-code-frame', pickerBadge: 'Hero', pickerDetail: strip ? '3 foto' : '1 foto',
    thumbnailSrc: null, overlaySrc: null,
    html: `<div class="ph-canvas" data-frame-id="${id}" style="position:relative;width:${width}px;height:${height}px;overflow:hidden;isolation:isolate;background:${rootBackground};background-size:${rootBackgroundSize};color:${ink};font-family:Nunito,sans-serif;">
      ${familyChrome}${slots}
      <div class="ph-caption" style="position:absolute;left:${strip ? 90 : 130}px;right:${strip ? 90 : 130}px;bottom:${strip ? 102 : 92}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font:700 ${strip ? 30 : 38}px Fredoka,sans-serif;color:${metaColor};z-index:10;">Polara memory</div>
      <div class="ph-date" style="position:absolute;left:${strip ? 68 : 70}px;bottom:${strip ? 48 : 42}px;font:700 ${strip ? 16 : 21}px Nunito,sans-serif;color:${metaColor};z-index:10;">1 Agustus 2026</div>
      <div class="ph-brand" style="position:absolute;right:${strip ? 66 : 68}px;bottom:${strip ? 48 : 40}px;font:800 ${strip ? 16 : 20}px Nunito,sans-serif;color:${metaColor};z-index:10;">made with Polara</div>
      <div class="ph-sticker-layer" style="position:absolute;inset:0;z-index:30;pointer-events:none;"></div>
    </div>`,
  };
}

// 5 prioritas viral 🔴 (RISET.md)
const polaraDaily = { id: 'polara-daily', name: 'Polara Daily', category: 'newspaper', mode: 'single', premium: false, file: TEMPLATES_DIR + 'polara-daily.single.html' };
const seoulSnapY2k = { id: 'seoul-snap-y2k.single', familyId: 'seoul-snap-y2k', name: 'Seoul Snap Y2K', category: 'y2k-korean', mode: 'single', tone: 'statement', status: 'temporary-code-frame', pickerBadge: 'Hero', pickerDetail: '1 foto', thumbnailSrc: null, overlaySrc: null, premium: false, file: TEMPLATES_DIR + 'seoul-snap-y2k.single.html' };
const vintageFilmLofi = { id: 'vintage-film-lofi.strip', familyId: 'vintage-film-lofi', name: 'Vintage Film Lo-Fi', category: 'vintage-film', mode: 'strip', tone: 'nostalgia', status: 'temporary-code-frame', pickerBadge: 'Hero', pickerDetail: '3 foto', thumbnailSrc: null, overlaySrc: null, premium: false, file: TEMPLATES_DIR + 'vintage-film-lofi.strip.html' };
const pocaPurikura = { id: 'poca-purikura.single', familyId: 'poca-purikura', name: 'Poca Purikura', category: 'purikura', mode: 'single', tone: 'brand-hero', status: 'temporary-code-frame', pickerBadge: 'Hero', pickerDetail: '1 foto', thumbnailSrc: null, overlaySrc: null, premium: false, file: TEMPLATES_DIR + 'poca-purikura.single.v2.html' };
const liveFrameCinemagraph = {
  id: 'live-frame-cinemagraph', name: 'Live Frame — Statis', category: 'live-frame', mode: 'strip',
  premium: false, status: 'experimental-static', pickerBadge: 'Eksperimental',
  pickerDetail: 'Gaya live · hasil PNG', thumbnailFocus: .08,
  file: TEMPLATES_DIR + 'live-frame-cinemagraph.strip.html',
};

const vintageFilmSingle = codeFrame({ id: 'vintage-film-lofi.single', familyId: 'vintage-film-lofi', name: 'Vintage Film Lo-Fi', category: 'vintage-film', mode: 'single', tone: 'nostalgia', background: '#eee1c9', accent: '#6f4934', ink: '#2b1b13', label: 'ANALOG MEMORY' });
const pocaPurikuraStrip = codeFrame({ id: 'poca-purikura.strip', familyId: 'poca-purikura', name: 'Poca Purikura', category: 'purikura', mode: 'strip', tone: 'brand-hero', background: '#ffd8e8', accent: '#8fd3ff', ink: '#4b2e1f', label: 'POLARA PURRIKURA' });
const seoulSnapY2kStrip = codeFrame({ id: 'seoul-snap-y2k.strip', familyId: 'seoul-snap-y2k', name: 'Seoul Snap Y2K', category: 'y2k-korean', mode: 'strip', tone: 'statement', background: '#eaf7ff', accent: '#cab8ff', ink: '#38261f', label: 'SEOUL SNAP 2003' });

// 5 sekunder 🟠🟡 (RISET.md)
const cyberY2kNeon = { id: 'cyber-y2k-neon', name: 'Cyber Y2K Neon', category: 'cyber-y2k', mode: 'single', premium: false, file: TEMPLATES_DIR + 'cyber-y2k-neon.single.html' };
const auraGradientDreamy = { id: 'aura-gradient-dreamy', name: 'Aura Gradient', category: 'aura-gradient', mode: 'single', premium: false, file: TEMPLATES_DIR + 'aura-gradient-dreamy.single.html' };
const darkRomanticEditorial = { id: 'dark-romantic-editorial', name: 'Dark Romantic', category: 'dark-romantic', mode: 'single', premium: false, file: TEMPLATES_DIR + 'dark-romantic-editorial.single.html' };
const cottagecoreBotanical = { id: 'cottagecore-botanical', name: 'Cottagecore', category: 'cottagecore', mode: 'single', premium: false, file: TEMPLATES_DIR + 'cottagecore-botanical.single.html' };
const tradingCardId = { id: 'trading-card-id', name: 'Trading Card', category: 'trading-card', mode: 'single', premium: false, file: TEMPLATES_DIR + 'trading-card-id.single.html' };

export const templates = [
  pocaPurikura, vintageFilmSingle, seoulSnapY2k,
  pocaPurikuraStrip, vintageFilmLofi, seoulSnapY2kStrip,
  kosmik, polaraDaily, liveFrameCinemagraph,
  cyberY2kNeon, auraGradientDreamy, darkRomanticEditorial, cottagecoreBotanical, tradingCardId,
];
export const getTemplate = (id) => templates.find(t => t.id === id) || templates[0];

// Balikin markup .ph-canvas (+ style) siap-pakai, baik dari `html` inline maupun `file` lazy-load.
export async function resolveTemplateHtml(template) {
  return template.file ? loadTemplateFragment(template.file) : template.html;
}

// Dimensi kanvas: file *.strip.* = 720×1800 (3 slot foto), sisanya 1080×1350 (1 slot, 4:5).
export const templateDims = (t) => t.mode === 'strip' || (t.file && t.file.includes('.strip.'))
  ? { w: 720, h: 1800, slots: 3 }
  : { w: 1080, h: 1350, slots: 1 };

// Dokumen HTML utuh buat iframe thumbnail preview (lihat loader.js).
const KOSMIK_FONT = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Nunito:wght@600;800&display=swap" rel="stylesheet">';
export async function resolveTemplateDoc(t) {
  return t.file ? loadTemplateDoc(t.file) : buildTemplateDoc(KOSMIK_FONT, '', t.html);
}
