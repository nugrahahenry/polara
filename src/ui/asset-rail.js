const DEFAULT_THEME = Object.freeze({
  accent: '#ff8fbd',
  secondary: '#8fd3ff',
  wash: '#ff8fbd18',
});


function isHexColor(value) {
  return /^#[a-f0-9]{6}$/i.test(value || '');
}


export function getFamilyProofTheme(profile) {
  const [accent, secondary] = profile?.palette || [];
  if (!isHexColor(accent) || !isHexColor(secondary)) return { ...DEFAULT_THEME };
  return {
    accent,
    secondary,
    wash: `${accent}18`,
  };
}


export function getRailWindow({
  scrollLeft = 0,
  scrollWidth = 0,
  clientWidth = 0,
  items = [],
  tolerance = 2,
} = {}) {
  const total = items.length;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  if (!total) {
    return { first: -1, last: -1, total: 0, atStart: true, atEnd: true };
  }

  const viewportStart = Math.max(0, scrollLeft);
  const viewportEnd = viewportStart + Math.max(0, clientWidth);
  const visible = items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => (
      item.end > viewportStart + tolerance
      && item.start < viewportEnd - tolerance
    ));
  const first = visible[0]?.index ?? 0;
  const last = visible.at(-1)?.index ?? first;

  return {
    first,
    last,
    total,
    atStart: viewportStart <= tolerance,
    atEnd: maxScroll - viewportStart <= tolerance,
  };
}
