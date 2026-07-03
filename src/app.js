// ─── app.js ──────────────────────────────────────────────────────────────────
// Wiring: kamera + pilih template + jepret + composite + download. Glue tipis;
// logika berat ada di core/ (camera, compositor) & modules/ (templates).
import { startCamera, captureFrame } from './core/camera.js';
import { renderTemplate, setPhoto, setMeta, exportPng, download, placeSticker } from './core/compositor.js';
import { templates, resolveTemplateHtml } from './modules/templates/index.js';
import { getStickerPack } from './modules/stickers/index.js';

const $ = (id) => document.getElementById(id);
const video = $('video'), stage = $('canvasScale'), listEl = $('templateList');
const snapBtn = $('snapBtn'), retakeBtn = $('retakeBtn'), downloadBtn = $('downloadBtn');
const flipBtn = $('flipBtn'), countdownEl = $('countdown'), statusEl = $('status'), cameraWrap = $('cameraWrap');
const stickerTray = $('stickerTray');

let currentTpl = templates[0];
let facing = 'user';
let phCanvas = null;

function renderList() {
  listEl.innerHTML = '<h3>Template</h3>';
  templates.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tpl-btn' + (t.id === currentTpl.id ? ' active' : '');
    b.innerHTML = `<div>${t.name}${t.premium ? ' 🔒' : ''}</div><div class="cat">${t.category}</div>`;
    b.onclick = () => { currentTpl = t; renderList(); };
    listEl.appendChild(b);
  });
}

function countdown(n) {
  return new Promise(resolve => {
    countdownEl.style.display = 'flex';
    const tick = () => {
      if (n <= 0) { countdownEl.style.display = 'none'; resolve(); return; }
      countdownEl.textContent = n--; setTimeout(tick, 800);
    };
    tick();
  });
}

function renderStickerTray() {
  const pack = getStickerPack(currentTpl.category);
  stickerTray.innerHTML = '';
  if (!pack.length) { stickerTray.style.display = 'none'; return; }
  stickerTray.style.display = 'flex';
  pack.forEach(s => {
    const b = document.createElement('button');
    b.className = 'sticker-btn';
    b.title = s.name;
    b.innerHTML = `<img src="${s.file}" alt="${s.name}" />`;
    b.onclick = () => placeSticker(phCanvas, s.file);
    stickerTray.appendChild(b);
  });
}

function fitStage() {
  const maxW = Math.min(window.innerWidth * 0.42, 460);
  const scale = maxW / 1080;
  stage.style.transform = `scale(${scale})`;
  stage.style.width = '1080px';
  stage.style.height = (1350 * scale) + 'px';
}

snapBtn.onclick = async () => {
  snapBtn.disabled = true;
  await countdown(3);
  cameraWrap.style.filter = 'brightness(3)';            // flash
  setTimeout(() => (cameraWrap.style.filter = ''), 120);

  const photo = captureFrame(video);
  statusEl.textContent = 'Menyiapkan template...';
  const html = await resolveTemplateHtml(currentTpl);
  phCanvas = renderTemplate(stage, html);
  setPhoto(phCanvas, photo);
  setMeta(phCanvas, { date: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) });

  fitStage();
  stage.style.display = 'block';
  cameraWrap.style.display = 'none';
  snapBtn.style.display = 'none';
  retakeBtn.style.display = '';
  downloadBtn.style.display = '';
  renderStickerTray();
  statusEl.textContent = 'Suka? Tempel stiker, download ✦, atau ulangi jepret.';
};

retakeBtn.onclick = () => {
  stage.style.display = 'none';
  cameraWrap.style.display = '';
  snapBtn.style.display = ''; snapBtn.disabled = false;
  retakeBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  stickerTray.style.display = 'none'; stickerTray.innerHTML = '';
  statusEl.textContent = 'Pilih template, lalu jepret.';
};

downloadBtn.onclick = async () => {
  downloadBtn.disabled = true;
  statusEl.textContent = 'Menyiapkan PNG...';
  try {
    const url = await exportPng(phCanvas);
    download(url, `polara-${currentTpl.id}-${Date.now()}.png`);
    statusEl.textContent = 'Tersimpan! ✦';
  } catch (e) {
    statusEl.textContent = 'Gagal export: ' + e.message;
  }
  downloadBtn.disabled = false;
};

flipBtn.onclick = async () => {
  facing = facing === 'user' ? 'environment' : 'user';
  try { await startCamera(video, facing); } catch (e) { statusEl.textContent = 'Gagal ganti kamera: ' + e.message; }
};

// ── init ──
renderList();
startCamera(video, facing).catch(err => {
  statusEl.textContent = '⚠️ Nggak bisa akses kamera: ' + err.message + ' — izinin kamera di browser ya.';
});
