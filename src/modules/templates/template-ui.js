export function getTemplatePreviewConfig(template) {
  if (!template.thumbnailSrc) return { kind: 'iframe' };
  const version = encodeURIComponent(template.assetVersion || '1');
  return { kind: 'image', src: `${template.thumbnailSrc}?v=${version}` };
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
