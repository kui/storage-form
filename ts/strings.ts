const encoder = new TextEncoder();
export function byteLength(s: string): number {
  // TODO Count with buffer and encodeInto for smaller memory usage.
  return encoder.encode(s).length;
}
