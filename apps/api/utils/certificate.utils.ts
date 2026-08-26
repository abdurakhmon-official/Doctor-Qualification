import { customAlphabet } from 'nanoid';

const CERTIFICATE_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateCode = customAlphabet(CERTIFICATE_CODE_ALPHABET, 6);

export const generateCertificateId = (): string => `DOC-${new Date().getFullYear()}-${generateCode()}`;
