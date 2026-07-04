// ─── app.js ──────────────────────────────────────────────────────────────────
// Wiring: kamera + pilih template + jepret + composite + download. Glue tipis;
// logika berat ada di core/ (camera, compositor) & modules/ (templates).
import { startCamera, captureFrame } from './core/camera.js';
import { renderTemplate, setPhoto, setMeta, exportPng, download, placeSticker } from './core/compositor.js';
import { templates, resolveTemplateHtml, resolveTemplateDoc, templateDims } from './modules/templates/index.js';
import { getStickerPack } from './modules/stickers/index.js';

const $ = (id) => document.getElementById(id);
const video = $('video'), stage = $('canvasScale'), listEl = $('templateList');
const snapBtn = $('snapBtn'), retakeBtn = $('retakeBtn'), downloadBtn = $('downloadBtn');
const flipBtn = $('flipBtn'), countdownEl = $('countdown'), statusEl = $('status'), cameraWrap = $('cameraWrap');
const stickerTray = $('stickerTray'), cameraOverlay = $('cameraOverlay');

let currentTpl = templates[0];
let facing = 'user';
let phCanvas = null;
let tplButtons = [];        // { t, btn }
const thumbFrames = [];     // { frame, w } — buat rescale pas resize

// Bikin picker SEKALI (ada thumbnail preview frame per template). Klik = updateActive
// aja (bukan rebuild) biar thumbnail nggak regenerate & nggak flicker.
function renderList() {
  listEl.innerHTML = '';
  thumbFrames.length = 0;
  tplButtons = templates.map(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tpl-btn';
    btn.setAttribute('aria-pressed', 'false');

    const { w, h } = templateDims(t);
    const thumb = document.createElement('span');
    thumb.className = 'tpl-thumb';
    btn.appendChild(thumb);

    const meta = document.createElement('span');
    meta.className = 'tpl-meta';
    meta.innerHTML = `<span class="tpl-name">${t.name}${t.premium ? ' 🔒' : ''}</span><span class="cat">${t.category}</span>`;
    btn.appendChild(meta);

    btn.onclick = () => selectTemplate(t);
    listEl.appendChild(btn);
    buildThumb(t, thumb, w, h);
    return { t, btn };
  });
  updateActive();
}

function updateActive() {
  tplButtons.forEach(({ t, btn }) => {
    const on = t.id === currentTpl.id;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

function selectTemplate(t) { currentTpl = t; updateActive(); }

// Thumbnail = iframe (isolasi CSS penuh) berisi frame di-scale ke lebar kotaknya.
// Additive & aman: kalau gagal, kotak thumb tetap kosong, tombol tetap fungsi.
async function buildThumb(t, mount, w, h) {
  try {
    const doc = await resolveTemplateDoc(t);
    const frame = document.createElement('iframe');
    frame.className = 'tpl-thumb-frame';
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.srcdoc = doc;
    mount.appendChild(frame);
    thumbFrames.push({ frame, w, h });
    requestAnimationFrame(() => scaleThumb(frame, w, h));
  } catch (e) {
    console.debug('Thumbnail gagal dibuat:', t.id, e); // fallback: thumb kosong, tombol tetap jalan
  }
}

// Scale frame biar PAS TINGGI kotak, lalu center horizontal (frame utuh keliatan,
// single & strip sama-sama rapi tanpa kepanjangan).
function scaleThumb(frame, w, h) {
  const box = frame.parentElement;
  if (!box || !box.clientHeight) return;
  const s = box.clientHeight / h;
  const offX = Math.max(0, (box.clientWidth - w * s) / 2);
  frame.style.transform = `translateX(${offX}px) scale(${s})`;
}

let rescaleTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(rescaleTimer);
  rescaleTimer = setTimeout(() => thumbFrames.forEach(({ frame, w, h }) => scaleThumb(frame, w, h)), 120);
});

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

flipBtn.onclick = () => {
  facing = facing === 'user' ? 'environment' : 'user';
  startCam();
};

// ── kamera + empty-state overlay ──
const camMsg = $('camMsg');
function showOverlay(msg) { if (camMsg) camMsg.textContent = msg; if (cameraOverlay) cameraOverlay.style.display = 'flex'; }
function hideOverlay() { if (cameraOverlay) cameraOverlay.style.display = 'none'; }

async function startCam() {
  showOverlay('Menyalakan kamera…');
  snapBtn.disabled = true;
  try {
    await startCamera(video, facing);
    hideOverlay();
    snapBtn.disabled = false;
    statusEl.textContent = 'Pilih frame, lalu jepret ✦';
  } catch (err) {
    showOverlay('Kamera belum aktif — izinin akses kamera di browser dulu ya ✦');
    statusEl.textContent = '⚠️ Nggak bisa akses kamera: ' + err.message;
  }
}

// ── init ──
renderList();
startCam();
