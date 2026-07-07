// ─── app.js ──────────────────────────────────────────────────────────────────
// Flow: pilih MODE (1 / 3 foto) → pilih FRAME (difilter mode) → JEPRET (1x atau
// 3x berurutan) → tempel STIKER → SIMPAN. Stepper nunjukin tahapan.
// Logika berat di core/ (camera, compositor) & modules/ (templates, stickers).
import { startCamera, captureFrame } from './core/camera.js';
import { renderTemplate, setPhotoSlot, setMeta, exportPng, download, placeSticker } from './core/compositor.js';
import { templates, resolveTemplateHtml, resolveTemplateDoc, templateDims } from './modules/templates/index.js';
import { getStickerPack } from './modules/stickers/index.js';

const $ = (id) => document.getElementById(id);
const video = $('video'), stage = $('canvasScale'), listEl = $('templateList');
const snapBtn = $('snapBtn'), retakeBtn = $('retakeBtn'), downloadBtn = $('downloadBtn');
const flipBtn = $('flipBtn'), countdownEl = $('countdown'), statusEl = $('status'), cameraWrap = $('cameraWrap');
const stickerTray = $('stickerTray'), cameraOverlay = $('cameraOverlay'), camMsg = $('camMsg');
const stepperEl = $('stepper'), modeChoose = $('modeChoose');

let mode = 1;              // 1 = single (1 foto), 3 = strip (3 foto)
let currentTpl = null;
let facing = 'user';
let phCanvas = null;
let camReady = false;
let tplButtons = [];
const thumbFrames = [];

// ── stepper ──
const STEPS = [
  { id: 'mode', label: 'Mode' },
  { id: 'frame', label: 'Frame' },
  { id: 'shoot', label: 'Jepret' },
  { id: 'sticker', label: 'Stiker' },
  { id: 'save', label: 'Simpan' },
];
let stepIdx = 1;
function setStep(id) {
  const i = STEPS.findIndex(s => s.id === id);
  if (i >= 0) stepIdx = i;
  renderStepper();
}
function renderStepper() {
  stepperEl.innerHTML = '';
  STEPS.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'step' + (i < stepIdx ? ' done' : i === stepIdx ? ' active' : '');
    if (i === stepIdx) li.setAttribute('aria-current', 'step');
    li.innerHTML = `<span class="step-n">${i < stepIdx ? '✓' : i + 1}</span><span class="step-l">${s.label}</span>`;
    stepperEl.appendChild(li);
  });
}

// ── mode ──
function renderModeChoose() {
  modeChoose.querySelectorAll('.mode-btn').forEach(b => {
    const on = Number(b.dataset.mode) === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
function setMode(m) {
  mode = m;
  currentTpl = null;
  renderModeChoose();
  renderList();
  resetToCamera();
  setStep('frame');
  statusEl.textContent = mode === 3 ? 'Mode strip! Pilih frame-nya, nanti kamu jepret 3 kali.' : 'Pilih frame dulu, terus jepret ya.';
}
modeChoose.querySelectorAll('.mode-btn').forEach(b => (b.onclick = () => setMode(Number(b.dataset.mode))));

// ── daftar frame (difilter mode) ──
const framesForMode = () => templates.filter(t => templateDims(t).slots === mode);

function renderList() {
  listEl.innerHTML = '';
  thumbFrames.length = 0;
  tplButtons = framesForMode().map(t => {
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
    meta.innerHTML = `<span class="tpl-name">${t.name}</span><span class="cat">${t.category}</span>`;
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
    const on = !!(currentTpl && t.id === currentTpl.id);
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}
function selectTemplate(t) {
  currentTpl = t;
  updateActive();
  setStep('shoot');
  snapBtn.disabled = !camReady;
  statusEl.textContent = camReady
    ? (mode === 3 ? 'Udah siap. Klik Jepret, nanti diambil 3 foto.' : 'Udah siap. Klik Jepret kalau kamu udah oke.')
    : 'Nyalain kameranya dulu ya (izinin aksesnya).';
}

// ── thumbnail = iframe (isolasi CSS), di-scale pas tinggi kotak + center ──
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
    console.debug('Thumbnail gagal dibuat:', t.id, e);
  }
}
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

// ── countdown & flash ──
function countdown(n) {
  return new Promise((resolve) => {
    countdownEl.style.display = 'flex';
    const tick = () => {
      if (n <= 0) { countdownEl.style.display = 'none'; resolve(); return; }
      countdownEl.textContent = n--; setTimeout(tick, 800);
    };
    tick();
  });
}
function flash() {
  cameraWrap.style.filter = 'brightness(3)';
  setTimeout(() => (cameraWrap.style.filter = ''), 120);
}

// ── fit frame ke stage (container-based, bukan window*0.42 lama) ──
function fitStage(dims) {
  const card = stage.closest('.stage-card');
  const availW = Math.min((card ? card.clientWidth : 460) - 30, 460);
  const maxH = 560;
  const scale = Math.min(availW / dims.w, maxH / dims.h) || 0.4;
  stage.style.width = Math.round(dims.w * scale) + 'px';
  stage.style.height = Math.round(dims.h * scale) + 'px';
  if (phCanvas) {
    phCanvas.style.transformOrigin = 'top left';
    phCanvas.style.transform = `scale(${scale})`;
  }
}

// ── jepret (single = 1x, strip = 3x berurutan) ──
snapBtn.onclick = async () => {
  if (!currentTpl || !camReady) return;
  snapBtn.disabled = true; flipBtn.disabled = true;
  const dims = templateDims(currentTpl);
  const photos = [];
  for (let i = 1; i <= dims.slots; i++) {
    if (dims.slots > 1) statusEl.textContent = `Foto ke-${i} dari ${dims.slots}, siap-siap ya!`;
    await countdown(3);
    flash();
    photos.push(captureFrame(video));
    if (dims.slots > 1 && i < dims.slots) await new Promise(r => setTimeout(r, 700));
  }

  statusEl.textContent = 'Bentar ya, lagi disiapin hasilnya...';
  const html = await resolveTemplateHtml(currentTpl);
  phCanvas = renderTemplate(stage, html);
  photos.forEach((p, i) => setPhotoSlot(phCanvas, i + 1, p));
  setMeta(phCanvas, { date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) });

  fitStage(dims);
  stage.style.display = 'block';
  cameraWrap.style.display = 'none';
  snapBtn.style.display = 'none';
  retakeBtn.style.display = ''; downloadBtn.style.display = '';
  flipBtn.disabled = false;
  renderStickerTray();
  setStep('sticker');
  statusEl.textContent = 'Gimana? Tempel stiker terus Simpan. Kalau mau ulang, klik Ulangi.';
};

// ── balik ke kamera ──
function resetToCamera() {
  stage.style.display = 'none'; stage.innerHTML = ''; stage.style.transform = '';
  cameraWrap.style.display = '';
  snapBtn.style.display = ''; snapBtn.disabled = !(currentTpl && camReady);
  retakeBtn.style.display = 'none'; downloadBtn.style.display = 'none';
  stickerTray.style.display = 'none'; stickerTray.innerHTML = '';
  flipBtn.disabled = false;
}
retakeBtn.onclick = () => {
  resetToCamera();
  setStep(currentTpl ? 'shoot' : 'frame');
  statusEl.textContent = 'Oke, jepret lagi ya.';
};

// ── sticker tray (universal) ──
function renderStickerTray() {
  const pack = getStickerPack(currentTpl ? currentTpl.category : null);
  stickerTray.innerHTML = '';
  if (!pack.length) { stickerTray.style.display = 'none'; return; }
  stickerTray.style.display = 'flex';
  pack.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sticker-btn'; b.title = s.name;
    b.setAttribute('aria-label', 'Tempel stiker ' + s.name);
    b.innerHTML = `<img src="${s.file}" alt="" />`;
    b.onclick = () => placeSticker(phCanvas, s.file);
    stickerTray.appendChild(b);
  });
}

// ── simpan ──
downloadBtn.onclick = async () => {
  downloadBtn.disabled = true;
  statusEl.textContent = 'Bentar ya, lagi disimpan...';
  try {
    const url = await exportPng(phCanvas);
    download(url, `polara-${currentTpl.id}-${Date.now()}.png`);
    setStep('save');
    statusEl.textContent = 'Udah kesimpen! Cek folder Download kamu ya.';
  } catch (e) {
    statusEl.textContent = 'Waduh, gagal simpan. ' + e.message;
  }
  downloadBtn.disabled = false;
};

// ── kamera + empty-state overlay ──
flipBtn.onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; startCam(); };
function showOverlay(msg) { if (camMsg) camMsg.textContent = msg; if (cameraOverlay) cameraOverlay.style.display = 'flex'; }
function hideOverlay() { if (cameraOverlay) cameraOverlay.style.display = 'none'; }
async function startCam() {
  showOverlay('Lagi nyalain kamera...');
  snapBtn.disabled = true; camReady = false;
  try {
    await startCamera(video, facing);
    hideOverlay(); camReady = true;
    snapBtn.disabled = !currentTpl;
    statusEl.textContent = currentTpl ? 'Udah siap. Klik Jepret ya.' : 'Pilih frame dulu, terus jepret ya.';
  } catch (err) {
    showOverlay('Kameranya belum nyala. Izinin akses kamera di browser dulu ya.');
    statusEl.textContent = 'Kameranya nggak kebuka. Coba cek izin kamera di browser ya.';
  }
}

// ── init ── (mode default 1 udah kepilih → mulai di tahap Frame)
renderModeChoose();
renderStepper();
renderList();
startCam();
