export function getStickerBenchView(stickers = [], selectedId = null) {
  const activeIndex = stickers.findIndex((item) => item.uid === selectedId);
  const activeSticker = activeIndex >= 0 ? stickers[activeIndex] : null;
  const count = stickers.length;

  if (!activeSticker) {
    return {
      count,
      state: count ? 'placed' : 'empty',
      status: count
        ? `Sticker bench · ${count} sticker${count === 1 ? '' : 's'} placed`
        : 'Sticker bench · No stickers yet',
      active: null,
    };
  }

  const siblings = stickers.filter((item) => item.assetId === activeSticker.assetId);
  const ordinal = siblings.findIndex((item) => item.uid === activeSticker.uid) + 1;

  return {
    count,
    state: 'editing',
    status: `Sticker bench · Editing ${activeSticker.name}`,
    active: {
      uid: activeSticker.uid,
      name: activeSticker.name,
      src: activeSticker.src,
      instanceLabel: siblings.length > 1
        ? `${activeSticker.name} · ${ordinal} of ${siblings.length}`
        : activeSticker.name,
    },
  };
}
