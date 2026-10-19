/**
 * Legacy placeholder for the removed source-writing room save plugin.
 * Runtime saves must use application persistence, never mutate source files.
 */
export default function saveRoomPlugin() {
  return { name: 'save-room-disabled' };
}
