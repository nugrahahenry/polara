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

const LAYOUTS = Object.freeze({
  matched: Object.freeze({
    right: Object.freeze({
      userRegion: Object.freeze({ x: 0, y: 0, width: 0.68, height: 1 }),
      guestRegion: Object.freeze({ x: 0.54, y: 0, width: 0.46, height: 1 }),
      flipGuest: false,
    }),
    left: Object.freeze({
      userRegion: Object.freeze({ x: 0.32, y: 0, width: 0.68, height: 1 }),
      guestRegion: Object.freeze({ x: 0, y: 0, width: 0.46, height: 1 }),
      flipGuest: true,
    }),
  }),
  'side-by-side': Object.freeze({
    right: Object.freeze({
      userRegion: Object.freeze({ x: 0, y: 0, width: 0.62, height: 1 }),
      guestRegion: Object.freeze({ x: 0.58, y: 0, width: 0.42, height: 1 }),
      flipGuest: false,
    }),
    left: Object.freeze({
      userRegion: Object.freeze({ x: 0.38, y: 0, width: 0.62, height: 1 }),
      guestRegion: Object.freeze({ x: 0, y: 0, width: 0.42, height: 1 }),
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

export function poseGuideForSlot(index, mode) {
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
  const asset = poseForSlot(slotIndex, mode, guestId || DEFAULT_GUEST_ID);
  if (!asset) return null;
  const normalizedLayout = LAYOUTS[layout] ? layout : 'matched';
  const normalizedSide = side === 'left' ? 'left' : 'right';
  const geometry = LAYOUTS[normalizedLayout][normalizedSide];
  return {
    asset,
    layout: normalizedLayout,
    side: normalizedSide,
    userRegion: { ...geometry.userRegion },
    guestRegion: { ...geometry.guestRegion },
    flipGuest: geometry.flipGuest,
  };
}
