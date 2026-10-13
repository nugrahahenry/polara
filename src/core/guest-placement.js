// Session-only placement. Coordinates describe travel within the photo window.
const bounded = (value, fallback, min, max) => value == null || !Number.isFinite(Number(value))
  ? fallback : Math.max(min, Math.min(max, Number(value)));

export function resolveGuestPlacement(composition, region = composition.guestRegion) {
  const placement = composition.placement || {};
  return {
    x: bounded(placement.x, region.width < 1 ? region.x / (1 - region.width) : 0.5, 0, 1),
    y: bounded(placement.y, region.height < 1 ? region.y / (1 - region.height) : 1, 0, 1),
    scale: bounded(placement.scale, 1, 0.6, 1.4),
  };
}

export function patchGuestPlacements(placements, slotIndex, layout, placement) {
  return placements.map((slot, index) => {
    if (index !== slotIndex) return slot;
    const next = { ...slot };
    if (placement == null) delete next[layout];
    else next[layout] = { ...placement };
    return next;
  });
}
