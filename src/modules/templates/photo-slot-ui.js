/**
 * Pure presentation contract for photo windows in the editor canvas.
 * Empty windows remain visible for Strip 3, but never become interactive.
 */
export function getPhotoSlotPresentation({ photo, index, selectedSlot, interactive }) {
  const filled = Boolean(photo);
  const selectable = filled && interactive;
  const current = filled && index === selectedSlot;
  return {
    state: !filled ? 'empty' : current ? 'active' : 'filled',
    selectable,
    current,
    tabIndex: selectable ? 0 : -1,
    label: filled
      ? `Select photo ${index + 1} to adjust`
      : `Photo ${index + 1} waiting for capture`,
  };
}

export function applyPhotoSlotPresentation(slot, presentation) {
  slot.dataset.photoState = presentation.state;
  slot.dataset.photoSelectable = String(presentation.selectable);
  slot.tabIndex = presentation.tabIndex;
  slot.setAttribute('aria-label', presentation.label);
  slot.setAttribute('aria-disabled', String(!presentation.selectable));
  slot.setAttribute('aria-current', String(presentation.current));
  if (presentation.selectable) {
    slot.setAttribute('role', 'button');
  } else {
    slot.removeAttribute('role');
  }
}

export function getFrameCardState({ active, unavailable }) {
  if (unavailable) return 'unavailable';
  return active ? 'active' : 'inactive';
}
