export function fakeTokenHash(raw: string): string {
  const n = Math.max(raw.length, 1);
  let out = "";

  for (let i = 0; i < 64; i++) {
    const code = (raw.charCodeAt(i % n) || 0) + i;
    out += (code % 16).toString(16);
  }

  return out;
}
