export const ALL_FRAME_COLLECTION_ID = 'all';


export function filterFramesByCollection(frames = [], collectionId = ALL_FRAME_COLLECTION_ID) {
  if (collectionId === ALL_FRAME_COLLECTION_ID) return [...frames];
  return frames.filter((frame) => frame.familyProfile?.collectionId === collectionId);
}


export function buildFrameCollectionOptions(collections = [], frames = []) {
  const all = {
    id: ALL_FRAME_COLLECTION_ID,
    label: 'All editions',
    description: 'Every frame available for this format.',
    count: frames.length,
  };
  const populated = collections
    .map((collection) => ({
      ...collection,
      count: filterFramesByCollection(frames, collection.id).length,
    }))
    .filter((collection) => collection.count > 0);
  return [all, ...populated];
}


export function getFrameFamilyEditionCount(frames = [], template = null) {
  if (!template) return 0;
  return frames.filter((frame) => (
    frame.familyId === template.familyId
    && frame.mode === template.mode
  )).length;
}
