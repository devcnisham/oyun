// Realtime channel for one turf's slot map on one day. Shared by the server (broadcast) and the browser (subscribe).
export const slotTopic = (turfId: string, date: string) => `slots:${turfId}:${date}`;
export const SLOTS_CHANGED = 'changed';
