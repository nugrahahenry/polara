// ─── app.js ──────────────────────────────────────────────────────────────────
// Flow "jepret dulu": atur MODE (1/3) + TIMER → JEPRET (1x atau 3x) → pilih FRAME
// (preview-nya udah ada fotomu) → HIAS (stiker + nama) → SIMPAN / BAGIKAN.
import { startCamera, captureFrame } from './core/camera.js';
import { renderTemplate, setPhotoSlot, setMeta, exportPng, download, placeSticker } from './core/compositor.js';
import { templates, resolveTemplateHtml, resolveTemplateDoc, templateDims } from './modules/templates/index.js';
import { getStickerPack } from './modules/stickers/index.js';

const $ = (id) => document.getElementById(id);
const video = $('video'), stage = $('canvasScale'), listEl = $('templateList');
const snapBtn = $('snapBtn'), retakeBtn = $('retakeBtn'), downloadBtn = $('downloadBtn'), shareBtn = $('shareBtn');
const flipBtn = $('flipBtn'), countdownEl = $('countdown'), statusEl = $('status'), cameraWrap = $('cameraWrap');
const stickerTray = $('stickerTray'), cameraOverlay = $('cameraOverlay'), camMsg = $('camMsg'), shotBadge = $('shotBadge');
const stepperEl = $('stepper'), modeChoose = $('modeChoose'), timerChoose = $('timerChoose');
const setupCard = $('setupCard'), frameCard = $('frameCard'), greeterCard = $('greeterCard'), hiasCard = $('hiasCard');
const captionInput = $('captionInput');

let mode = 1;             // 1 = single, 3 = strip
let timerSec = 3;         // 3 / 5 / 10
let facing = 'user';
let currentTpl = null;
let phCanvas = null;
let camReady = false;
let photos = [];          // hasil jepret
let captionText = '';
let tplButtons = [];
const thumbFrames = [];

// ── stepper ──
const STEPS = [
  { id: 'foto', label: 'Foto' },
  { id: 'frame', label: 'Frame' },
  { id: 'hias', label: 'Hias' },
  { id: 'simpan', label: 'Simpan' },
];
let stepIdx = 0;
function setStep(id) {
  const i = STEPS.findIndex(s => s.id === id);
  if (i >= 0) stepIdx = i;
  stepperEl.innerHTML = '';
  STEPS.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'step' + (i < stepIdx ? ' done' : i === stepIdx ? ' active' : '');
    if (i === stepIdx) li.setAttribute('aria-current', 'step');
    li.innerHTML = `<span class="step-n">${i < stepIdx ? '✓' : i + 1}</span><span class="step-l">${s.label}</span>`;
    stepperEl.appendChild(li);
  });
}

// ── segmented control (mode + timer) ──
function wireSeg(container, apply) {
  container.querySelectorAll('.seg-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.seg-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      apply(btn);
    };
  });
}
wireSeg(modeChoose, (btn) => { mode = Number(btn.dataset.mode); statusEl.textContent = mode === 3 ? 'Mode strip! Nanti kamu jepret 3 kali.' : 'Atur timer-nya, terus jepret ya.'; });
wireSeg(timerChoose, (btn) => { timerSec = Number(btn.dataset.timer); });

// ── daftar frame (grid, difilter mode) ──
const framesForMode = () => templates.filter(t => templateDims(t).slots === mode);

function renderList() {
  listEl.innerHTML = '';
  thumbFrames.length = 0;
  tplButtons = framesForMode().map(t => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tpl-btn'; btn.setAttribute('aria-pressed', 'false');
    const { w, h } = templateDims(t);
    const thumb = document.createElement('span'); thumb.className = 'tpl-thumb'; btn.appendChild(thumb);
    const meta = document.createElement('span'); meta.className = 'tpl-meta';
    meta.innerHTML = `<span class="tpl-name">${t.name}</span>`;
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

// ── thumbnail = iframe design preview ──
async function buildThumb(t, mount, w, h) {
  try {
    const doc = await resolveTemplateDoc(t);
    const frame = document.createElement('iframe');
    frame.className = 'tpl-thumb-frame';
    frame.setAttribute('scrolling', 'no'); frame.setAttribute('tabindex', '-1'); frame.setAttribute('aria-hidden', 'true');
    frame.style.width = w + 'px'; frame.style.height = h + 'px';
    frame.srcdoc = doc;
    mount.appendChild(frame);
    thumbFrames.push({ frame, w, h });
    requestAnimationFrame(() => scaleThumb(frame, w, h));
  } catch (e) { console.debug('Thumbnail gagal:', t.id, e); }
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

function fitStage(dims) {
  const card = stage.closest('.stage-card');
  const availW = Math.min((card ? card.clientWidth : 460) - 34, 460);
  const scale = Math.min(availW / dims.w, 540 / dims.h) || 0.4;
  stage.style.width = Math.round(dims.w * scale) + 'px';
  stage.style.height = Math.round(dims.h * scale) + 'px';
  if (phCanvas) { phCanvas.style.transformOrigin = 'top left'; phCanvas.style.transform = `scale(${scale})`; }
}

// ── FASE FOTO (kamera) vs FASE HASIL ──
function showFotoPhase() {
  setupCard.hidden = false; frameCard.hidden = true;
  greeterCard.hidden = false; hiasCard.hidden = true;
  stage.style.display = 'none'; stage.innerHTML = ''; stage.style.transform = '';
  cameraWrap.style.display = '';
  snapBtn.style.display = ''; flipBtn.style.display = '';
  retakeBtn.style.display = 'none'; downloadBtn.style.display = 'none'; shareBtn.style.display = 'none';
  snapBtn.disabled = !camReady;
}
function showResultPhase() {
  setupCard.hidden = true; frameCard.hidden = false;
  greeterCard.hidden = true; hiasCard.hidden = false;
  cameraWrap.style.display = 'none';
  stage.style.display = 'block';
  snapBtn.style.display = 'none'; flipBtn.style.display = 'none';
  retakeBtn.style.display = ''; downloadBtn.style.display = ''; shareBtn.style.display = '';
}

// ── JEPRET (1x atau 3x pakai timer pilihan) ──
snapBtn.onclick = async () => {
  if (!camReady) return;
  snapBtn.disabled = true; flipBtn.disabled = true;
  const slots = mode;
  photos = [];
  for (let i = 1; i <= slots; i++) {
    if (slots > 1) { shotBadge.style.display = 'block'; shotBadge.textContent = `Foto ${i} dari ${slots}`; }
    statusEl.textContent = slots > 1 ? `Siap-siap foto ke-${i}!` : 'Siap-siap, senyum!';
    await countdown(timerSec);
    flash();
    photos.push(captureFrame(video));
    if (slots > 1 && i < slots) await new Promise(r => setTimeout(r, 900));
  }
  shotBadge.style.display = 'none';
  goToResult();
};

// ── setelah jepret: pilih frame + hias ──
function goToResult() {
  captionText = ''; captionInput.value = '';
  renderList();                           // grid frame difilter mode
  currentTpl = framesForMode()[0];        // auto-pilih frame pertama
  renderResult();
  renderStickerTray();
  showResultPhase();
  setStep('frame');
  statusEl.textContent = 'Pilih frame yang kamu suka, terus hias di kanan.';
}

function renderResult() {
  if (!currentTpl) return;
  const dims = templateDims(currentTpl);
  resolveTemplateHtml(currentTpl).then(html => {
    phCanvas = renderTemplate(stage, html);
    photos.forEach((p, i) => setPhotoSlot(phCanvas, i + 1, p));
    setMeta(phCanvas, {
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      caption: captionText || undefined,
    });
    fitStage(dims);
    updateActive();
  });
}

function selectTemplate(t) {
  currentTpl = t;
  updateActive();
  renderResult();
}

// ── nama / kampus ──
captionInput.oninput = () => {
  captionText = captionInput.value.trim();
  if (phCanvas) setMeta(phCanvas, { caption: captionText || undefined });
  if (stepIdx < 2) setStep('hias');
};

// ── sticker tray (di panel kanan) ──
function renderStickerTray() {
  const pack = getStickerPack(currentTpl ? currentTpl.category : null);
  stickerTray.innerHTML = '';
  pack.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sticker-btn'; b.title = s.name;
    b.setAttribute('aria-label', 'Tempel stiker ' + s.name);
    b.innerHTML = `<img src="${s.file}" alt="" />`;
    b.onclick = () => { if (phCanvas) { placeSticker(phCanvas, s.file); if (stepIdx < 2) setStep('hias'); } };
    stickerTray.appendChild(b);
  });
}

// ── jepret ulang (balik ke kamera, mode/timer tetap) ──
retakeBtn.onclick = () => {
  photos = []; phCanvas = null; currentTpl = null;
  showFotoPhase();
  setStep('foto');
  statusEl.textContent = 'Oke, jepret lagi ya. Mode sama timer masih sama.';
};

// ── simpan ──
downloadBtn.onclick = async () => {
  downloadBtn.disabled = true;
  statusEl.textContent = 'Bentar ya, lagi disimpan...';
  try {
    const url = await exportPng(phCanvas);
    download(url, `polara-${currentTpl.id}-${Date.now()}.png`);
    setStep('simpan');
    statusEl.textContent = 'Udah kesimpen! Cek folder Download kamu ya.';
  } catch (e) {
    statusEl.textContent = 'Waduh, gagal simpan. ' + e.message;
  }
  downloadBtn.disabled = false;
};

// ── bagikan (Web Share API) ──
shareBtn.onclick = async () => {
  shareBtn.disabled = true;
  statusEl.textContent = 'Bentar, lagi disiapin buat dibagikan...';
  const msg = 'Nih hasil fotoku pakai Polara! Coba juga yuk, seru.';
  try {
    const url = await exportPng(phCanvas);
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], `polara-${currentTpl.id}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: msg });
      setStep('simpan');
      statusEl.textContent = 'Yay, kebagikan! Makasih udah pakai Polara.';
    } else {
      download(url, `polara-${currentTpl.id}-${Date.now()}.png`);
      statusEl.textContent = 'Browser ini belum bisa share langsung, jadi aku download-in aja ya. Tinggal kamu kirim manual.';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') statusEl.textContent = 'Oke, share-nya dibatalin.';
    else statusEl.textContent = 'Waduh, gagal bagikan. ' + (e.message || '');
  }
  shareBtn.disabled = false;
};

// ── kamera ──
flipBtn.onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; startCam(); };
function showOverlay(msg) { if (camMsg) camMsg.textContent = msg; if (cameraOverlay) cameraOverlay.style.display = 'flex'; }
function hideOverlay() { if (cameraOverlay) cameraOverlay.style.display = 'none'; }
async function startCam() {
  showOverlay('Lagi nyalain kamera...');
  snapBtn.disabled = true; camReady = false;
  try {
    await startCamera(video, facing);
    hideOverlay(); camReady = true; flipBtn.disabled = false;
    if (setupCard.hidden === false) snapBtn.disabled = false;
    if (statusEl.textContent.startsWith('Lagi nyalain') || statusEl.textContent.startsWith('Kameranya'))
      statusEl.textContent = mode === 3 ? 'Mode strip! Nanti kamu jepret 3 kali.' : 'Atur mode & timer, terus jepret ya.';
  } catch (err) {
    showOverlay('Kameranya belum nyala. Izinin akses kamera di browser dulu ya.');
    statusEl.textContent = 'Kameranya nggak kebuka. Coba cek izin kamera di browser ya.';
  }
}

// ── init ──
showFotoPhase();
setStep('foto');
startCam();
