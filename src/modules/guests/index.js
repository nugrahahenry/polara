export const REGULAR_EXPERIENCE = 'regular';
export const POSE_MATE_EXPERIENCE = 'pose-mate';
export const DEFAULT_GUEST_ID = 'polara-pm-01';

const PM01_POSES = Object.freeze({
  neutral: Object.freeze({
    id: 'polara-pm-01-neutral',
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-neutral.png',
    alt: 'Juno, a fictional Polara guest, in a relaxed neutral pose.',
    pose: 'neutral',
    kind: 'fictional-synthetic',
  }),
  peace: Object.freeze({
    id: 'polara-pm-01-peace',
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-peace.png',
    alt: 'Juno, a fictional Polara guest, making a peace sign.',
    pose: 'peace',
    kind: 'fictional-synthetic',
  }),
  'half-heart': Object.freeze({
    id: DEFAULT_GUEST_ID,
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-half-heart.png',
    alt: 'Juno, a fictional Polara guest, making half of a heart pose.',
    pose: 'half-heart',
    kind: 'fictional-synthetic',
  }),
  seated: Object.freeze({
    id: 'polara-pm-01-seated',
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-seated.png',
    alt: 'Juno, a fictional Polara guest, seated beside you.',
    pose: 'seated',
    kind: 'fictional-synthetic',
  }),
  'seated-wave': Object.freeze({
    id: 'polara-pm-01-seated-wave',
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-seated-wave.png',
    alt: 'Juno, a fictional Polara guest, seated and waving beside you.',
    pose: 'seated-wave',
    kind: 'fictional-synthetic',
  }),
  'seated-heart': Object.freeze({
    id: 'polara-pm-01-seated-heart',
    guestId: DEFAULT_GUEST_ID,
    name: 'Juno',
    src: 'assets/guests/polara-pm-01-seated-heart.png',
    alt: 'Juno, a fictional Polara guest, seated and making a half-heart beside you.',
    pose: 'seated-heart',
    kind: 'fictional-synthetic',
  }),
});

const PM02_POSES = Object.freeze({
  neutral: Object.freeze({
    id: 'polara-pm-02-neutral', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-neutral.png',
    alt: 'Mina, a fictional Polara guest, in a relaxed neutral pose.',
    pose: 'neutral', kind: 'fictional-synthetic',
  }),
  peace: Object.freeze({
    id: 'polara-pm-02-peace', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-peace.png',
    alt: 'Mina, a fictional Polara guest, making a peace sign.',
    pose: 'peace', kind: 'fictional-synthetic',
  }),
  'half-heart': Object.freeze({
    id: 'polara-pm-02', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-half-heart.png',
    alt: 'Mina, a fictional Polara guest, making half of a heart pose.',
    pose: 'half-heart', kind: 'fictional-synthetic',
  }),
  seated: Object.freeze({
    id: 'polara-pm-02-seated', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-seated.png',
    alt: 'Mina, a fictional Polara guest, seated beside you.',
    pose: 'seated', kind: 'fictional-synthetic',
  }),
  'seated-wave': Object.freeze({
    id: 'polara-pm-02-seated-wave', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-seated-wave.png',
    alt: 'Mina, a fictional Polara guest, seated and waving beside you.',
    pose: 'seated-wave', kind: 'fictional-synthetic',
  }),
  'seated-heart': Object.freeze({
    id: 'polara-pm-02-seated-heart', guestId: 'polara-pm-02', name: 'Mina',
    src: 'assets/guests/polara-pm-02-seated-heart.png',
    alt: 'Mina, a fictional Polara guest, seated and making a half-heart beside you.',
    pose: 'seated-heart', kind: 'fictional-synthetic',
  }),
});

const GUESTS = Object.freeze({
  [DEFAULT_GUEST_ID]: Object.freeze({
    ...PM01_POSES['half-heart'],
    id: DEFAULT_GUEST_ID,
    poses: PM01_POSES,
  }),
  'polara-pm-02': Object.freeze({
    ...PM02_POSES['half-heart'],
    id: 'polara-pm-02',
    poses: PM02_POSES,
  }),
});

// Duduk bersama keeps the real camera as the full photo window, then layers a
// dedicated seated guest into that same window. The guest is cropped just below
// the waist and kept deliberately smaller so the pair reads like two people
// sharing a laptop camera, not a full-body cutout taking over the photo.
// Crop the seated companion to a centered bust while keeping the source and
// render region close in aspect ratio. This avoids the stretched, narrow look
// that appears when a wide crop is forced into a tall side panel.
const SEATED_BUST_CROP = Object.freeze({ x: 0.18, y: 0.02, width: 0.64, height: 0.88 });

const LAYOUTS = Object.freeze({
  matched: Object.freeze({
    right: Object.freeze({
      // Match pose keeps the real camera image as one full photo. The guest is
      // composited inside that same photo window instead of occupying a
      // separate panel beside it.
      userRegion: Object.freeze({ x: 0, y: 0, width: 1, height: 1 }),
      guestRegion: Object.freeze({ x: 0.54, y: 0, width: 0.46, height: 1 }),
      flipGuest: false,
    }),
    left: Object.freeze({
      userRegion: Object.freeze({ x: 0, y: 0, width: 1, height: 1 }),
      guestRegion: Object.freeze({ x: 0, y: 0, width: 0.46, height: 1 }),
      flipGuest: true,
    }),
  }),
  'side-by-side': Object.freeze({
    right: Object.freeze({
      // The camera photo remains full width. The seated guest is layered inside
      // the same clipped window, like a friend sitting beside the user.
      userRegion: Object.freeze({ x: 0, y: 0, width: 1, height: 1 }),
      guestRegion: Object.freeze({ x: 0.54, y: 0.25, width: 0.44, height: 0.6 }),
      guestCrop: SEATED_BUST_CROP,
      flipGuest: false,
    }),
    left: Object.freeze({
      userRegion: Object.freeze({ x: 0, y: 0, width: 1, height: 1 }),
      guestRegion: Object.freeze({ x: 0.02, y: 0.25, width: 0.44, height: 0.6 }),
      guestCrop: SEATED_BUST_CROP,
      flipGuest: true,
    }),
  }),
});

export function getGuest(id = DEFAULT_GUEST_ID) {
  return GUESTS[id] || null;
}

export function getGuestOptions() {
  return Object.values(GUESTS).map(({ id, name, src, alt, kind }) => ({ id, name, src, alt, kind }));
}

export function getGuestAssets(id = DEFAULT_GUEST_ID) {
  const guest = getGuest(id);
  if (!guest) return [];
  return ['neutral', 'peace', 'half-heart'].map((pose) => guest.poses[pose]);
}

export function getSeatedGuestAsset(id = DEFAULT_GUEST_ID) {
  return getGuest(id)?.poses.seated || null;
}

export function getGuestRuntimeAssets(id = DEFAULT_GUEST_ID) {
  const guest = getGuest(id);
  return guest ? Object.values(guest.poses) : [];
}

export function getSitTogetherGuestAsset(id = DEFAULT_GUEST_ID, slotIndex = 0, mode = 3) {
  const guest = getGuest(id);
  if (!guest) return null;
  const seatedPose = Number(mode) === 1
    ? 'seated'
    : ['seated', 'seated-wave', 'seated-heart'][Math.max(0, Math.min(2, Number(slotIndex) || 0))];
  return guest.poses[seatedPose] || guest.poses.seated || null;
}

export function poseForSlot(index, mode, guestId = DEFAULT_GUEST_ID) {
  const guest = getGuest(guestId);
  if (!guest) return null;
  const pose = Number(mode) === 1
    ? 'half-heart'
    : ['neutral', 'peace', 'half-heart'][Math.max(0, Math.min(2, Number(index) || 0))];
  return guest.poses[pose] || null;
}

export function createLatestSelectionGate() {
  let latest = 0;
  return {
    begin() {
      latest += 1;
      return latest;
    },
    isCurrent(requestId) {
      return requestId === latest;
    },
    cancel() {
      latest += 1;
    },
  };
}

export async function retryWithoutGuestOnFailure({
  guestComposition,
  create,
  isGuestError,
  onGuestFailure,
}) {
  try {
    return await create(guestComposition);
  } catch (error) {
    if (!guestComposition || !isGuestError(error)) throw error;
    await onGuestFailure(error);
    return create(null);
  }
}

export function poseGuideForSlot(index, mode, layout = 'matched') {
  if (layout === 'side-by-side') {
    if (Number(mode) === 1) return 'Relaxed';
    return ['Relaxed', 'Wave', 'Half-heart'][Math.max(0, Math.min(2, Number(index) || 0))];
  }
  if (Number(mode) === 1) return 'Half-heart';
  return ['Natural', 'Peace', 'Half-heart'][Math.max(0, Math.min(2, Number(index) || 0))];
}

export function createGuestComposition({
  experience = REGULAR_EXPERIENCE,
  guestId = null,
  layout = 'matched',
  side = 'right',
  mode = 3,
  slotIndex = 0,
} = {}) {
  if (experience !== POSE_MATE_EXPERIENCE) return null;
  const normalizedLayout = LAYOUTS[layout] ? layout : 'matched';
  const normalizedSide = side === 'left' ? 'left' : 'right';
  const resolvedGuestId = guestId || DEFAULT_GUEST_ID;
  const asset = normalizedLayout === 'side-by-side'
    ? getSitTogetherGuestAsset(resolvedGuestId, slotIndex, mode)
    : poseForSlot(slotIndex, mode, resolvedGuestId);
  if (!asset) return null;
  const geometry = LAYOUTS[normalizedLayout][normalizedSide];
  return {
    asset,
    layout: normalizedLayout,
    side: normalizedSide,
    userRegion: { ...geometry.userRegion },
    guestRegion: { ...geometry.guestRegion },
    ...(geometry.guestCrop ? { guestCrop: { ...geometry.guestCrop } } : {}),
    flipGuest: geometry.flipGuest,
  };
}
