// ─── app.js ──────────────────────────────────────────────────────────────────
// State flow P0: Start → Camera → Review → Frame → Decorate → Reveal.
import {
  startCamera, stopCamera, captureFrame, createDemoCapture, classifyCameraError,
} from './core/camera.js';
import {
  renderTemplate, setPhotoSlot, refreshPhotoSlots, setMeta, exportPng, exportRawPng,
  download, dataUrlToBlob, renderStickerLayer, setStickerSelection,
} from './core/compositor.js';
import { patchPhotoTransform, resetPhotoTransform } from './core/photo-geometry.js';
import { templates, getTemplate, resolveTemplateHtml, resolveTemplateDoc, templateDims } from './modules/templates/index.js?v=12';
import { waitForOverlayImage } from './modules/templates/overlay-renderer.js?v=12';
import {
  findAvailableTemplate, getTemplatePreviewConfig, selectFramePreservingEditorState,
  isRequestedFrameStillSelected,
  templateSupportsDynamicText,
} from './modules/templates/template-ui.js?v=12';
import { stickers, createStickerInstance, preloadMascots } from './modules/stickers/index.js';

const POLARA_URL = 'polara.vercel.app';
const BRAND_LINE = `Polara · ${POLARA_URL}`;
const $ = (id) => document.getElementById(id);

const refs = {
  workspace: $('appWorkspace'), progress: $('progressWrap'), progressList: $('progressList'),
  startView: $('startView'), cameraView: $('cameraView'), reviewView: $('reviewView'), canvasView: $('canvasView'),
  controlScroll: $('controlScroll'), panels: [...document.querySelectorAll('[data-panel]')],
  primary: $('primaryBtn'), secondary: $('secondaryBtn'), tertiary: $('tertiaryBtn'), back: $('backBtn'),
  status: $('status'), countdownLive: $('countdownLive'),
  modeChoose: $('modeChoose'), timerChoose: $('timerChoose'),
  video: $('video'), cameraWrap: $('cameraWrap'), cameraOverlay: $('cameraOverlay'),
  cameraMessage: $('cameraMessage'), cameraOverlayActions: $('cameraOverlayActions'),
  retryCamera: $('retryCameraBtn'), demoMode: $('demoModeBtn'), countdown: $('countdown'), flash: $('flashLayer'),
  shotBadge: $('shotBadge'), cameraSlots: $('cameraSlots'), cameraPanelTitle: $('cameraPanelTitle'),
  cameraPanelCopy: $('cameraPanelCopy'), cameraStateNote: $('cameraStateNote'),
  reviewPhoto: $('reviewPhoto'), reviewCaption: $('reviewCaption'), reviewSlots: $('reviewSlots'),
  stage: $('canvasScale'), revealBuddy: $('revealBuddy'), templateList: $('templateList'),
  photoSlotTabs: $('photoSlotTabs'), fitContain: $('fitContainBtn'), fitCover: $('fitCoverBtn'),
  zoom: $('zoomInput'), panX: $('panXInput'), panY: $('panYInput'),
  zoomOutput: $('zoomOutput'), panXOutput: $('panXOutput'), panYOutput: $('panYOutput'), resetPhoto: $('resetPhotoBtn'),
  caption: $('captionInput'), captionField: $('captionField'), captionNote: $('captionAvailabilityNote'),
  stickerTray: $('stickerTray'), undoSticker: $('undoStickerBtn'), resetSticker: $('resetStickerBtn'),
  newSession: $('newSessionBtn'), dialog: $('newSessionDialog'), cancelNewSession: $('cancelNewSessionBtn'), confirmNewSession: $('confirmNewSessionBtn'),
};

const STEPS = [
  { id: 'start', label: 'Start' },
  { id: 'camera', label: 'Kamera' },
  { id: 'review', label: 'Review' },
  { id: 'frame', label: 'Frame' },
  { id: 'decorate', label: 'Hias' },
  { id: 'reveal', label: 'Reveal' },
];

function initialState() {
  return {
    step: 'start', mode: 3, timer: 3, facing: 'user', demo: false,
    cameraStatus: 'idle', cameraError: null, shooting: false,
    photos: [null, null, null], activeSlot: 0, selectedSlot: 0, retakeSlot: null,
    frameId: null, caption: '', stickers: [], selectedSticker: null, stickerHistory: [],
    revealReady: false, busy: false, scroll: { frame: 0, decorate: 0, panels: {} },
  };
}

let state = initialState();
let phCanvas = null;
let renderToken = 0;
let cameraRequestId = 0;
let countdownRequestId = 0;
let revealRequestId = 0;
let preparedExportRequestId = 0;
let preparedFramedExport = null;
let thumbFrames = [];
const unavailableFrameIds = new Set();
let resizeTimer = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function status(message) {
  refs.status.textContent = message;
}

function meaningfulSession() {
  return state.photos.some(Boolean) || state.caption || state.stickers.length || state.step !== 'start';
}

function saveScrollState() {
  state.scroll.panels[state.step] = refs.controlScroll.scrollTop;
  if (state.step === 'frame') state.scroll.frame = refs.templateList.scrollTop;
  if (state.step === 'decorate') state.scroll.decorate = refs.stickerTray.scrollTop;
}

function restoreScrollState() {
  requestAnimationFrame(() => {
    refs.controlScroll.scrollTop = state.scroll.panels[state.step] || 0;
    if (state.step === 'frame') refs.templateList.scrollTop = state.scroll.frame || 0;
    if (state.step === 'decorate') refs.stickerTray.scrollTop = state.scroll.decorate || 0;
  });
}

function renderProgress() {
  const activeIndex = STEPS.findIndex((step) => step.id === state.step);
  refs.progress.setAttribute('aria-valuenow', String(activeIndex + 1));
  refs.progressList.innerHTML = '';
  STEPS.forEach((step, index) => {
    const item = document.createElement('li');
    item.className = `progress-item${index < activeIndex ? ' done' : index === activeIndex ? ' active' : ''}`;
    if (index === activeIndex) item.setAttribute('aria-current', 'step');
    item.innerHTML = `<span class="progress-dot">${index < activeIndex ? '✓' : index + 1}</span><span class="progress-label">${step.label}</span>`;
    refs.progressList.appendChild(item);
  });
}

function setButton(button, { label = '', hidden = false, disabled = false, tone = '' } = {}) {
  button.textContent = label;
  button.hidden = hidden;
  button.disabled = disabled || state.busy;
  button.classList.toggle('btn-primary', tone === 'primary');
  button.classList.toggle('btn-secondary', tone === 'secondary');
  button.classList.toggle('btn-ghost', tone === 'ghost');
}

function updateActions() {
  setButton(refs.back, { label: 'Kembali', hidden: state.step === 'start', tone: 'ghost', disabled: state.shooting });
  setButton(refs.secondary, { hidden: true });
  setButton(refs.tertiary, { hidden: true });

  if (state.step === 'start') {
    setButton(refs.primary, { label: 'Buka kamera', tone: 'primary' });
  } else if (state.step === 'camera') {
    const ready = state.cameraStatus === 'ready' || state.cameraStatus === 'demo';
    setButton(refs.primary, { label: state.shooting ? 'Mengambil foto…' : 'Jepret', tone: 'primary', disabled: !ready || state.shooting });
    setButton(refs.secondary, { label: 'Ganti kamera', tone: 'secondary', hidden: state.demo, disabled: state.cameraStatus !== 'ready' || state.shooting });
    setButton(refs.tertiary, { label: 'Mode demo', tone: 'ghost', hidden: state.demo, disabled: state.shooting });
  } else if (state.step === 'review') {
    setButton(refs.primary, { label: 'Pilih frame', tone: 'primary' });
    setButton(refs.secondary, { label: `Foto ulang ${state.mode === 3 ? `slot ${state.selectedSlot + 1}` : ''}`.trim(), tone: 'secondary' });
  } else if (state.step === 'frame') {
    setButton(refs.primary, { label: 'Lanjut menghias', tone: 'primary', disabled: !state.frameId });
  } else if (state.step === 'decorate') {
    setButton(refs.primary, { label: 'Lihat hasil', tone: 'primary' });
  } else if (state.step === 'reveal') {
    setButton(refs.primary, { label: 'Bagikan', tone: 'primary', disabled: !state.revealReady });
    setButton(refs.secondary, { label: 'Simpan PNG', tone: 'secondary', hidden: false, disabled: !state.revealReady });
    setButton(refs.tertiary, { label: 'Foto aja', tone: 'ghost', hidden: false, disabled: !state.revealReady });
  }
}

async function goToStep(nextStep, message) {
  if (!STEPS.some((step) => step.id === nextStep)) return;
  saveScrollState();
  if (state.step === 'camera' && nextStep !== 'camera') {
    cameraRequestId += 1;
    cancelCountdown();
    state.shooting = false;
    stopCamera();
  }
  if (state.step === 'reveal' && nextStep !== 'reveal') {
    revealRequestId += 1;
    invalidatePreparedExport();
  }
  state.step = nextStep;
  refs.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== nextStep; });
  refs.startView.hidden = nextStep !== 'start';
  refs.cameraView.hidden = nextStep !== 'camera';
  refs.reviewView.hidden = nextStep !== 'review';
  refs.canvasView.hidden = !['frame', 'decorate', 'reveal'].includes(nextStep);
  refs.revealBuddy.hidden = nextStep !== 'reveal';
  refs.canvasView.classList.remove('revealing');

  renderProgress();
  if (nextStep === 'start') syncStartControls();
  if (nextStep === 'camera') renderCameraPanel();
  if (nextStep === 'review') renderReview();
  if (nextStep === 'frame') {
    ensureCurrentFrame();
    await renderTemplateList();
    renderPhotoTabs();
    syncPhotoControls();
    await renderCanvas();
  }
  if (nextStep === 'decorate') {
    refs.caption.value = state.caption;
    renderStickerTray();
    await renderCanvas();
  }
  if (nextStep === 'reveal') await startReveal();

  if (message) status(message);
  updateActions();
  if (nextStep === 'start') window.scrollTo({ top: 0, behavior: 'auto' });
  restoreScrollState();
}

function syncStartControls() {
  refs.modeChoose.querySelectorAll('[data-mode]').forEach((button) => {
    const active = Number(button.dataset.mode) === state.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  refs.timerChoose.querySelectorAll('[data-timer]').forEach((button) => {
    const active = Number(button.dataset.timer) === state.timer;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

refs.modeChoose.addEventListener('click', (event) => {
  const button = event.target.closest('[data-mode]');
  if (!button) return;
  state.mode = Number(button.dataset.mode);
  state.photos = Array(state.mode === 3 ? 3 : 1).fill(null);
  state.activeSlot = 0;
  state.selectedSlot = 0;
  state.frameId = null;
  syncStartControls();
  status(state.mode === 3 ? 'Strip 3 dipilih. Siapkan tiga pose terbaik kalian.' : 'Single dipilih. Satu pose besar, satu momen utama.');
});

refs.timerChoose.addEventListener('click', (event) => {
  const button = event.target.closest('[data-timer]');
  if (!button) return;
  state.timer = Number(button.dataset.timer);
  syncStartControls();
  status(`Timer ${state.timer} detik dipilih.`);
});

async function beginCamera({ retake = false } = {}) {
  if (!retake) {
    const slots = state.mode === 3 ? 3 : 1;
    if (state.photos.length !== slots) state.photos = Array(slots).fill(null);
    state.activeSlot = state.photos.findIndex((photo) => !photo);
    if (state.activeSlot < 0) state.activeSlot = state.selectedSlot;
  }
  await goToStep('camera', retake ? 'Foto lama tetap aman sampai penggantinya berhasil.' : 'Izinkan kamera, lalu siap-siap pose.');
  if (state.demo) {
    state.cameraStatus = 'demo';
    showCameraState();
  } else {
    await requestCamera();
  }
}

async function requestCamera({ switching = false } = {}) {
  const requestId = ++cameraRequestId;
  state.cameraStatus = switching ? 'switching' : 'requesting';
  state.cameraError = null;
  showCameraState();
  try {
    const stream = await startCamera(refs.video, state.facing);
    if (requestId !== cameraRequestId || state.step !== 'camera' || state.demo) { stopCamera(); return false; }
    const actualFacing = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
    if (actualFacing === 'user' || actualFacing === 'environment') state.facing = actualFacing;
    state.cameraStatus = 'ready';
    refs.video.style.transform = state.facing === 'user' ? 'scaleX(-1)' : 'none';
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (requestId !== cameraRequestId || state.step !== 'camera' || state.demo) return;
      suspendCameraSession('Kamera terputus. Foto yang sudah ada tetap aman; nyalakan kamera lagi untuk melanjutkan.');
    }, { once: true });
    showCameraState();
    status('Kamera siap. Pastikan semua masuk guide, lalu tekan Jepret.');
    return true;
  } catch (error) {
    if (requestId !== cameraRequestId || state.demo || error?.name === 'AbortError') return false;
    state.cameraStatus = classifyCameraError(error);
    state.cameraError = error;
    showCameraState();
    status(state.cameraStatus === 'denied' ? 'Akses kamera ditolak. Izinkan lewat pengaturan browser atau gunakan mode demo.' : 'Kamera tidak tersedia. Kamu tetap bisa mencoba flow lewat mode demo.');
    return false;
  }
}

function showCameraState() {
  const ready = state.cameraStatus === 'ready';
  const demo = state.cameraStatus === 'demo';
  refs.cameraOverlay.hidden = ready || demo;
  refs.cameraOverlayActions.hidden = ready || demo || state.cameraStatus === 'idle';
  refs.retryCamera.hidden = !['denied', 'unavailable', 'paused'].includes(state.cameraStatus);
  refs.demoMode.hidden = ready || demo;
  if (state.cameraStatus === 'requesting') refs.cameraMessage.textContent = 'Poca lagi meminta izin kamera…';
  else if (state.cameraStatus === 'switching') refs.cameraMessage.textContent = 'Sedang mengganti kamera…';
  else if (state.cameraStatus === 'denied') refs.cameraMessage.textContent = 'Izin kamera belum diberikan. Cek pengaturan browser atau coba tanpa kamera.';
  else if (state.cameraStatus === 'unavailable') refs.cameraMessage.textContent = 'Kamera tidak ditemukan atau tidak didukung di browser ini.';
  else if (state.cameraStatus === 'paused') refs.cameraMessage.textContent = 'Kamera dijeda untuk menjaga privasi dan baterai.';
  else if (state.cameraStatus === 'idle') refs.cameraMessage.textContent = 'Kamera belum dimulai.';
  refs.video.hidden = demo;
  refs.cameraStateNote.textContent = demo
    ? 'Mode demo aktif. Setiap Jepret membuat placeholder lokal untuk menguji flow.'
    : state.cameraStatus === 'ready' ? 'Kamera siap. Foto penuh akan disimpan tanpa crop permanen.'
      : state.cameraStatus === 'paused' ? 'Tekan Coba lagi untuk menyalakan kamera. Foto yang sudah ada tidak berubah.'
        : 'Sesi dan foto yang sudah ada tetap aman.';
  updateActions();
}

function cancelCountdown() {
  countdownRequestId += 1;
  refs.countdown.hidden = true;
  refs.countdownLive.textContent = '';
}

function suspendCameraSession(message) {
  if (state.step !== 'camera' || state.demo) return;
  cameraRequestId += 1;
  cancelCountdown();
  state.shooting = false;
  stopCamera();
  state.cameraStatus = 'paused';
  showCameraState();
  status(message);
}

function renderSlotCards(container, onSelect) {
  container.innerHTML = '';
  state.photos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `slot-card${index === (state.step === 'camera' ? state.activeSlot : state.selectedSlot) ? ' active' : ''}`;
    button.setAttribute('aria-label', photo ? `Pilih foto slot ${index + 1}` : `Slot ${index + 1} belum diisi`);
    button.setAttribute('aria-pressed', String(index === (state.step === 'camera' ? state.activeSlot : state.selectedSlot)));
    button.innerHTML = photo
      ? `<img src="${photo.src}" alt="Preview foto ${index + 1}" /><span class="slot-number">${index + 1}</span>`
      : `<span class="slot-empty">Slot ${index + 1}</span><span class="slot-number">${index + 1}</span>`;
    button.addEventListener('click', () => onSelect(index));
    container.appendChild(button);
  });
  wireCollectionKeyboard(container, '.slot-card');
}

function renderCameraPanel() {
  const slot = state.activeSlot + 1;
  refs.cameraPanelTitle.textContent = state.retakeSlot != null ? `Foto ulang slot ${slot}` : state.mode === 3 ? `Pose untuk slot ${slot}` : 'Satu pose utama';
  refs.cameraPanelCopy.textContent = state.retakeSlot != null
    ? 'Foto lama tidak dihapus sekarang. Ia baru diganti setelah capture baru berhasil.'
    : 'Kamera menyimpan frame penuh. Atur contain, cover, zoom, dan pan setelah memilih frame.';
  renderSlotCards(refs.cameraSlots, (index) => {
    state.activeSlot = index;
    state.retakeSlot = state.photos[index] ? index : null;
    renderCameraPanel();
    status(state.photos[index] ? `Slot ${index + 1} dipilih untuk foto ulang; foto lama masih aman.` : `Slot ${index + 1} siap diisi.`);
  });
  showCameraState();
}

async function runCountdown(seconds) {
  const requestId = ++countdownRequestId;
  refs.countdown.hidden = false;
  try {
    for (let number = seconds; number > 0; number -= 1) {
      if (requestId !== countdownRequestId || document.hidden || state.step !== 'camera') {
        const error = new Error('Countdown dibatalkan.');
        error.name = 'AbortError';
        throw error;
      }
      refs.countdown.textContent = String(number);
      refs.countdownLive.textContent = `${number}`;
      await new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? 300 : 760));
    }
    if (requestId !== countdownRequestId || document.hidden || state.step !== 'camera') {
      const error = new Error('Countdown dibatalkan.');
      error.name = 'AbortError';
      throw error;
    }
    refs.countdownLive.textContent = 'Foto diambil';
  } finally {
    if (requestId === countdownRequestId) refs.countdown.hidden = true;
  }
}

function flash() {
  refs.flash.classList.remove('flash');
  void refs.flash.offsetWidth;
  refs.flash.classList.add('flash');
}

async function takePhoto() {
  if (state.shooting || !['ready', 'demo'].includes(state.cameraStatus)) return;
  state.shooting = true;
  updateActions();
  const slot = state.activeSlot;
  refs.shotBadge.hidden = false;
  refs.shotBadge.textContent = state.mode === 3 ? `Slot ${slot + 1}` : 'Single';
  status(`Siap-siap untuk foto ${slot + 1}…`);

  try {
    await runCountdown(state.timer);
    flash();
    const replacement = state.demo
      ? createDemoCapture(slot, state.mode)
      : captureFrame(refs.video, { mirror: state.facing === 'user' });
    // Commit pengganti hanya setelah capture sukses.
    state.photos[slot] = replacement;
    state.selectedSlot = slot;
    refs.shotBadge.hidden = true;

    if (state.retakeSlot != null) {
      state.retakeSlot = null;
      state.shooting = false;
      await goToStep('review', `Slot ${slot + 1} berhasil diganti. Slot lain tetap sama.`);
      return;
    }

    const nextEmpty = state.photos.findIndex((photo) => !photo);
    if (nextEmpty === -1) {
      state.shooting = false;
      await goToStep('review', state.mode === 3 ? 'Tiga foto sudah lengkap. Cek satu per satu sebelum memilih frame.' : 'Foto sudah jadi. Cek dulu sebelum memilih frame.');
      return;
    }

    state.activeSlot = nextEmpty;
    state.shooting = false;
    renderCameraPanel();
    status(`Foto masuk ke slot ${slot + 1}. Sekarang siapkan pose slot ${nextEmpty + 1}.`);
  } catch (error) {
    state.shooting = false;
    refs.shotBadge.hidden = true;
    if (state.step === 'camera') {
      status(error?.name === 'AbortError'
        ? 'Pengambilan foto dijeda. Foto yang sudah ada tetap aman.'
        : `Foto belum berhasil diambil. ${error.message || 'Coba lagi ya.'}`);
    }
  }
  updateActions();
}

function renderReview() {
  state.selectedSlot = Math.min(state.selectedSlot, state.photos.length - 1);
  const photo = state.photos[state.selectedSlot] || state.photos.find(Boolean);
  if (photo) refs.reviewPhoto.src = photo.src;
  refs.reviewCaption.textContent = state.mode === 3 ? `Slot ${state.selectedSlot + 1} dari 3 · rasio sumber ${photo?.naturalWidth || 0}:${photo?.naturalHeight || 0}` : `Foto single · rasio sumber ${photo?.naturalWidth || 0}:${photo?.naturalHeight || 0}`;
  renderSlotCards(refs.reviewSlots, (index) => {
    state.selectedSlot = index;
    renderReview();
    updateActions();
  });
}

function startRetake() {
  state.retakeSlot = state.selectedSlot;
  state.activeSlot = state.selectedSlot;
  beginCamera({ retake: true });
}

const templateModeForSession = () => (state.mode === 3 ? 'strip' : 'single');
const framesForMode = ({ includeUnavailable = false } = {}) => templates.filter((template) => (
  templateDims(template).slots === state.mode
  && (includeUnavailable || !unavailableFrameIds.has(template.id))
));

function ensureCurrentFrame() {
  const available = framesForMode();
  if (!available.some((template) => template.id === state.frameId)) {
    const fallback = findAvailableTemplate(templates, templateModeForSession(), unavailableFrameIds)
      || available[0]
      || null;
    selectFramePreservingEditorState(state, fallback?.id || null);
  }
}

async function renderTemplateList() {
  refs.templateList.innerHTML = '';
  refs.templateList.classList.toggle('mode-strip', state.mode === 3);
  thumbFrames = [];
  const available = framesForMode({ includeUnavailable: true });
  available.forEach((template) => {
    const unavailable = unavailableFrameIds.has(template.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tpl-btn${template.id === state.frameId ? ' active' : ''}${template.status === 'experimental-static' ? ' experimental' : ''}${unavailable ? ' unavailable' : ''}`;
    button.disabled = unavailable;
    button.dataset.templateId = template.id;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(template.id === state.frameId));
    const thumb = document.createElement('span');
    thumb.className = 'tpl-thumb';
    thumb.dataset.mode = template.mode;
    const name = document.createElement('span');
    name.className = 'tpl-name';
    name.textContent = template.name;
    const meta = document.createElement('span');
    meta.className = 'tpl-meta';
    const detail = document.createElement('span');
    detail.className = 'tpl-detail';
    detail.textContent = unavailable ? 'Tidak tersedia' : (template.pickerDetail || (template.mode === 'strip' ? '3 foto' : '1 foto'));
    button.setAttribute('aria-label', [template.name, template.pickerBadge, detail.textContent].filter(Boolean).join(', '));
    meta.append(name, detail);
    if (template.pickerBadge) {
      const badge = document.createElement('span');
      badge.className = 'tpl-badge';
      badge.textContent = template.pickerBadge;
      thumb.appendChild(badge);
    }
    button.append(thumb, meta);
    button.addEventListener('click', async () => {
      if (unavailableFrameIds.has(template.id)) return;
      saveScrollState();
      selectFramePreservingEditorState(state, template.id);
      updateTemplateSelection();
      await renderCanvas();
      if (!isRequestedFrameStillSelected(template.id, state.frameId)) return;
      status(template.status === 'experimental-static'
        ? 'Live Frame adalah konsep visual eksperimental. Hasilnya tetap PNG statis, bukan GIF atau video.'
        : `${template.name} dipilih. Transform foto tetap dipertahankan.`);
    });
    refs.templateList.appendChild(button);
    buildTemplateThumb(template, thumb);
  });
  wireCollectionKeyboard(refs.templateList, '.tpl-btn');
}

function updateTemplateSelection() {
  refs.templateList.querySelectorAll('.tpl-btn').forEach((button) => {
    const active = button.dataset.templateId === state.frameId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

async function buildTemplateThumb(template, mount) {
  const preview = getTemplatePreviewConfig(template);
  if (preview.kind === 'image') {
    const image = document.createElement('img');
    image.className = 'tpl-thumb-image';
    image.src = preview.src;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      image.remove();
      const fallback = document.createElement('span');
      fallback.className = 'tpl-thumb-fallback';
      fallback.textContent = 'Preview tidak tersedia';
      mount.appendChild(fallback);
    }, { once: true });
    mount.appendChild(image);
    return;
  }

  try {
    const { w, h } = templateDims(template);
    const frame = document.createElement('iframe');
    frame.className = 'tpl-thumb-frame';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('scrolling', 'no');
    frame.style.width = `${w}px`;
    frame.style.height = `${h}px`;
    frame.srcdoc = await resolveTemplateDoc(template);
    mount.appendChild(frame);
    const focus = template.thumbnailFocus ?? .14;
    thumbFrames.push({ frame, w, h, mode: template.mode, focus });
    requestAnimationFrame(() => scaleThumb(frame, w, h, template.mode, focus));
  } catch (error) {
    mount.textContent = 'Preview tidak tersedia';
    console.debug('Thumbnail frame gagal:', template.id, error);
  }
}

function scaleThumb(frame, width, height, mode = 'single', focus = .14) {
  const box = frame.parentElement;
  if (!box?.clientHeight) return;
  const scale = mode === 'strip'
    ? box.clientWidth / width
    : Math.min(box.clientWidth / width, box.clientHeight / height);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = Math.max(0, (box.clientWidth - scaledWidth) / 2);
  const offsetY = mode === 'strip'
    ? Math.min(0, (box.clientHeight - scaledHeight) * focus)
    : Math.max(0, (box.clientHeight - scaledHeight) / 2);
  frame.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function syncCaptionAvailability(template) {
  const supportsDynamicText = templateSupportsDynamicText(template);
  refs.captionField.hidden = !supportsDynamicText;
  refs.caption.disabled = !supportsDynamicText;
  refs.captionNote.hidden = supportsDynamicText;
}

async function renderCanvas() {
  ensureCurrentFrame();
  const template = getTemplate(state.frameId);
  if (!template) return;
  syncCaptionAvailability(template);
  const token = ++renderToken;
  try {
    const html = await resolveTemplateHtml(template);
    if (token !== renderToken) return;
    phCanvas = renderTemplate(refs.stage, html);
    await waitForOverlayImage(phCanvas);
    if (token !== renderToken) return;
    refreshPhotoSlots(phCanvas, state.photos);
    setMeta(phCanvas, {
      caption: state.caption || 'Polara memory',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      brand: BRAND_LINE,
    });
    fitStage(templateDims(template));
    refreshPhotoSlots(phCanvas, state.photos);
    renderEditorStickers();
  } catch (error) {
    if (template.renderMode === 'png-overlay') {
      unavailableFrameIds.add(template.id);
      const failedButton = refs.templateList.querySelector(`[data-template-id="${CSS.escape(template.id)}"]`);
      if (failedButton) {
        failedButton.disabled = true;
        failedButton.classList.add('unavailable');
        const detail = failedButton.querySelector('.tpl-detail');
        if (detail) detail.textContent = 'Tidak tersedia';
      }
      const fallback = findAvailableTemplate(templates, templateModeForSession(), unavailableFrameIds);
      if (fallback) {
        selectFramePreservingEditorState(state, fallback.id);
        updateTemplateSelection();
        status(`${template.name} gagal dimuat. Polara beralih ke ${fallback.name}; foto dan hiasan tetap aman.`);
        await renderCanvas();
        return;
      }
    }
    status(`Frame gagal dimuat. Sesi tetap aman; pilih frame lain atau coba lagi. ${error.message || ''}`);
  }
}

function fitStage(dims) {
  if (!phCanvas) return;
  const width = Math.max(260, refs.canvasView.clientWidth - 36);
  const height = Math.max(300, refs.canvasView.clientHeight - 34);
  const scale = Math.min(width / dims.w, height / dims.h, 1) || .35;
  refs.stage.style.position = 'relative';
  refs.stage.style.width = `${Math.round(dims.w * scale)}px`;
  refs.stage.style.height = `${Math.round(dims.h * scale)}px`;
  phCanvas.style.position = 'absolute';
  phCanvas.style.inset = '0 auto auto 0';
  phCanvas.style.transformOrigin = 'top left';
  phCanvas.style.transform = `scale(${scale})`;
  phCanvas.dataset.displayScale = String(scale);
}

function renderPhotoTabs() {
  refs.photoSlotTabs.innerHTML = '';
  state.photos.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `slot-tab${index === state.selectedSlot ? ' active' : ''}`;
    button.textContent = String(index + 1);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === state.selectedSlot));
    button.addEventListener('click', () => {
      state.selectedSlot = index;
      renderPhotoTabs();
      syncPhotoControls();
    });
    refs.photoSlotTabs.appendChild(button);
  });
  wireCollectionKeyboard(refs.photoSlotTabs, '.slot-tab');
}

function syncPhotoControls() {
  const photo = state.photos[state.selectedSlot];
  if (!photo) return;
  refs.fitContain.classList.toggle('active', photo.fit === 'contain');
  refs.fitCover.classList.toggle('active', photo.fit === 'cover');
  refs.fitContain.setAttribute('aria-pressed', String(photo.fit === 'contain'));
  refs.fitCover.setAttribute('aria-pressed', String(photo.fit === 'cover'));
  refs.zoom.value = String(photo.zoom);
  refs.panX.value = String(photo.offsetX);
  refs.panY.value = String(photo.offsetY);
  refs.zoomOutput.textContent = `${photo.zoom.toFixed(2)}×`;
  refs.panXOutput.textContent = String(Math.round(photo.offsetX * 100));
  refs.panYOutput.textContent = String(Math.round(photo.offsetY * 100));
}

function updateSelectedPhoto(patch) {
  const photo = state.photos[state.selectedSlot];
  if (!photo) return;
  state.photos[state.selectedSlot] = patchPhotoTransform(photo, patch);
  if (phCanvas) setPhotoSlot(phCanvas, state.selectedSlot + 1, state.photos[state.selectedSlot]);
  syncPhotoControls();
}

refs.fitContain.addEventListener('click', () => updateSelectedPhoto({ fit: 'contain' }));
refs.fitCover.addEventListener('click', () => updateSelectedPhoto({ fit: 'cover' }));
refs.zoom.addEventListener('input', () => updateSelectedPhoto({ zoom: Number(refs.zoom.value) }));
refs.panX.addEventListener('input', () => updateSelectedPhoto({ offsetX: Number(refs.panX.value) }));
refs.panY.addEventListener('input', () => updateSelectedPhoto({ offsetY: Number(refs.panY.value) }));
refs.resetPhoto.addEventListener('click', () => {
  const photo = state.photos[state.selectedSlot];
  if (!photo) return;
  state.photos[state.selectedSlot] = resetPhotoTransform(photo);
  setPhotoSlot(phCanvas, state.selectedSlot + 1, state.photos[state.selectedSlot]);
  syncPhotoControls();
  status(`Transform slot ${state.selectedSlot + 1} dikembalikan ke Foto utuh.`);
});

function snapshotStickers() {
  const snapshot = JSON.stringify(state.stickers);
  if (state.stickerHistory[state.stickerHistory.length - 1] !== snapshot) {
    state.stickerHistory.push(snapshot);
    if (state.stickerHistory.length > 30) state.stickerHistory.shift();
  }
  updateStickerActions();
}

function renderEditorStickers() {
  if (!phCanvas) return;
  renderStickerLayer(phCanvas, state.stickers, {
    selectedId: state.selectedSticker,
    onSelect: (uid) => { state.selectedSticker = uid; setStickerSelection(phCanvas, uid); },
    onInteractionStart: snapshotStickers,
    onChange: () => {},
    onDelete: (uid) => {
      state.stickers = state.stickers.filter((item) => item.uid !== uid);
      if (state.selectedSticker === uid) state.selectedSticker = null;
      renderEditorStickers();
      updateStickerActions();
    },
    onAssetError: (item) => status(`Sticker ${item.name} gagal dimuat. Sticker lain dan sesi tetap aman.`),
  });
  updateStickerActions();
}

function renderStickerTray() {
  refs.stickerTray.innerHTML = '';
  stickers.forEach((asset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sticker-btn';
    button.setAttribute('role', 'option');
    button.setAttribute('aria-label', `Tambahkan sticker ${asset.name}`);
    const image = document.createElement('img');
    image.src = asset.src;
    image.alt = '';
    image.loading = 'lazy';
    image.onerror = () => { button.disabled = true; button.hidden = true; status(`Asset ${asset.name} tidak tersedia; item dilewati tanpa mereset sesi.`); };
    button.appendChild(image);
    const label = document.createElement('span');
    label.className = 'sticker-label';
    label.textContent = asset.name;
    button.appendChild(label);
    button.addEventListener('click', () => {
      snapshotStickers();
      const item = createStickerInstance(asset);
      state.stickers.push(item);
      state.selectedSticker = item.uid;
      renderEditorStickers();
      status(`${asset.name} ditambahkan. Geser langsung di foto atau gunakan keyboard.`);
    });
    refs.stickerTray.appendChild(button);
  });
  wireCollectionKeyboard(refs.stickerTray, '.sticker-btn');
  updateStickerActions();
}

function updateStickerActions() {
  refs.undoSticker.disabled = !state.stickerHistory.length;
  refs.resetSticker.disabled = !state.stickers.length;
}

refs.undoSticker.addEventListener('click', () => {
  const previous = state.stickerHistory.pop();
  if (previous == null) return;
  state.stickers = JSON.parse(previous);
  state.selectedSticker = null;
  renderEditorStickers();
  status('Perubahan sticker terakhir diurungkan.');
});

refs.resetSticker.addEventListener('click', () => {
  if (!state.stickers.length) return;
  snapshotStickers();
  state.stickers = [];
  state.selectedSticker = null;
  renderEditorStickers();
  status('Semua sticker dihapus. Kamu masih bisa mengurungkannya.');
});

refs.caption.addEventListener('input', () => {
  state.caption = refs.caption.value;
  if (phCanvas) setMeta(phCanvas, { caption: state.caption || 'Polara memory' });
});

function framedExportSize() {
  return state.mode === 3
    ? { width: 720, height: 1800 }
    : { width: 1080, height: 1350 };
}

function invalidatePreparedExport() {
  preparedExportRequestId += 1;
  preparedFramedExport = null;
}

async function prepareFramedExport() {
  if (preparedFramedExport) return preparedFramedExport;
  if (!phCanvas || !state.frameId) throw new Error('Frame hasil belum siap.');

  const requestId = ++preparedExportRequestId;
  const { width, height } = framedExportSize();
  const dataUrl = await exportPng(phCanvas);
  await assertExportDimensions(dataUrl, width, height);
  const blob = await dataUrlToBlob(dataUrl);
  if (requestId !== preparedExportRequestId || state.step !== 'reveal') {
    const error = new Error('Persiapan hasil dibatalkan.');
    error.name = 'AbortError';
    throw error;
  }

  const filename = `polara-${state.frameId}-${Date.now()}.png`;
  let file = null;
  if (typeof File === 'function') {
    try { file = new File([blob], filename, { type: 'image/png' }); }
    catch { /* Browser tanpa File constructor tetap mendapat fallback download. */ }
  }
  preparedFramedExport = { blob, file, filename, width, height };
  return preparedFramedExport;
}

function supportsPreparedFileShare(prepared) {
  if (!prepared?.file || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  try { return navigator.canShare({ files: [prepared.file] }); }
  catch { return false; }
}

async function startReveal() {
  const requestId = ++revealRequestId;
  invalidatePreparedExport();
  state.selectedSticker = null;
  state.revealReady = false;
  updateActions();
  await renderCanvas();
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  refs.canvasView.classList.remove('revealing');
  void refs.canvasView.offsetWidth;
  refs.canvasView.classList.add('revealing');
  status('Poca lagi mengeluarkan hasil dari booth…');
  await new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? 20 : 980));
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  status('Hasil terlihat. Polara sedang menyiapkan file agar share di HP lebih andal…');
  try {
    await prepareFramedExport();
  } catch (error) {
    if (error?.name !== 'AbortError') status('Hasil siap dilihat. File akan dicoba lagi saat kamu menyimpan atau membagikan.');
  }
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  state.revealReady = true;
  updateActions();
  status('Hasil siap dibagikan atau disimpan.');
}

async function withBusy(message, task) {
  if (state.busy) return;
  state.busy = true;
  updateActions();
  status(message);
  try { await task(); }
  finally { state.busy = false; updateActions(); }
}

async function downloadFramed() {
  await withBusy('Membuat PNG ukuran asli…', async () => {
    try {
      const prepared = await prepareFramedExport();
      await download(prepared.blob, prepared.filename);
      status(`PNG tersimpan (${prepared.width}×${prepared.height}).`);
    } catch (error) {
      status(error.message || 'Export gagal. Hasilmu tetap aman; coba lagi.');
    }
  });
}

async function downloadRaw() {
  await withBusy('Menyiapkan foto tanpa frame…', async () => {
    try {
      const url = await exportRawPng(state.photos, state.mode);
      await assertExportDimensions(url, state.mode === 3 ? 720 : 1080, state.mode === 3 ? 1800 : 1350);
      const blob = await dataUrlToBlob(url);
      await download(blob, `polara-foto-aja-${Date.now()}.png`);
      status('Foto tanpa frame tersimpan. Hasil ber-frame tetap ada di sesi ini.');
    } catch (error) {
      status(`Foto mentah gagal dibuat. ${error.message || 'Coba lagi ya.'}`);
    }
  });
}

async function shareResult() {
  await withBusy('Menyiapkan hasil untuk dibagikan…', async () => {
    const preparedAtClick = preparedFramedExport;
    const text = `Nih hasil fotoku pakai Polara! Bikin punyamu juga di ${POLARA_URL} 🐱`;

    if (supportsPreparedFileShare(preparedAtClick)) {
      try {
        // Panggil sebelum await pertama agar transient user activation di HP tidak hilang.
        await navigator.share({ files: [preparedAtClick.file], text });
        status('Yay, hasilnya berhasil dibagikan!');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          status('Share dibatalkan. Hasil tetap ada dan bisa dicoba lagi.');
          return;
        }
        status('Native share belum berhasil. Polara menyiapkan download sebagai fallback…');
      }
    }

    try {
      const prepared = preparedAtClick || await prepareFramedExport();
      await download(prepared.blob, prepared.filename);
      status('Share file belum didukung atau gagal dibuka, jadi PNG sudah diunduh sebagai fallback.');
    } catch (error) {
      status(`Belum berhasil membagikan. ${error.message || 'Hasil tetap aman; coba lagi.'}`);
    }
  });
}

function assertExportDimensions(dataUrl, expectedWidth, expectedHeight) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth === expectedWidth && image.naturalHeight === expectedHeight) resolve();
      else reject(new Error(`Ukuran export ${image.naturalWidth}×${image.naturalHeight}, seharusnya ${expectedWidth}×${expectedHeight}. Hasil tidak diunduh.`));
    };
    image.onerror = () => reject(new Error('Hasil export tidak dapat diverifikasi. Hasil tidak diunduh.'));
    image.src = dataUrl;
  });
}

refs.primary.addEventListener('click', async () => {
  if (state.step === 'start') await beginCamera();
  else if (state.step === 'camera') await takePhoto();
  else if (state.step === 'review') await goToStep('frame', 'Pilih frame favoritmu. Foto masih bisa diatur tanpa crop permanen.');
  else if (state.step === 'frame') await goToStep('decorate', 'Tambahkan caption dan sticker. Foto serta frame tetap sama saat kembali.');
  else if (state.step === 'decorate') await goToStep('reveal');
  else if (state.step === 'reveal') await shareResult();
});

refs.secondary.addEventListener('click', async () => {
  if (state.step === 'camera') {
    const previousFacing = state.facing;
    state.facing = previousFacing === 'user' ? 'environment' : 'user';
    const switched = await requestCamera({ switching: true });
    if (switched && state.facing === previousFacing) {
      status('Kamera lain tidak ditemukan; kamera yang aktif tetap dipakai. Foto dan sesi tetap aman.');
    }
    if (!switched) state.facing = previousFacing;
    if (!switched && state.cameraStatus !== 'denied' && state.step === 'camera' && !state.demo) {
      status('Kamera tujuan tidak tersedia. Polara sedang memulihkan kamera sebelumnya…');
      const restored = await requestCamera({ switching: true });
      if (restored) status('Kamera sebelumnya berhasil dipulihkan. Foto dan sesi tetap aman.');
    }
  } else if (state.step === 'review') startRetake();
  else if (state.step === 'reveal') await downloadFramed();
});

refs.tertiary.addEventListener('click', async () => {
  if (state.step === 'camera') activateDemoMode();
  else if (state.step === 'reveal') await downloadRaw();
});

refs.back.addEventListener('click', async () => {
  if (state.step === 'camera') {
    if (state.retakeSlot != null || state.photos.some(Boolean)) {
      state.retakeSlot = null;
      await goToStep('review', 'Foto yang sudah ada tetap dipertahankan.');
    } else {
      await goToStep('start', 'Pilihan format dan timer masih sama.');
    }
  } else if (state.step === 'review') {
    state.retakeSlot = state.selectedSlot;
    state.activeSlot = state.selectedSlot;
    await beginCamera({ retake: true });
  } else if (state.step === 'frame') await goToStep('review', 'Kembali ke review tanpa mereset pilihan foto.');
  else if (state.step === 'decorate') await goToStep('frame', 'Caption dan sticker tetap tersimpan saat memilih frame lain.');
  else if (state.step === 'reveal') await goToStep('decorate', 'Hasil tetap utuh. Silakan lanjut menghias.');
});

refs.retryCamera.addEventListener('click', async () => { state.demo = false; await requestCamera(); });
function activateDemoMode() {
  cameraRequestId += 1;
  cancelCountdown();
  state.shooting = false;
  stopCamera();
  state.demo = true;
  state.cameraStatus = 'demo';
  showCameraState();
  status('Mode demo aktif. Ini hanya placeholder untuk mencoba pengalaman Polara.');
}
refs.demoMode.addEventListener('click', activateDemoMode);

refs.newSession.addEventListener('click', () => {
  if (!meaningfulSession()) { resetSession(); return; }
  refs.dialog.showModal();
});
refs.cancelNewSession.addEventListener('click', () => refs.dialog.close());
refs.confirmNewSession.addEventListener('click', () => { refs.dialog.close(); resetSession(); });
refs.dialog.addEventListener('cancel', () => status('Sesi sekarang tetap dilanjutkan.'));

async function resetSession() {
  cameraRequestId += 1;
  revealRequestId += 1;
  cancelCountdown();
  invalidatePreparedExport();
  stopCamera();
  unavailableFrameIds.clear();
  state = initialState();
  phCanvas = null;
  refs.stage.innerHTML = '';
  refs.caption.value = '';
  await goToStep('start', 'Sesi baru siap. Pilih format dan timer.');
}

function wireCollectionKeyboard(container, selector) {
  if (container.dataset.collectionKeyboard === selector) return;
  container.dataset.collectionKeyboard = selector;
  container.addEventListener('keydown', (event) => {
    const current = event.target.closest(selector);
    if (!current) return;
    const items = [...container.querySelectorAll(selector)].filter((item) => !item.disabled && !item.hidden);
    const index = items.indexOf(current);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = items[(index + 1) % items.length];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length];
    else if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items[items.length - 1];
    if (next) { event.preventDefault(); next.focus(); }
  });
}

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    thumbFrames.forEach(({ frame, w, h, mode, focus }) => scaleThumb(frame, w, h, mode, focus));
    if (phCanvas && ['frame', 'decorate', 'reveal'].includes(state.step)) {
      fitStage(templateDims(getTemplate(state.frameId)));
      refreshPhotoSlots(phCanvas, state.photos);
      renderEditorStickers();
    }
  }, 120);
}

window.addEventListener('resize', handleResize);
window.visualViewport?.addEventListener('resize', handleResize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspendCameraSession('Kamera dijeda saat Polara tidak terlihat. Foto yang sudah ada tetap aman.');
});
window.addEventListener('pagehide', () => {
  cameraRequestId += 1;
  cancelCountdown();
  stopCamera();
});
document.querySelectorAll('.mascot-runtime').forEach((image) => {
  image.addEventListener('error', () => { image.hidden = true; });
});

preloadMascots();
goToStep('start', 'Pilih format dan timer, lalu buka kamera saat siap.');
