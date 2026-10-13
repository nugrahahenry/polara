import { resolveGuestPlacement } from '../core/guest-placement.js';

export function mountGuestPlacementControls(root, onChange, onReset, onFlip) {
  const prefix = root.id;
  root.innerHTML = `
    <details class="guest-adjust">
      <summary><span>Adjust Pose Mate</span><span class="guest-adjust-photo"></span></summary>
      <fieldset>
        <legend class="sr-only">Pose Mate position and size</legend>
        <p class="guest-adjust-hint">Only this photo changes. You can adjust it again in Frames.</p>
        <label class="range-field" for="${prefix}-x"><span>Horizontal</span><input id="${prefix}-x" data-placement="x" type="range" min="0" max="100" step="1" /><output></output></label>
        <label class="range-field" for="${prefix}-y"><span>Vertical</span><input id="${prefix}-y" data-placement="y" type="range" min="0" max="100" step="1" /><output></output></label>
        <label class="range-field" for="${prefix}-scale"><span>Size</span><input id="${prefix}-scale" data-placement="scale" type="range" min="60" max="140" step="1" /><output></output></label>
        <div class="guest-adjust-actions"><button type="button" class="mini-btn" data-placement-flip>Switch sides</button><button type="button" class="mini-btn" data-placement-reset>Reset Pose Mate</button></div>
      </fieldset>
    </details>`;
  root.querySelectorAll('[data-placement]').forEach((input) => {
    input.addEventListener('input', () => onChange({ [input.dataset.placement]: Number(input.value) / 100 }));
  });
  root.querySelector('[data-placement-reset]').addEventListener('click', onReset);
  root.querySelector('[data-placement-flip]').addEventListener('click', onFlip);
}

export function syncGuestPlacementControls(root, composition, slotIndex, disabled, resolvedPlacement) {
  root.hidden = !composition;
  if (!composition) return;
  const placement = resolvedPlacement || resolveGuestPlacement(composition);
  root.querySelector('.guest-adjust-photo').textContent = `Photo ${slotIndex + 1}`;
  root.querySelector('fieldset').disabled = disabled;
  root.querySelector('legend').textContent = `${composition.asset.name}, photo ${slotIndex + 1}: position and size`;
  root.querySelector('.guest-adjust-hint').textContent = root.id === 'frameGuestAdjust'
    ? 'Only this photo changes. Your own photo stays as it is.'
    : 'Only this photo changes. You can adjust it again in Frames.';
  root.querySelectorAll('[data-placement]').forEach((input) => {
    const key = input.dataset.placement;
    const value = Math.round(placement[key] * 100);
    input.value = String(value);
    input.nextElementSibling.textContent = `${value}%`;
    input.setAttribute('aria-valuetext', key === 'scale' ? `${value}% of original size`
      : `${value}%, ${key === 'x' ? 'left to right' : 'top to bottom'}`);
  });
}
