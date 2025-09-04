// Minimal stub so any existing imports won't break.
// You can enhance this later to read system theme or a context.
export function useThemeColor(
  props: { light?: string; dark?: string },
  _name: string
) {
  // Prefer provided colors; otherwise default to black.
  return props.light ?? '#000';
}
