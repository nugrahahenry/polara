// ─── app.js ──────────────────────────────────────────────────────────────────
// State flow P0: Start → Camera → Review → Frame → Decorate → Reveal.
import {
  startCamera, stopCamera, captureFrame, createDemoCapture, classifyCameraError,
} from './core/camera.js';
import {
  renderTemplate, setPhotoSlot, refreshPhotoSlots, setMeta, exportPng, exportRawPng,
  download, dataUrlToBlob, renderStickerLayer, setStickerSelection,
} from './core/compositor.js';
import { applyPhotoGeometry, patchPhotoTransform, resetPhotoTransform } from './core/photo-geometry.js';
import { templates, getTemplate, resolveTemplateHtml, resolveTemplateDoc, templateDims } from './modules/templates/index.js?v=15';
import { waitForOverlayImage } from './modules/templates/overlay-renderer.js?v=13';
import {
  findAvailableTemplate, getTemplatePreviewConfig, selectFramePreservingEditorState,
  isRequestedFrameStillSelected,
  templateSupportsDynamicText,
} from './modules/templates/template-ui.js?v=13';
import { getStickerPack, createStickerInstance, preloadMascots } from './modules/stickers/index.js?v=2';
import {
  DEFAULT_GUEST_ID, POSE_MATE_EXPERIENCE, createGuestComposition, createLatestSelectionGate,
  getGuest, getGuestAssets, poseGuideForSlot, retryWithoutGuestOnFailure,
} from './modules/guests/index.js?v=3';
import { PROOF_STEPS, getProofStepStatus, getPocaForState, selectActiveProof } from './ui/proof-table.js?v=13';
import { getStickerBenchView, getStickerCategoryLabel } from './ui/decorate-workshop.js?v=2';
import { getRevealDossier } from './ui/reveal-dossier.js?v=1';

const POLARA_URL = 'polara.vercel.app';
const BRAND_LINE = `Polara · ${POLARA_URL}`;
const $ = (id) => document.getElementById(id);
const CAMERA_STATE_LABELS = {
  idle: 'Camera standby',
  requesting: 'Opening camera',
  switching: 'Switching camera',
  ready: 'Camera ready',
  demo: 'Demo capture',
  denied: 'Camera permission needed',
  unavailable: 'Camera unavailable',
  paused: 'Camera paused',
};

const refs = {
  workspace: $('appWorkspace'), progress: $('progressWrap'), progressList: $('progressList'),
  stageShell: $('stageShell'), stageDocketStep: $('stageDocketStep'), stageDocketFormat: $('stageDocketFormat'),
  startView: $('startView'), cameraView: $('cameraView'), reviewView: $('reviewView'), canvasView: $('canvasView'),
  controlSheet: $('controlSheet'), controlScroll: $('controlScroll'), panels: [...document.querySelectorAll('[data-panel]')],
  primary: $('primaryBtn'), secondary: $('secondaryBtn'), tertiary: $('tertiaryBtn'), back: $('backBtn'),
  status: $('status'), countdownLive: $('countdownLive'),
  experienceChoose: $('experienceChoose'), modeChoose: $('modeChoose'), timerChoose: $('timerChoose'),
  startGuestPreview: $('startGuestPreview'), poseMateControls: $('poseMateControls'),
  guestLayoutChoose: $('guestLayoutChoose'), guestSide: $('guestSideBtn'), poseGuideText: $('poseGuideText'),
  video: $('video'), cameraWrap: $('cameraWrap'), cameraOverlay: $('cameraOverlay'),
  poseUserGuide: $('poseUserGuide'), poseGuestPreview: $('poseGuestPreview'),
  cameraMessage: $('cameraMessage'), cameraOverlayTitle: $('cameraOverlayTitle'), cameraOverlayActions: $('cameraOverlayActions'),
  cameraBayCounter: $('cameraBayCounter'), cameraBayStatus: $('cameraBayStatus'),
  retryCamera: $('retryCameraBtn'), demoMode: $('demoModeBtn'), countdown: $('countdown'), flash: $('flashLayer'),
  shotBadge: $('shotBadge'), cameraSlots: $('cameraSlots'), cameraPanelTitle: $('cameraPanelTitle'),
  cameraPanelCopy: $('cameraPanelCopy'), cameraStateNote: $('cameraStateNote'),
  reviewPhoto: $('reviewPhoto'), reviewPhotoRegion: $('reviewPhotoRegion'), reviewGuest: $('reviewGuest'), reviewWrap: document.querySelector('.review-photo-wrap'), reviewCaption: $('reviewCaption'),
  reviewProofTag: $('reviewProofTag'), reviewProofLabel: $('reviewProofLabel'), reviewSourceMeta: $('reviewSourceMeta'), reviewSlots: $('reviewSlots'),
  stage: $('canvasScale'), revealBuddy: $('revealBuddy'), templateList: $('templateList'),
  frameEditionDossier: $('frameEditionDossier'), frameEditionName: $('frameEditionName'),
  frameEditionStory: $('frameEditionStory'), frameEditionMaterial: $('frameEditionMaterial'),
  frameEditionPalette: $('frameEditionPalette'), frameEditionExclusive: $('frameEditionExclusive'),
  frameEditionExclusiveImage: $('frameEditionExclusiveImage'),
  photoSlotTabs: $('photoSlotTabs'), fitContain: $('fitContainBtn'), fitCover: $('fitCoverBtn'),
  zoom: $('zoomInput'), panX: $('panXInput'), panY: $('panYInput'),
  zoomOutput: $('zoomOutput'), panXOutput: $('panXOutput'), panYOutput: $('panYOutput'), resetPhoto: $('resetPhotoBtn'),
  caption: $('captionInput'), captionField: $('captionField'), captionNote: $('captionAvailabilityNote'),
  stickerBench: $('stickerBench'), stickerBenchStatus: $('stickerBenchStatus'), stickerTray: $('stickerTray'), stickerRailMeta: $('stickerRailMeta'),
  stickerInspector: $('stickerInspector'), stickerInspectorImage: $('stickerInspectorImage'),
  stickerInspectorName: $('stickerInspectorName'), stickerInspectorHint: $('stickerInspectorHint'),
  undoSticker: $('undoStickerBtn'), resetSticker: $('resetStickerBtn'),
  newSession: $('newSessionBtn'), dialog: $('newSessionDialog'), cancelNewSession: $('cancelNewSessionBtn'), confirmNewSession: $('confirmNewSessionBtn'),
  privacy: $('privacyBtn'), privacyDialog: $('privacyDialog'), closePrivacy: $('closePrivacyBtn'),
  proofBuddy: $('proofBuddy'), proofBuddyImage: $('proofBuddyImage'), proofBuddyCaption: $('proofBuddyCaption'),
  cameraPoca: $('cameraPoca'), revealPanelPoca: $('revealPanelPoca'), revealTitle: $('revealTitle'), revealProofStack: $('revealProofStack'),
  revealDossierFormat: $('revealDossierFormat'), revealDossierFrame: $('revealDossierFrame'),
  revealDossierDecorations: $('revealDossierDecorations'), revealDossierPrivacy: $('revealDossierPrivacy'),
};

const STEPS = PROOF_STEPS;

function initialState() {
  return {
    step: 'start', mode: 3, timer: 3, facing: 'user', demo: false,
    experience: 'regular', guestId: null, guestLayout: 'matched', guestSide: 'right',
    cameraStatus: 'idle', cameraError: null, shooting: false,
    photos: [null, null, null], activeSlot: 0, selectedSlot: 0, retakeSlot: null,
    frameId: null, caption: '', stickers: [], selectedSticker: null, stickerHistory: [],
    revealReady: false, busy: false, scroll: { frameX: 0, decorateX: 0 },
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
let guestAssetFailureHandling = false;
const guestSelectionGate = createLatestSelectionGate();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function setAppInert(inert) {
  document.querySelectorAll('.skip-link, .app-header, .progress-wrap, .workspace, .status-bar, .app-footer')
    .forEach((surface) => { surface.inert = inert; });
}

function startBootScreen() {
  const screen = $('bootScreen');
  if (!screen) {
    document.documentElement.classList.remove('boot-pending');
    return null;
  }
  setAppInert(true);
  screen.hidden = false;
  requestAnimationFrame(() => screen.classList.add('is-active'));
  return {
    screen,
    startedAt: performance.now(),
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

async function finishBootScreen(bootState) {
  if (!bootState) return;
  const minimum = bootState.reduced ? 80 : 760;
  const remaining = Math.max(0, minimum - (performance.now() - bootState.startedAt));
  if (remaining) await wait(remaining);
  bootState.screen.classList.add('is-opening');
  document.documentElement.classList.add('app-entering');
  await wait(bootState.reduced ? 40 : 680);
  bootState.screen.hidden = true;
  bootState.screen.setAttribute('aria-hidden', 'true');
  window.clearTimeout(window.__polaraBootFallback);
  document.documentElement.classList.remove('boot-pending');
  setAppInert(false);
  window.setTimeout(() => document.documentElement.classList.remove('app-entering'), 720);
}

const bootState = startBootScreen();

function status(message) {
  refs.status.textContent = message;
}

function currentGuestComposition(slotIndex = state.step === 'review' ? state.selectedSlot : state.activeSlot) {
  return createGuestComposition({
    experience: state.experience,
    guestId: state.guestId,
    layout: state.guestLayout,
    side: state.guestSide,
    mode: state.mode,
    slotIndex,
  });
}

const guestCompositionForSlot = (slotIndex) => currentGuestComposition(slotIndex);

function preloadGuestAsset(asset) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(asset);
    image.onerror = () => reject(new Error('Pose Mate guest asset is unavailable.'));
    image.src = asset.src;
  });
}

function applyGuestVariables(element, composition) {
  if (!element) return;
  const set = (name, value) => element.style.setProperty(name, `${value * 100}%`);
  set('--pose-user-x', composition.userRegion.x);
  set('--pose-user-y', composition.userRegion.y);
  set('--pose-user-width', composition.userRegion.width);
  set('--pose-user-height', composition.userRegion.height);
  set('--pose-guest-x', composition.guestRegion.x);
  set('--pose-guest-y', composition.guestRegion.y);
  set('--pose-guest-width', composition.guestRegion.width);
  set('--pose-guest-height', composition.guestRegion.height);
  element.style.setProperty('--pose-guest-transform', composition.flipGuest ? 'scaleX(-1)' : 'none');
}

function syncGuestExperienceSurfaces() {
  const guestComposition = currentGuestComposition();
  const active = Boolean(guestComposition);
  refs.stageShell.dataset.experience = active ? POSE_MATE_EXPERIENCE : 'regular';
  refs.startGuestPreview.hidden = !active;
  refs.poseMateControls.hidden = !active;
  refs.poseUserGuide.hidden = !active;
  refs.poseGuestPreview.hidden = !active;
  refs.reviewGuest.hidden = !active;
  refs.cameraWrap.dataset.poseMate = String(active);
  refs.reviewWrap.dataset.poseMate = String(active);
  refs.guestLayoutChoose.querySelectorAll('[data-guest-layout]').forEach((button) => {
    const selected = button.dataset.guestLayout === state.guestLayout;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (!active) {
    ['position', 'display', 'max-width', 'width', 'height', 'left', 'top', 'transform', 'object-fit', 'pointer-events']
      .forEach((property) => refs.reviewPhoto.style.removeProperty(property));
    return;
  }
  [refs.cameraWrap, refs.reviewWrap].forEach((element) => applyGuestVariables(element, guestComposition));
  refs.startGuestPreview.src = guestComposition.asset.src;
  refs.poseGuestPreview.src = guestComposition.asset.src;
  refs.reviewGuest.src = guestComposition.asset.src;
  refs.reviewGuest.alt = `${guestComposition.asset.name}, a fictional Polara guest.`;
  refs.poseGuideText.textContent = poseGuideForSlot(state.activeSlot, state.mode);
  refs.poseUserGuide.dataset.poseCue = poseGuideForSlot(state.activeSlot, state.mode);
  refs.guestSide.textContent = guestComposition.side === 'right' ? `Move ${guestComposition.asset.name} to the left` : `Move ${guestComposition.asset.name} to the right`;
}

async function handleGuestAssetError() {
  if (guestAssetFailureHandling || state.experience !== POSE_MATE_EXPERIENCE) return;
  guestAssetFailureHandling = true;
  try {
    guestSelectionGate.cancel();
    state.experience = 'regular';
    state.guestId = null;
    syncStartControls();
    invalidatePreparedExport();
    status('Pose Mate asset could not load. Polara returned to Regular Booth without changing your photos.');
    if (phCanvas && ['frame', 'decorate', 'reveal'].includes(state.step)) await renderCanvas();
  } finally {
    guestAssetFailureHandling = false;
  }
}

function syncPoca({ processing = false } = {}) {
  const asset = getPocaForState({ step: state.step, stickerCount: state.stickers.length, processing, revealReady: state.revealReady });
  refs.proofBuddy.dataset.state = state.step;
  refs.proofBuddyImage.src = asset.src;
  refs.proofBuddyImage.alt = asset.alt;
  refs.proofBuddyCaption.textContent = asset.alt;
  if (state.step === 'reveal') {
    const loadingAsset = getPocaForState({ step: 'reveal', processing: true, revealReady: false });
    refs.controlSheet.dataset.revealState = state.revealReady ? 'ready' : 'processing';
    refs.revealPanelPoca.src = loadingAsset.src;
    refs.revealPanelPoca.alt = loadingAsset.alt;
    refs.revealTitle.textContent = state.revealReady ? 'Proof approved.' : 'Developing your print…';
  } else {
    delete refs.controlSheet.dataset.revealState;
  }
}

function setActiveProof(index) {
  state = selectActiveProof(state, index);
}

function syncStageDocket() {
  const stepIndex = Math.max(0, STEPS.findIndex((step) => step.id === state.step));
  refs.stageShell.dataset.step = state.step;
  refs.stageDocketStep.textContent = `${String(stepIndex + 1).padStart(2, '0')} / ${STEPS[stepIndex].label}`;
  refs.stageDocketFormat.textContent = state.mode === 3
    ? 'Strip 3 · 720 × 1800 px'
    : 'Single · 1080 × 1350 px';
}

function meaningfulSession() {
  return state.photos.some(Boolean) || state.caption || state.stickers.length || state.step !== 'start';
}

function saveScrollState() {
  if (state.step === 'frame') state.scroll.frameX = refs.templateList.scrollLeft;
  if (state.step === 'decorate') state.scroll.decorateX = refs.stickerTray.scrollLeft;
}

function isStackedChapterViewport() {
  const shortLandscape = window.matchMedia('(max-height: 560px) and (orientation: landscape)').matches;
  return window.innerWidth <= 900 && !shortLandscape;
}

async function restoreChapterView({ focusTitle = true } = {}) {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  refs.controlScroll.scrollTop = 0;
  if (state.step === 'frame') refs.templateList.scrollLeft = state.scroll.frameX || 0;
  if (state.step === 'decorate') refs.stickerTray.scrollLeft = state.scroll.decorateX || 0;
  if (isStackedChapterViewport()) window.scrollTo({ top: 0, behavior: 'auto' });
  if (!focusTitle) return;
  const activePanel = refs.panels.find((panel) => panel.dataset.panel === state.step);
  activePanel?.querySelector('.panel-title')?.focus({ preventScroll: true });
}

function renderProgress() {
  const activeIndex = STEPS.findIndex((step) => step.id === state.step);
  refs.progress.setAttribute('aria-valuenow', String(activeIndex + 1));
  refs.progress.classList.toggle('rail-approved', state.step === 'reveal' && state.revealReady);
  refs.progressList.innerHTML = '';
  STEPS.forEach((step, index) => {
    const stepStatus = getProofStepStatus(state, step.id);
    const item = document.createElement('li');
    item.className = `progress-item ${stepStatus}`;
    item.dataset.status = stepStatus;
    item.setAttribute('aria-label', `${step.label}: ${stepStatus}`);
    if (stepStatus === 'current') item.setAttribute('aria-current', 'step');
    const dot = document.createElement('span');
    dot.className = 'progress-dot';
    dot.textContent = String(index + 1);
    if (stepStatus === 'complete') {
      const stamp = document.createElement('img');
      stamp.className = 'step-proof-stamp';
      stamp.src = 'assets/badges/proof-stamp-approved.png';
      stamp.alt = '';
      stamp.setAttribute('aria-hidden', 'true');
      dot.appendChild(stamp);
    }
    const label = document.createElement('span');
    label.className = 'progress-label';
    label.textContent = step.label;
    item.append(dot, label);
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
  setButton(refs.back, { label: 'Back', hidden: state.step === 'start', tone: 'ghost', disabled: state.shooting });
  setButton(refs.secondary, { hidden: true });
  setButton(refs.tertiary, { hidden: true });

  if (state.step === 'start') {
    setButton(refs.primary, { label: state.experience === POSE_MATE_EXPERIENCE ? 'Open Pose Mate' : 'Open camera', tone: 'primary' });
  } else if (state.step === 'camera') {
    const ready = state.cameraStatus === 'ready' || state.cameraStatus === 'demo';
    setButton(refs.primary, { label: state.shooting ? 'Taking photo…' : 'Take photo', tone: 'primary', disabled: !ready || state.shooting });
    setButton(refs.secondary, { label: 'Switch camera', tone: 'secondary', hidden: state.demo, disabled: state.cameraStatus !== 'ready' || state.shooting });
    setButton(refs.tertiary, { label: 'Demo mode', tone: 'ghost', hidden: state.demo, disabled: state.shooting });
  } else if (state.step === 'review') {
    setButton(refs.primary, { label: 'Choose frame', tone: 'primary' });
    setButton(refs.secondary, { label: `Retake proof ${state.selectedSlot + 1}`, tone: 'secondary' });
  } else if (state.step === 'frame') {
    setButton(refs.primary, { label: 'Continue to Decorate', tone: 'primary', disabled: !state.frameId });
  } else if (state.step === 'decorate') {
    setButton(refs.primary, { label: 'Reveal print', tone: 'primary' });
  } else if (state.step === 'reveal') {
    setButton(refs.primary, { label: 'Share', tone: 'primary', disabled: !state.revealReady });
    setButton(refs.secondary, { label: 'Save PNG', tone: 'secondary', hidden: false, disabled: !state.revealReady });
    setButton(refs.tertiary, { label: 'Photo only', tone: 'ghost', hidden: false, disabled: !state.revealReady });
  }
}

async function goToStep(nextStep, message, { focusTitle = true } = {}) {
  if (state.busy || !STEPS.some((step) => step.id === nextStep)) return;
  state.busy = true;
  updateActions();
  try {
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
    syncStageDocket();
    refs.controlSheet.dataset.step = nextStep;
    refs.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== nextStep; });
    refs.startView.hidden = nextStep !== 'start';
    refs.cameraView.hidden = nextStep !== 'camera';
    refs.reviewView.hidden = nextStep !== 'review';
    refs.canvasView.hidden = !['frame', 'decorate', 'reveal'].includes(nextStep);
    refs.revealBuddy.hidden = true;
    refs.canvasView.classList.remove('revealing');
    updateActions();

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
    if (nextStep === 'reveal') await startReveal({ focusTitle });

    if (message) status(message);
    syncPoca();
    if (nextStep !== 'reveal') await restoreChapterView({ focusTitle });
  } finally {
    state.busy = false;
    updateActions();
  }
}

function syncStartControls() {
  refs.experienceChoose.querySelectorAll('[data-experience]').forEach((button) => {
    const active = button.dataset.experience === state.experience;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
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
  syncGuestExperienceSurfaces();
  updateActions();
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
  syncStageDocket();
  status(state.mode === 3 ? 'Strip 3 selected. Get three poses ready.' : 'Single selected. Get one main pose ready.');
});

refs.timerChoose.addEventListener('click', (event) => {
  const button = event.target.closest('[data-timer]');
  if (!button) return;
  state.timer = Number(button.dataset.timer);
  syncStartControls();
  status(`Timer ${state.timer} seconds selected.`);
});

refs.guestLayoutChoose.addEventListener('click', (event) => {
  const button = event.target.closest('[data-guest-layout]');
  if (!button) return;
  state.guestLayout = button.dataset.guestLayout;
  refs.guestLayoutChoose.querySelectorAll('[data-guest-layout]').forEach((item) => {
    const active = item.dataset.guestLayout === state.guestLayout;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  invalidatePreparedExport();
  syncGuestExperienceSurfaces();
  status(state.guestLayout === 'matched' ? 'Matched gesture composition selected.' : 'Side-by-side composition selected.');
});

refs.guestSide.addEventListener('click', () => {
  state.guestSide = state.guestSide === 'right' ? 'left' : 'right';
  invalidatePreparedExport();
  syncGuestExperienceSurfaces();
  status(`Mina moved to the ${state.guestSide}.`);
});

async function beginCamera({ retake = false } = {}) {
  if (!retake) {
    const slots = state.mode === 3 ? 3 : 1;
    if (state.photos.length !== slots) state.photos = Array(slots).fill(null);
    state.activeSlot = state.photos.findIndex((photo) => !photo);
    if (state.activeSlot < 0) state.activeSlot = state.selectedSlot;
  }
  await goToStep('camera', retake ? 'The previous proof stays safe until its replacement succeeds.' : 'Allow camera access, then get ready to pose.');
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
      suspendCameraSession('Camera disconnected. Existing proofs are safe; restart the camera to continue.');
    }, { once: true });
    showCameraState();
    status('Camera ready. Keep everyone inside the guide, then press Take photo.');
    return true;
  } catch (error) {
    if (requestId !== cameraRequestId || state.demo || error?.name === 'AbortError') return false;
    state.cameraStatus = classifyCameraError(error);
    state.cameraError = error;
    showCameraState();
    status(state.cameraStatus === 'denied' ? 'Camera access was denied. Allow it in browser settings or use demo mode.' : 'Camera is unavailable. You can still test the flow in demo mode.');
    return false;
  }
}

function showCameraState() {
  const ready = state.cameraStatus === 'ready';
  const demo = state.cameraStatus === 'demo';
  const stateLabel = CAMERA_STATE_LABELS[state.cameraStatus] || CAMERA_STATE_LABELS.idle;
  refs.cameraWrap.dataset.cameraState = state.cameraStatus;
  refs.cameraOverlayTitle.textContent = stateLabel;
  refs.cameraBayStatus.textContent = stateLabel;
  refs.cameraOverlay.hidden = ready || demo;
  refs.cameraOverlayActions.hidden = ready || demo || state.cameraStatus === 'idle';
  refs.retryCamera.hidden = !['denied', 'unavailable', 'paused'].includes(state.cameraStatus);
  refs.demoMode.hidden = ready || demo;
  if (state.cameraStatus === 'requesting') refs.cameraMessage.textContent = 'Poca is requesting camera permission…';
  else if (state.cameraStatus === 'switching') refs.cameraMessage.textContent = 'Switching camera…';
  else if (state.cameraStatus === 'denied') refs.cameraMessage.textContent = 'Camera permission was not granted. Check browser settings or continue without camera.';
  else if (state.cameraStatus === 'unavailable') refs.cameraMessage.textContent = 'No supported camera was found in this browser.';
  else if (state.cameraStatus === 'paused') refs.cameraMessage.textContent = 'Camera paused to protect privacy and battery.';
  else if (state.cameraStatus === 'idle') refs.cameraMessage.textContent = 'Camera has not started.';
  refs.video.hidden = demo;
  refs.cameraStateNote.textContent = demo
    ? 'Demo mode aktif. Setiap Take photo membuat placeholder lokal untuk menguji flow.'
    : state.cameraStatus === 'ready' ? 'Camera ready. The full capture is kept without permanent cropping.'
      : state.cameraStatus === 'paused' ? 'Press Try again to restart the camera. Existing proofs will not change.'
        : 'The session and existing proofs remain safe.';
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
    const activeIndex = state.step === 'camera' ? state.activeSlot : state.selectedSlot;
    const selected = index === activeIndex;
    let proofState = 'waiting';
    let stateLabel = 'Waiting';
    if (state.step === 'camera') {
      if (photo && state.retakeSlot === index) {
        proofState = 'retake-safe';
        stateLabel = 'Retake safe';
      } else if (photo) {
        proofState = 'saved';
        stateLabel = 'Saved';
      } else if (selected) {
        proofState = 'next';
        stateLabel = 'Next';
      }
    } else if (photo) {
      proofState = selected ? 'inspecting' : 'saved';
      stateLabel = selected ? 'Inspecting' : 'Saved';
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `slot-card${selected ? ' active' : ''}`;
    button.dataset.proofState = proofState;
    button.setAttribute('aria-label', photo ? `Choose proof ${index + 1}, ${stateLabel}` : `Proof ${index + 1}, ${stateLabel}`);
    button.setAttribute('aria-pressed', String(selected));
    button.innerHTML = photo
      ? `<img src="${photo.src}" alt="Proof preview ${index + 1}" /><span class="slot-number">${index + 1}</span><span class="slot-state">${stateLabel}</span>`
      : `<span class="slot-empty">Proof ${index + 1}</span><span class="slot-number">${index + 1}</span><span class="slot-state">${stateLabel}</span>`;
    button.addEventListener('click', () => onSelect(index));
    container.appendChild(button);
  });
  wireCollectionKeyboard(container, '.slot-card', { activateOnMove: state.step === 'review' });
}

function renderCameraPanel() {
  const slot = state.activeSlot + 1;
  refs.cameraBayCounter.textContent = `Proof ${slot} / ${state.mode}`;
  refs.cameraPanelTitle.textContent = state.retakeSlot != null ? `Retake slot ${slot}` : state.mode === 3 ? `Pose for proof ${slot}` : 'One main pose';
  refs.cameraPanelCopy.textContent = state.retakeSlot != null
    ? 'The previous proof stays in place until the replacement capture succeeds.'
    : state.experience === POSE_MATE_EXPERIENCE
      ? `Match the ${poseGuideForSlot(state.activeSlot, state.mode).toLowerCase()} cue. Polara keeps your full capture untouched.`
      : 'Polara keeps the full capture. Adjust fit, zoom, and pan after choosing a frame.';
  renderSlotCards(refs.cameraSlots, (index) => {
    state.activeSlot = index;
    state.retakeSlot = state.photos[index] ? index : null;
    renderCameraPanel();
    status(state.photos[index] ? `Proof ${index + 1} selected for retake; the previous proof is still safe.` : `Proof ${index + 1} is ready.`);
  });
  syncGuestExperienceSurfaces();
  showCameraState();
}

async function runCountdown(seconds) {
  const requestId = ++countdownRequestId;
  refs.countdown.hidden = false;
  try {
    for (let number = seconds; number > 0; number -= 1) {
      if (requestId !== countdownRequestId || document.hidden || state.step !== 'camera') {
        const error = new Error('Countdown was cancelled.');
        error.name = 'AbortError';
        throw error;
      }
      refs.countdown.textContent = String(number);
      refs.countdownLive.textContent = `${number}`;
      await new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? 300 : 760));
    }
    if (requestId !== countdownRequestId || document.hidden || state.step !== 'camera') {
      const error = new Error('Countdown was cancelled.');
      error.name = 'AbortError';
      throw error;
    }
    refs.countdownLive.textContent = 'Photo taken';
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
  status(`Get ready for proof ${slot + 1}…`);

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
      await goToStep('review', `Proof ${slot + 1} was replaced. Other proofs stay unchanged.`);
      return;
    }

    const nextEmpty = state.photos.findIndex((photo) => !photo);
    if (nextEmpty === -1) {
      state.shooting = false;
      await goToStep('review', state.mode === 3 ? 'All three proofs are ready. Check each one before choosing a frame.' : 'Your proof is ready. Review it before choosing a frame.');
      return;
    }

    state.activeSlot = nextEmpty;
    state.shooting = false;
    renderCameraPanel();
    status(`Photo saved to proof ${slot + 1}. Prepare the pose for proof ${nextEmpty + 1}.`);
  } catch (error) {
    state.shooting = false;
    refs.shotBadge.hidden = true;
    if (state.step === 'camera') {
      status(error?.name === 'AbortError'
        ? 'Capture paused. Existing proofs remain safe.'
        : `The photo was not captured. ${error.message || 'Please try again.'}`);
    }
  }
  updateActions();
}

function renderReview() {
  state.selectedSlot = Math.min(state.selectedSlot, state.photos.length - 1);
  const photo = state.photos[state.selectedSlot] || state.photos.find(Boolean);
  const activeProof = state.selectedSlot + 1;
  const proofLabel = `Proof ${activeProof} of ${state.mode}`;
  if (photo) refs.reviewPhoto.src = photo.src;
  refs.reviewPhoto.alt = `${proofLabel} under review`;
  refs.reviewWrap.dataset.activeProof = String(activeProof);
  refs.reviewProofTag.textContent = proofLabel;
  refs.reviewProofLabel.textContent = proofLabel;
  refs.reviewSourceMeta.textContent = `Original ${photo?.naturalWidth || 0}×${photo?.naturalHeight || 0} · kept locally`;
  syncGuestExperienceSurfaces();
  if (photo && currentGuestComposition()) {
    const apply = () => applyPhotoGeometry(refs.reviewPhotoRegion, refs.reviewPhoto, photo);
    refs.reviewPhoto.addEventListener('load', apply, { once: true });
    requestAnimationFrame(apply);
  }
  renderSlotCards(refs.reviewSlots, (index) => {
    setActiveProof(index);
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
    button.dataset.mode = template.mode;
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
    detail.textContent = unavailable ? 'Unavailable' : (template.pickerDetail || (template.mode === 'strip' ? '3 photos' : '1 photo'));
    const familyProfile = template.familyProfile;
    button.setAttribute('aria-label', [template.name, familyProfile?.material, detail.textContent].filter(Boolean).join(', '));
    meta.append(name, detail);
    if (template.pickerBadge && template.status === 'experimental-static') {
      const badge = document.createElement('span');
      badge.className = 'tpl-badge';
      badge.textContent = template.pickerBadge;
      thumb.appendChild(badge);
    }
    const formatBadge = document.createElement('span');
    formatBadge.className = 'tpl-format-badge';
    formatBadge.textContent = template.mode === 'strip' ? 'Strip 3' : 'Single';
    thumb.appendChild(formatBadge);
    if (familyProfile?.material) {
      const material = document.createElement('span');
      material.className = 'tpl-family-material';
      material.textContent = familyProfile.material;
      meta.appendChild(material);
    }
    button.append(thumb, meta);
    button.addEventListener('click', async () => {
      if (unavailableFrameIds.has(template.id)) return;
      saveScrollState();
      selectFramePreservingEditorState(state, template.id);
      updateTemplateSelection();
      renderFrameEditionDossier();
      await renderCanvas();
      if (!isRequestedFrameStillSelected(template.id, state.frameId)) return;
      status(template.status === 'experimental-static'
        ? 'Live Frame is an experimental visual. The result remains a static PNG, not a GIF or video.'
        : `${template.name} selected. Photo transforms are preserved.`);
    });
    refs.templateList.appendChild(button);
    buildTemplateThumb(template, thumb);
  });
  wireCollectionKeyboard(refs.templateList, '.tpl-btn');
  renderFrameEditionDossier();
}

function renderFrameEditionDossier() {
  const template = getTemplate(state.frameId);
  const familyProfile = template?.familyProfile;
  if (!template || !familyProfile || !refs.frameEditionDossier) return;

  const exclusive = getStickerPack(template.familyId)
    .find((asset) => asset.id === familyProfile.exclusiveStickerId);
  refs.frameEditionName.textContent = template.name;
  refs.frameEditionStory.textContent = familyProfile.story;
  refs.frameEditionMaterial.textContent = familyProfile.material;
  refs.frameEditionExclusive.textContent = exclusive ? `${exclusive.name} in Decorate` : 'Available in Decorate';
  refs.frameEditionExclusiveImage.hidden = !exclusive;
  if (exclusive) refs.frameEditionExclusiveImage.src = exclusive.src;
  refs.frameEditionPalette.replaceChildren(...familyProfile.palette.map((color) => {
    const swatch = document.createElement('span');
    swatch.style.setProperty('--frame-swatch', color);
    return swatch;
  }));
  refs.frameEditionDossier.dataset.family = template.familyId;
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
      fallback.textContent = 'Preview unavailable';
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
    mount.textContent = 'Preview unavailable';
    console.debug('Frame thumbnail failed:', template.id, error);
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
  refs.canvasView.dataset.proofMode = template.mode;
  syncCaptionAvailability(template);
  const token = ++renderToken;
  try {
    const html = await resolveTemplateHtml(template);
    if (token !== renderToken) return;
    phCanvas = renderTemplate(refs.stage, html);
    await waitForOverlayImage(phCanvas);
    if (token !== renderToken) return;
    refreshPhotoSlots(phCanvas, state.photos, { guestCompositionForSlot, onGuestAssetError: handleGuestAssetError });
    setMeta(phCanvas, {
      caption: state.caption || 'Polara memory',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      brand: BRAND_LINE,
    });
    fitStage(templateDims(template));
    refreshPhotoSlots(phCanvas, state.photos, { guestCompositionForSlot, onGuestAssetError: handleGuestAssetError });
    renderEditorStickers();
  } catch (error) {
    if (template.renderMode === 'png-overlay') {
      unavailableFrameIds.add(template.id);
      const failedButton = refs.templateList.querySelector(`[data-template-id="${CSS.escape(template.id)}"]`);
      if (failedButton) {
        failedButton.disabled = true;
        failedButton.classList.add('unavailable');
        const detail = failedButton.querySelector('.tpl-detail');
        if (detail) detail.textContent = 'Unavailable';
      }
      const fallback = findAvailableTemplate(templates, templateModeForSession(), unavailableFrameIds);
      if (fallback) {
        selectFramePreservingEditorState(state, fallback.id);
        updateTemplateSelection();
        renderFrameEditionDossier();
        status(`${template.name} failed to load. Polara switched to ${fallback.name}; photos and decorations remain safe.`);
        await renderCanvas();
        return;
      }
    }
    status(`Frame failed to load. The session is safe; choose another frame or try again. ${error.message || ''}`);
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
      setActiveProof(index);
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
  if (phCanvas) {
    setPhotoSlot(phCanvas, state.selectedSlot + 1, state.photos[state.selectedSlot], { guestCompositionForSlot, onGuestAssetError: handleGuestAssetError });
  }
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
  setPhotoSlot(phCanvas, state.selectedSlot + 1, state.photos[state.selectedSlot], { guestCompositionForSlot, onGuestAssetError: handleGuestAssetError });
  syncPhotoControls();
  status(`Proof ${state.selectedSlot + 1} now shows the full photo.`);
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
  const interactive = state.step === 'decorate';
  if (state.selectedSticker && !state.stickers.some((item) => item.uid === state.selectedSticker)) {
    state.selectedSticker = null;
  }
  renderStickerLayer(phCanvas, state.stickers, {
    selectedId: interactive ? state.selectedSticker : null,
    interactive,
    onSelect: (uid) => {
      state.selectedSticker = uid;
      setStickerSelection(phCanvas, uid);
      renderStickerBench();
    },
    onInteractionStart: snapshotStickers,
    onChange: () => {},
    onDelete: (uid) => {
      state.stickers = state.stickers.filter((item) => item.uid !== uid);
      if (state.selectedSticker === uid) state.selectedSticker = null;
      renderEditorStickers();
      updateStickerActions();
    },
    onAssetError: (item) => status(`Sticker ${item.name} failed to load. Other stickers and the session remain safe.`),
  });
  updateStickerActions();
  syncPoca();
}

function renderStickerBench() {
  const view = getStickerBenchView(state.stickers, state.selectedSticker);
  refs.stickerBench.dataset.state = view.state;
  refs.stickerInspector.dataset.state = view.state;
  if (refs.stickerBenchStatus.textContent !== view.status) {
    refs.stickerBenchStatus.textContent = view.status;
  }

  refs.stickerInspectorImage.hidden = !view.active;
  if (view.active) refs.stickerInspectorImage.src = view.active.src;
  refs.stickerInspectorName.textContent = view.active?.instanceLabel
    || (view.count
      ? `${view.count} sticker${view.count === 1 ? '' : 's'} on this proof`
      : 'Pick a sticker from the rail');
  refs.stickerInspectorHint.textContent = view.active
    ? `${view.active.categoryLabel} · Drag to move · handles resize and rotate · Arrow keys nudge · Delete removes`
    : 'Each sticker is added locally and stays editable on the proof.';
}

function renderStickerTray() {
  refs.stickerTray.innerHTML = '';
  const template = getTemplate(state.frameId);
  const stickerPack = getStickerPack(template?.familyId);
  const exclusive = stickerPack.find((asset) => asset.exclusiveFamilyId === template?.familyId);
  if (refs.stickerRailMeta) refs.stickerRailMeta.textContent = exclusive
    ? `${exclusive.name} + 19 universal`
    : '19 universal stickers';
  refs.stickerTray.setAttribute('aria-label', `Add a sticker for ${template?.name || 'the selected frame'}`);
  stickerPack.forEach((asset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sticker-btn${asset.exclusiveFamilyId ? ' exclusive' : ''}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-label', `Add ${asset.exclusiveFamilyId ? 'exclusive ' : ''}sticker ${asset.name}`);
    if (asset.pickerBadge) {
      const badge = document.createElement('span');
      badge.className = 'sticker-badge';
      badge.textContent = asset.pickerBadge;
      button.appendChild(badge);
    }
    const image = document.createElement('img');
    image.src = asset.src;
    image.alt = '';
    image.loading = 'lazy';
    image.onerror = () => { button.disabled = true; button.hidden = true; status(`Asset ${asset.name} is unavailable; the item was skipped without resetting the session.`); };
    button.appendChild(image);
    const label = document.createElement('span');
    label.className = 'sticker-label';
    label.textContent = asset.name;
    button.appendChild(label);
    const kind = document.createElement('span');
    kind.className = 'sticker-kind';
    kind.textContent = getStickerCategoryLabel(asset.category);
    button.appendChild(kind);
    if (asset.exclusiveFamilyId) {
      const match = document.createElement('span');
      match.className = 'sticker-family-match';
      match.textContent = 'Made for this frame';
      match.setAttribute('aria-label', `Poca match for ${template?.name || 'this frame'}`);
      button.appendChild(match);
    }
    button.addEventListener('click', () => {
      snapshotStickers();
      const item = createStickerInstance(asset);
      state.stickers.push(item);
      state.selectedSticker = item.uid;
      renderEditorStickers();
      status(`${asset.name} added. Drag it on the proof or use the keyboard.`);
    });
    refs.stickerTray.appendChild(button);
  });
  wireCollectionKeyboard(refs.stickerTray, '.sticker-btn');
  updateStickerActions();
}

function updateStickerActions() {
  refs.undoSticker.disabled = !state.stickerHistory.length;
  refs.resetSticker.disabled = !state.stickers.length;
  renderStickerBench();
}

refs.undoSticker.addEventListener('click', () => {
  const previous = state.stickerHistory.pop();
  if (previous == null) return;
  state.stickers = JSON.parse(previous);
  state.selectedSticker = null;
  renderEditorStickers();
  status('The last sticker change was undone.');
});

refs.resetSticker.addEventListener('click', () => {
  if (!state.stickers.length) return;
  snapshotStickers();
  state.stickers = [];
  state.selectedSticker = null;
  renderEditorStickers();
  status('All stickers were cleared. You can still undo.');
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

function renderRevealProofStack() {
  refs.revealProofStack.innerHTML = '';
  framesForMode().filter((template) => template.id !== state.frameId && template.pickerThumbnailSrc).slice(0, 2).forEach((template) => {
    const image = document.createElement('img');
    image.src = template.pickerThumbnailSrc;
    image.alt = '';
    image.loading = 'eager';
    image.decoding = 'async';
    image.addEventListener('error', () => image.remove(), { once: true });
    refs.revealProofStack.appendChild(image);
  });
}

async function prepareFramedExport() {
  if (preparedFramedExport) return preparedFramedExport;
  if (!phCanvas || !state.frameId) throw new Error('The framed result is not ready.');

  const requestId = ++preparedExportRequestId;
  const { width, height } = framedExportSize();
  const dataUrl = await exportPng(phCanvas);
  await assertExportDimensions(dataUrl, width, height);
  const blob = await dataUrlToBlob(dataUrl);
  if (requestId !== preparedExportRequestId || state.step !== 'reveal') {
    const error = new Error('Result preparation was cancelled.');
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

function renderRevealDossier() {
  const dossier = getRevealDossier({
    mode: state.mode,
    frameName: getTemplate(state.frameId)?.name,
    stickerCount: state.stickers.length,
  });
  refs.revealDossierFormat.textContent = dossier.format;
  refs.revealDossierFrame.textContent = dossier.frame;
  refs.revealDossierDecorations.textContent = dossier.decorations;
  refs.revealDossierPrivacy.textContent = dossier.privacy;
}

async function startReveal({ focusTitle = true } = {}) {
  const requestId = ++revealRequestId;
  invalidatePreparedExport();
  state.selectedSticker = null;
  state.revealReady = false;
  syncPoca({ processing: true });
  renderProgress();
  updateActions();
  await restoreChapterView({ focusTitle });
  await renderCanvas();
  renderRevealProofStack();
  renderRevealDossier();
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  refs.canvasView.classList.remove('revealing');
  void refs.canvasView.offsetWidth;
  refs.canvasView.classList.add('revealing');
  status('Poca is developing your print…');
  await new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? 20 : 980));
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  status('The proof is visible while Polara prepares the file for mobile sharing.');
  try {
    await prepareFramedExport();
  } catch (error) {
    if (error?.name !== 'AbortError') status('The proof is ready. File preparation will retry when you save or share.');
  }
  if (requestId !== revealRequestId || state.step !== 'reveal') return;
  state.revealReady = true;
  refs.revealBuddy.hidden = false;
  syncPoca();
  renderProgress();
  updateActions();
  status('Proof approved. Ready to share or save.');
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
  await withBusy('Creating the exact-size PNG…', async () => {
    try {
      const prepared = await prepareFramedExport();
      await download(prepared.blob, prepared.filename);
      status(`PNG saved (${prepared.width}×${prepared.height}).`);
    } catch (error) {
      status(error.message || 'Export failed. Your proof is safe; try again.');
    }
  });
}

async function downloadRaw() {
  await withBusy('Preparing the photo without a frame…', async () => {
    try {
      const guestComposition = currentGuestComposition();
      const url = await retryWithoutGuestOnFailure({
        guestComposition,
        create: (composition) => exportRawPng(state.photos, state.mode, {
          guestCompositionForSlot: composition ? guestCompositionForSlot : null,
        }),
        isGuestError: (error) => error?.code === 'GUEST_ASSET_ERROR',
        onGuestFailure: handleGuestAssetError,
      });
      await assertExportDimensions(url, state.mode === 3 ? 720 : 1080, state.mode === 3 ? 1800 : 1350);
      const blob = await dataUrlToBlob(url);
      await download(blob, `polara-photo-only-${Date.now()}.png`);
      status('The unframed photo was saved. The framed proof remains in this session.');
    } catch (error) {
      status(`The unframed photo could not be created. ${error.message || 'Please try again.'}`);
    }
  });
}

async function shareResult() {
  await withBusy('Preparing the proof for sharing…', async () => {
    const preparedAtClick = preparedFramedExport;
    const text = `Here is my Polara print! Make yours at ${POLARA_URL} 🐱`;

    if (supportsPreparedFileShare(preparedAtClick)) {
      try {
        // Panggil sebelum await pertama agar transient user activation di HP tidak hilang.
        await navigator.share({ files: [preparedAtClick.file], text });
        status('Your proof was shared.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          status('Sharing was cancelled. The proof remains ready to try again.');
          return;
        }
        status('Native sharing did not open. Polara is preparing a download instead.');
      }
    }

    try {
      const prepared = preparedAtClick || await prepareFramedExport();
      await download(prepared.blob, prepared.filename);
      status('File sharing is unsupported or did not open, so the PNG was downloaded instead.');
    } catch (error) {
      status(`Sharing did not complete. ${error.message || 'The proof is safe; try again.'}`);
    }
  });
}

function assertExportDimensions(dataUrl, expectedWidth, expectedHeight) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth === expectedWidth && image.naturalHeight === expectedHeight) resolve();
      else reject(new Error(`Export size ${image.naturalWidth}×${image.naturalHeight}, expected ${expectedWidth}×${expectedHeight}. Nothing was downloaded.`));
    };
    image.onerror = () => reject(new Error('Export dimensions could not be verified. Nothing was downloaded.'));
    image.src = dataUrl;
  });
}

refs.primary.addEventListener('click', async () => {
  if (state.step === 'start') await beginCamera();
  else if (state.step === 'camera') await takePhoto();
  else if (state.step === 'review') await goToStep('frame', 'Choose a frame. Photo adjustments remain reversible.');
  else if (state.step === 'frame') await goToStep('decorate', 'Add a caption and stickers. Photos and frame remain unchanged when you go back.');
  else if (state.step === 'decorate') await goToStep('reveal');
  else if (state.step === 'reveal') await shareResult();
});

refs.secondary.addEventListener('click', async () => {
  if (state.step === 'camera') {
    const previousFacing = state.facing;
    state.facing = previousFacing === 'user' ? 'environment' : 'user';
    const switched = await requestCamera({ switching: true });
    if (switched && state.facing === previousFacing) {
      status('No other camera was found; the active camera remains in use. Photos and session are safe.');
    }
    if (!switched) state.facing = previousFacing;
    if (!switched && state.cameraStatus !== 'denied' && state.step === 'camera' && !state.demo) {
      status('The requested camera is unavailable. Polara is restoring the previous camera.');
      const restored = await requestCamera({ switching: true });
      if (restored) status('The previous camera was restored. Photos and session are safe.');
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
      await goToStep('review', 'Existing proofs are preserved.');
    } else {
      await goToStep('start', 'Format and timer choices are unchanged.');
    }
  } else if (state.step === 'review') {
    state.retakeSlot = state.selectedSlot;
    state.activeSlot = state.selectedSlot;
    await beginCamera({ retake: true });
  } else if (state.step === 'frame') await goToStep('review', 'Back to Review without resetting proof choices.');
  else if (state.step === 'decorate') await goToStep('frame', 'Caption and stickers stay in the session while you choose another frame.');
  else if (state.step === 'reveal') await goToStep('decorate', 'The proof stays intact. Continue decorating.');
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
  status('Demo mode is active. These local placeholders only test the Polara flow.');
}
refs.demoMode.addEventListener('click', activateDemoMode);

refs.newSession.addEventListener('click', () => {
  if (!meaningfulSession()) { resetSession(); return; }
  refs.dialog.showModal();
});
refs.cancelNewSession.addEventListener('click', () => refs.dialog.close());
refs.confirmNewSession.addEventListener('click', () => { refs.dialog.close(); resetSession(); });
refs.dialog.addEventListener('cancel', () => status('The current session is still open.'));

let privacyReturnFocus = null;
refs.privacy.addEventListener('click', () => {
  privacyReturnFocus = document.activeElement;
  refs.privacyDialog.showModal();
  requestAnimationFrame(() => refs.closePrivacy.focus());
});
refs.closePrivacy.addEventListener('click', () => refs.privacyDialog.close());
refs.privacyDialog.addEventListener('close', () => {
  if (privacyReturnFocus instanceof HTMLElement) privacyReturnFocus.focus();
  privacyReturnFocus = null;
});
refs.privacyDialog.addEventListener('click', (event) => {
  if (event.target !== refs.privacyDialog) return;
  const box = refs.privacyDialog.getBoundingClientRect();
  const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  if (!inside) refs.privacyDialog.close();
});

async function resetSession() {
  cameraRequestId += 1;
  revealRequestId += 1;
  guestSelectionGate.cancel();
  cancelCountdown();
  invalidatePreparedExport();
  stopCamera();
  unavailableFrameIds.clear();
  state = initialState();
  phCanvas = null;
  refs.stage.innerHTML = '';
  refs.caption.value = '';
  await goToStep('start', 'New session ready. Choose a format and timer.');
}

function wireCollectionKeyboard(container, selector, { activateOnMove = false } = {}) {
  const keyboardKey = `${selector}:${activateOnMove ? 'activate' : 'focus'}`;
  if (container.dataset.collectionKeyboard === keyboardKey) return;
  container.dataset.collectionKeyboard = keyboardKey;
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
    if (next) {
      event.preventDefault();
      next.focus();
      if (activateOnMove) next.click();
    }
  });
}

refs.experienceChoose.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-experience]');
  if (!button) return;
  const requestedExperience = button.dataset.experience;
  const requestId = guestSelectionGate.begin();
  if (requestedExperience === state.experience) return;
  if (requestedExperience === POSE_MATE_EXPERIENCE) {
    const guest = getGuest(DEFAULT_GUEST_ID);
    button.setAttribute('aria-busy', 'true');
    try {
      await Promise.all(getGuestAssets(guest.id).map(preloadGuestAsset));
      if (!guestSelectionGate.isCurrent(requestId)) return;
      state.experience = POSE_MATE_EXPERIENCE;
      state.guestId = guest.id;
      status('Pose Mate selected. Mina will join every preview and exact-size export.');
    } catch {
      if (!guestSelectionGate.isCurrent(requestId)) return;
      state.experience = 'regular';
      state.guestId = null;
      status('Pose Mate is unavailable right now. Regular Booth remains ready.');
    } finally {
      button.removeAttribute('aria-busy');
    }
  } else {
    state.experience = 'regular';
    state.guestId = null;
    status('Regular Booth selected. Your photos stay character-free.');
  }
  invalidatePreparedExport();
  syncStartControls();
});

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    thumbFrames.forEach(({ frame, w, h, mode, focus }) => scaleThumb(frame, w, h, mode, focus));
    if (phCanvas && ['frame', 'decorate', 'reveal'].includes(state.step)) {
      fitStage(templateDims(getTemplate(state.frameId)));
      refreshPhotoSlots(phCanvas, state.photos, { guestCompositionForSlot, onGuestAssetError: handleGuestAssetError });
      renderEditorStickers();
    }
  }, 120);
}

window.addEventListener('resize', handleResize);
window.visualViewport?.addEventListener('resize', handleResize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspendCameraSession('Camera paused while Polara is hidden. Existing proofs remain safe.');
});
window.addEventListener('pagehide', () => {
  cameraRequestId += 1;
  cancelCountdown();
  stopCamera();
});
document.querySelectorAll('.mascot-runtime').forEach((image) => {
  image.addEventListener('error', () => { image.hidden = true; });
});
[refs.startGuestPreview, refs.poseGuestPreview, refs.reviewGuest].forEach((image) => {
  image.addEventListener('error', handleGuestAssetError);
});

preloadMascots();
try {
  await goToStep('start', 'Choose a format and timer, then open the camera when ready.', { focusTitle: false });
} finally {
  await finishBootScreen(bootState);
}
