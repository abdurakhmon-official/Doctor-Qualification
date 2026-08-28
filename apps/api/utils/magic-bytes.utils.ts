type Signature = { bytes: number[]; offset?: number };

const SIGNATURES: Record<string, Signature[]> = {
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46] },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, 
  ],
  'image/avif': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], 
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }], 
  'application/msword': [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }], 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, 
  ],
};

const matchesAt = (buffer: Buffer, signature: Signature): boolean => {
  const offset = signature.offset ?? 0;
  return signature.bytes.every((byte, index) => buffer[offset + index] === byte);
};

export const matchesMimeType = (buffer: Buffer, mimeType: string): boolean => {
  const signatures = SIGNATURES[mimeType];
  if (!signatures) return true;

  return signatures.some((signature) => matchesAt(buffer, signature));
};
