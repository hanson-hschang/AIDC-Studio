/**
 * qrcode-service.js
 *
 * All business logic for Quick Response Code generation, live title rendering,
 * and file export.  Depends on the shared application state and utility modules.
 *
 * Relies on the QRCodeStyling global loaded via the qr-code-styling CDN script tag.
 */

import { applicationState }                        from '../../../javascript/application-state.js';
import { getHexColorValue, getHexColorOrNull }      from '../../../javascript/utilities/user-interface-utilities.js';
import {
  applyTitleTextStyles,
  buildTitleSvgMarkup,
  buildRasterizedCanvas,
  drawImageWithRoundedCorners,
  exportCanvasAsFile,
  triggerBlobDownload
} from '../../../javascript/utilities/export-utilities.js';

/* The fixed pixel size the live QR preview always renders at. All margin/
   padding settings are designed against this baseline, so downloads at a
   different export size scale those values by (exportSize / this) to keep
   the same visual proportions as what's on screen. */
const PREVIEW_QUICK_RESPONSE_CODE_SIZE = 240;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Reads the current QR style controls (body/eye shapes + logo) from the panel.
 *
 * @returns {{ bodyShape: string, eyeFrameShape: string, eyeBallShape: string,
 *             logoDataUrl: (string|null), logoSizeRatio: number }}
 */
function getQuickResponseCodeStyleOptions() {
  return {
    bodyShape:     document.getElementById('qr-body-shape').value,
    eyeFrameShape: document.getElementById('qr-eye-frame-shape').value,
    eyeBallShape:  document.getElementById('qr-eye-ball-shape').value,
    logoDataUrl:   applicationState.quickResponseCode.logoDataUrl,
    logoSizeRatio: parseFloat(document.getElementById('qr-logo-size').value)
  };
}

/* ─────────────────────────────────────────
   LIVE PREVIEW — TITLE
───────────────────────────────────────── */

/**
 * Reads the current title and typography settings from the QR panel controls
 * and updates the live title preview element and card background/margins.
 */
export function updateQuickResponseCodeTitle() {
  const rawText       = document.getElementById('title-input').value;
  const fontSize      = parseInt(document.getElementById('font-size').value);
  const fontFamily    = document.getElementById('font-family').value;
  const letterSpacing = document.getElementById('letter-spacing').value;
  const textColor     = getHexColorValue('text-color-hex');
  const backgroundHex = getHexColorOrNull('text-bg-hex');
  const textMargin    = parseInt(document.getElementById('qr-text-margin').value);
  const cardMargin    = parseInt(document.getElementById('qr-card-margin').value);

  document.getElementById('char-count').textContent = rawText.length + '/200';

  applyTitleTextStyles(
    document.getElementById('qr-title-preview'),
    rawText, fontSize, fontFamily, letterSpacing, textColor,
    applicationState.quickResponseCode.styles,
    applicationState.quickResponseCode.align,
    textMargin
  );

  const previewCard = document.getElementById('qr-preview-card');
  previewCard.style.background = backgroundHex ?? '#000000';
  // The card's width must exactly match (code size + 2 * cardMargin), otherwise
  // the flex-centered code area silently absorbs any padding change as extra
  // centering slack and the left/right gap stops tracking the Card Margin
  // setting (top/bottom are unaffected since they aren't flex-centered).
  previewCard.style.width = (PREVIEW_QUICK_RESPONSE_CODE_SIZE + cardMargin * 2) + 'px';

  const titleArea = document.getElementById('qr-title-area');
  const codeArea  = document.getElementById('qr-code-area');
  titleArea.style.padding = `${cardMargin}px ${cardMargin}px 0`;
  codeArea.style.padding  = `0 ${cardMargin}px ${cardMargin}px`;
}

/* ─────────────────────────────────────────
   LIVE PREVIEW — QR CODE
───────────────────────────────────────── */

/**
 * Schedules a debounced call to `generateQuickResponseCode` to avoid
 * regenerating the QR Code on every keystroke.
 */
export function scheduleQuickResponseCodeUpdate() {
  clearTimeout(applicationState.quickResponseCodeDebounceTimer);
  applicationState.quickResponseCodeDebounceTimer = setTimeout(generateQuickResponseCode, 280);
}

/**
 * Generates and renders the Quick Response Code into the preview canvas
 * wrapper.  Disables the download button when no URL is provided.
 */
export async function generateQuickResponseCode() {
  const url             = document.getElementById('url-input').value.trim();
  const canvasWrap      = document.getElementById('qr-canvas-wrap');
  const existingWrapper = canvasWrap.querySelector('.qr-wrapper');

  if (!url) {
    if (existingWrapper) existingWrapper.remove();
    document.getElementById('qr-placeholder').style.display = 'flex';
    document.getElementById('qr-dl-btn').disabled = true;
    applicationState.quickResponseCode.generated  = false;
    return;
  }

  const foregroundColor = getHexColorValue('qr-fg-hex');
  const backgroundColor = getHexColorValue('qr-bg-hex');
  const paddingMargin   = parseInt(document.getElementById('qr-margin').value);
  const styleOptions    = getQuickResponseCodeStyleOptions();

  if (existingWrapper) existingWrapper.remove();
  document.getElementById('qr-placeholder').style.display = 'none';

  const qrCodeWrapper = document.createElement('div');
  qrCodeWrapper.className = 'qr-wrapper';
  canvasWrap.appendChild(qrCodeWrapper);

  try {
    const canvas = await renderQuickResponseCodeBitmap(
      url, PREVIEW_QUICK_RESPONSE_CODE_SIZE, foregroundColor, backgroundColor, paddingMargin, styleOptions
    );
    qrCodeWrapper.appendChild(canvas);
    applicationState.quickResponseCode.generated = true;
    document.getElementById('qr-dl-btn').disabled = false;
    const previewCard = document.getElementById('qr-preview-card');
    previewCard.classList.remove('flash');
    void previewCard.offsetWidth;
    previewCard.classList.add('flash');
  } catch (error) {
    console.error('Quick Response Code generation error:', error);
  }
}

/* ─────────────────────────────────────────
   EXPORT — RENDER BITMAP
───────────────────────────────────────── */

/**
 * Off-screen renders the Quick Response Code at the requested export size and
 * returns the result as a canvas element.  Uses the QRCodeStyling library so
 * the padding, module/eye shapes, and an optional center logo are baked
 * directly into the same bitmap used for both live preview and download —
 * guaranteeing the two stay in sync.
 *
 * @param {string} url             - The URL to encode.
 * @param {number} totalSize       - The desired output size (width and height) in pixels.
 * @param {string} foregroundColor - Hex color for the dark modules.
 * @param {string} backgroundColor - Hex color for the light modules ('transparent' allowed).
 * @param {number} paddingMargin   - Padding (quiet zone) in pixels.
 * @param {{ bodyShape: string, eyeFrameShape: string, eyeBallShape: string,
 *           logoDataUrl: (string|null), logoSizeRatio: number }} styleOptions
 * @returns {Promise<HTMLCanvasElement>}
 */
function renderQuickResponseCodeBitmap(url, totalSize, foregroundColor, backgroundColor, paddingMargin, styleOptions) {
  const fgColor = foregroundColor === 'transparent' ? '#000000' : foregroundColor;

  const options = {
    type:   'canvas',
    data:   url,
    width:  totalSize,
    height: totalSize,
    margin: paddingMargin,
    qrOptions: {
      errorCorrectionLevel: applicationState.currentErrorCorrectionLevel
    },
    dotsOptions: {
      type:  styleOptions.bodyShape,
      color: fgColor,
      roundSize: false
    },
    cornersSquareOptions: {
      type:  styleOptions.eyeFrameShape,
      color: fgColor
    },
    cornersDotOptions: {
      type:  styleOptions.eyeBallShape,
      color: fgColor
    },
    backgroundOptions: {
      color: backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor
    }
  };

  if (styleOptions.logoDataUrl) {
    options.image = styleOptions.logoDataUrl;
    options.imageOptions = {
      hideBackgroundDots: true,
      imageSize: styleOptions.logoSizeRatio,
      margin: 4,
      crossOrigin: 'anonymous'
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const qrCodeStyling = new QRCodeStyling(options);
      const host = document.createElement('div');
      qrCodeStyling.append(host);
      qrCodeStyling.getRawData('png')
        .then(() => resolve(host.querySelector('canvas')))
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/* ─────────────────────────────────────────
   EXPORT — DOWNLOAD
───────────────────────────────────────── */

/**
 * Reads the current QR Code and typography settings, composites the title and
 * code onto a canvas (or builds an SVG document), and triggers a file download.
 */
export async function downloadQuickResponseCode() {
  if (!applicationState.quickResponseCode.generated) return;

  const url             = document.getElementById('url-input').value.trim();
  const rawTitle        = document.getElementById('title-input').value;
  const qrCodeSize      = parseInt(document.getElementById('qr-size').value);
  const foregroundHex   = getHexColorOrNull('qr-fg-hex');
  const backgroundHex   = getHexColorOrNull('qr-bg-hex');
  const foregroundColor = foregroundHex ?? '#000000';
  const backgroundColor = backgroundHex ?? '#ffffff';
  const paddingMargin   = parseInt(document.getElementById('qr-margin').value);
  const fontSize        = parseInt(document.getElementById('font-size').value);
  const fontFamily      = document.getElementById('font-family').value.replace(/'/g, '');
  const letterSpacing   = parseInt(document.getElementById('letter-spacing').value);
  const textColor       = getHexColorValue('text-color-hex');
  const cardBackground  = getHexColorOrNull('text-bg-hex');
  const styles          = applicationState.quickResponseCode.styles;
  const cardMargin      = parseInt(document.getElementById('qr-card-margin').value);
  const textMargin      = parseInt(document.getElementById('qr-text-margin').value);
  const styleOptions    = getQuickResponseCodeStyleOptions();

  // The preview always renders the QR at PREVIEW_QUICK_RESPONSE_CODE_SIZE. All
  // padding/margin settings are dialed in against that baseline, so when the
  // export size differs we scale them by the same ratio — otherwise a bigger
  // download would end up with proportionally tiny padding/margins compared
  // to what's on screen (and a smaller download with proportionally huge ones).
  const scaleFactor         = qrCodeSize / PREVIEW_QUICK_RESPONSE_CODE_SIZE;
  const scaledPaddingMargin = Math.round(paddingMargin * scaleFactor);
  const scaledCardMargin    = Math.round(cardMargin * scaleFactor);
  const scaledTextMargin    = Math.round(textMargin * scaleFactor);

  const CARD_BORDER_RADIUS                = Math.round(20 * scaleFactor);
  const QUICK_RESPONSE_CODE_BORDER_RADIUS = Math.round(8 * scaleFactor);

  // "Card margin" governs the outer padding of the whole card (top/sides/bottom).
  // "Text margin" governs the gap between the title text and the code below it.
  // Both are applied identically here and in the live preview (see
  // updateQuickResponseCodeTitle / preview.css) so the download always matches
  // what's on screen, just scaled to the chosen export size.
  const sidePadding                    = scaledCardMargin;
  const quickResponseCodeBottomPadding = scaledCardMargin;
  const titleTopPadding                = scaledCardMargin;
  const titleBottomGap                 = scaledTextMargin;

  const titleLines       = rawTitle.trim() ? rawTitle.split('\n') : [];
  const scaledFontSize    = Math.round(fontSize * scaleFactor);
  const lineHeight       = Math.ceil(scaledFontSize * 1.4);
  const titleBlockHeight = titleLines.length > 0
    ? titleTopPadding + titleLines.length * lineHeight + titleBottomGap
    : titleTopPadding;

  const totalWidth  = sidePadding + qrCodeSize + sidePadding;
  const totalHeight = titleBlockHeight + qrCodeSize + quickResponseCodeBottomPadding;
  const quickResponseCodeX = sidePadding;
  const quickResponseCodeY = titleBlockHeight;

  const qrCodeBitmap     = await renderQuickResponseCodeBitmap(
    url, qrCodeSize, foregroundColor, backgroundColor, scaledPaddingMargin, styleOptions
  );
  const canvasBackground = cardBackground ?? backgroundHex ?? null;

  if (applicationState.quickResponseCode.format === 'svg') {
    const pngBase64DataUrl = qrCodeBitmap.toDataURL('image/png');
    const backgroundRect   = canvasBackground
      ? `<rect width="${totalWidth}" height="${totalHeight}" fill="${canvasBackground}" rx="${CARD_BORDER_RADIUS}"/>`
      : '';
    const clipPathId = 'qrClip';
    const titleSvg    = buildTitleSvgMarkup(
      titleLines, scaledFontSize, fontFamily, letterSpacing, textColor, styles,
      applicationState.quickResponseCode.align, sidePadding, titleTopPadding, totalWidth, lineHeight
    );
    const defs      = `<defs><clipPath id="${clipPathId}"><rect x="${quickResponseCodeX}" y="${quickResponseCodeY}" width="${qrCodeSize}" height="${qrCodeSize}" rx="${QUICK_RESPONSE_CODE_BORDER_RADIUS}"/></clipPath></defs>`;
    const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}">${defs}${backgroundRect}${titleSvg}<image clip-path="url(#${clipPathId})" href="${pngBase64DataUrl}" x="${quickResponseCodeX}" y="${quickResponseCodeY}" width="${qrCodeSize}" height="${qrCodeSize}"/></svg>`;
    triggerBlobDownload(new Blob([svgOutput], { type: 'image/svg+xml' }), 'qr-code.svg');
    return;
  }

  const canvas = buildRasterizedCanvas(
    totalWidth, totalHeight, canvasBackground,
    titleLines, scaledFontSize, fontFamily, letterSpacing, textColor, styles,
    applicationState.quickResponseCode.align, sidePadding, titleTopPadding, lineHeight
  );
  drawImageWithRoundedCorners(
    canvas.getContext('2d'), qrCodeBitmap,
    quickResponseCodeX, quickResponseCodeY,
    qrCodeSize, qrCodeSize, QUICK_RESPONSE_CODE_BORDER_RADIUS
  );
  exportCanvasAsFile(canvas, applicationState.quickResponseCode.format, 'qr-code');
}
