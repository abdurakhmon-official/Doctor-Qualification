import { Font } from '@react-pdf/renderer';

export const PDF_FONT_FAMILY = 'DejaVuSans';

/** DejaVu Sans — full Latin + Cyrillic coverage in one file (needed for ru-locale text), served via jsDelivr from the `dejavu-fonts-ttf` npm package. */
Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf/ttf/DejaVuSans.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

// react-pdf breaks long words at arbitrary points by default; keep words whole
Font.registerHyphenationCallback((word) => [word]);
