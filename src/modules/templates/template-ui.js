export function getTemplatePreviewConfig(template) {
  const previewSrc = template.pickerThumbnailSrc || template.thumbnailSrc;
  if (!previewSrc) return { kind: 'iframe' };
  const version = encodeURIComponent(template.assetVersion || '1');
  return { kind: 'image', src: `${previewSrc}?v=${version}` };
}

export function getTemplatePreviewSources(template) {
  const version = encodeURIComponent(template.assetVersion || '1');
  const sources = [];
  if (template.pickerThumbnailSrc) {
    sources.push({
      kind: 'image',
      role: 'picker',
      src: `${template.pickerThumbnailSrc}?v=${version}`,
    });
  }
  if (template.thumbnailSrc && template.thumbnailSrc !== template.pickerThumbnailSrc) {
    sources.push({
      kind: 'image',
      role: 'frame',
      src: `${template.thumbnailSrc}?v=${version}`,
    });
  }
  return sources;
}

export function getFramePreviewState({ active = false, unavailable = false } = {}) {
  if (unavailable) return 'unavailable';
  return active ? 'active' : 'inactive';
}

export function selectFramePreservingEditorState(state, frameId) {
  state.frameId = frameId;
  return state;
}

export function templateSupportsDynamicText(template) {
  return template.supportsDynamicText !== false;
}


export function findAvailableTemplate(templates, mode, unavailableIds = new Set()) {
  const available = templates.filter((template) => template.mode === mode && !unavailableIds.has(template.id));
  const hero = available.find((template) => template.renderMode === 'png-overlay');
  return hero || available[0] || null;
}

export function isRequestedFrameStillSelected(requestedFrameId, currentFrameId) {
  return requestedFrameId === currentFrameId;
}
