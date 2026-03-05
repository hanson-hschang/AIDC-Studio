/**
 * quick-response-code-service.js
 *
 * All business logic for Quick Response Code generation, live title rendering,
 * and file export.  Depends on the shared application state and utility modules.
 *
 * Relies on the QRCode global loaded via the qrcodejs CDN script tag.
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

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Returns a map from error-correction level letter to the QRCode library
 * constant.  Called lazily so the QRCode global is guaranteed to be present.
 *
 * @returns {{ L: number, M: number, Q: number, H: number }}
 */
function getErrorCorrectionLevelMap() {
  return {
    L: QRCode.CorrectLevel.L,
    M: QRCode.CorrectLevel.M,
    Q: QRCode.CorrectLevel.Q,
    H: QRCode.CorrectLevel.H
  };
}

/* ─────────────────────────────────────────
   LIVE PREVIEW — TITLE
───────────────────────────────────────── */

/**
 * Reads the current title and typography settings from the QR panel controls
 * and updates the live title preview element and card background.
 */
export function updateQuickResponseCodeTitle() {
  const rawText       = document.getElementById('title-input').value;
  const fontSize      = parseInt(document.getElementById('font-size').value);
  const fontFamily    = document.getElementById('font-family').value;
  const letterSpacing = document.getElementById('letter-spacing').value;
  const textColor     = getHexColorValue('text-color-hex');
  const backgroundHex = getHexColorOrNull('text-bg-hex');

  document.getElementById('char-count').textContent = rawText.length + '/200';

  applyTitleTextStyles(
    document.getElementById('qr-title-preview'),
    rawText, fontSize, fontFamily, letterSpacing, textColor,
    applicationState.quickResponseCode.styles,
    applicationState.quickResponseCode.align
  );

  document.getElementById('qr-preview-card').style.background = backgroundHex ?? '#000000';
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
export function generateQuickResponseCode() {
  const url            = document.getElementById('url-input').value.trim();
  const canvasWrap     = document.getElementById('qr-canvas-wrap');
  const existingWrapper = canvasWrap.querySelector('.qr-wrapper');

  if (!url) {
    if (existingWrapper) existingWrapper.remove();
    document.getElementById('qr-placeholder').style.display = 'flex';
    document.getElementById('qr-dl-btn').disabled = true;
    applicationState.quickResponseCode.generated  = false;
    return;
  }

  const foregroundColor  = getHexColorValue('qr-fg-hex');
  const backgroundColor  = getHexColorValue('qr-bg-hex');
  const quietZoneMargin  = parseInt(document.getElementById('qr-margin').value);

  if (existingWrapper) existingWrapper.remove();
  document.getElementById('qr-placeholder').style.display = 'none';

  const qrCodeWrapper = document.createElement('div');
  qrCodeWrapper.className        = 'qr-wrapper';
  qrCodeWrapper.style.padding    = quietZoneMargin + 'px';
  qrCodeWrapper.style.background = backgroundColor;
  canvasWrap.appendChild(qrCodeWrapper);

  const fgColor = foregroundColor === 'transparent' ? '#000000' : foregroundColor;
  const bgColor = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;

  try {
    new QRCode(qrCodeWrapper, {
      text:         url,
      width:        240,
      height:       240,
      colorDark:    fgColor,
      colorLight:   bgColor,
      correctLevel: getErrorCorrectionLevelMap()[applicationState.currentErrorCorrectionLevel]
    });
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
 * returns the result as a canvas element.
 *
 * @param {string} url             - The URL to encode.
 * @param {number} totalSize       - The desired output size (width and height) in pixels.
 * @param {string} foregroundColor - Hex color for the dark modules.
 * @param {string} backgroundColor - Hex color for the light modules.
 * @param {number} quietZoneMargin - Quiet-zone padding in pixels.
 * @returns {Promise<HTMLCanvasElement>}
 */
function renderQuickResponseCodeBitmap(url, totalSize, foregroundColor, backgroundColor, quietZoneMargin) {
  const innerSize      = totalSize - quietZoneMargin * 2;
  const fgColor        = foregroundColor === 'transparent' ? '#000000' : foregroundColor;
  const bgColor        = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;
  const backgroundFill = backgroundColor === 'transparent' ? null : backgroundColor;

  return new Promise(resolve => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:-99999px;visibility:hidden;';
    document.body.appendChild(host);

    new QRCode(host, {
      text:         url,
      width:        innerSize,
      height:       innerSize,
      colorDark:    fgColor,
      colorLight:   bgColor,
      correctLevel: getErrorCorrectionLevelMap()[applicationState.currentErrorCorrectionLevel]
    });

    let attempts = 0;
    const pollInterval = setInterval(() => {
      const canvasElement = host.querySelector('canvas');
      const imgElement    = host.querySelector('img');
      if (++attempts > 40 || canvasElement || imgElement) {
        clearInterval(pollInterval);
        const outputCanvas    = document.createElement('canvas');
        outputCanvas.width    = totalSize;
        outputCanvas.height   = totalSize;
        const ctx             = outputCanvas.getContext('2d');
        if (backgroundFill) {
          ctx.fillStyle = backgroundFill;
          ctx.fillRect(0, 0, totalSize, totalSize);
        }
        const drawQuickResponseCode = source => {
          ctx.drawImage(source, quietZoneMargin, quietZoneMargin, innerSize, innerSize);
          document.body.removeChild(host);
          resolve(outputCanvas);
        };
        if (canvasElement) {
          drawQuickResponseCode(canvasElement);
        } else if (imgElement) {
          imgElement.complete
            ? drawQuickResponseCode(imgElement)
            : (imgElement.onload = () => drawQuickResponseCode(imgElement));
        } else {
          document.body.removeChild(host);
          resolve(outputCanvas);
        }
      }
    }, 50);
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

  const url               = document.getElementById('url-input').value.trim();
  const rawTitle          = document.getElementById('title-input').value;
  const qrCodeSize        = parseInt(document.getElementById('qr-size').value);
  const foregroundHex     = getHexColorOrNull('qr-fg-hex');
  const backgroundHex     = getHexColorOrNull('qr-bg-hex');
  const foregroundColor   = foregroundHex ?? '#000000';
  const backgroundColor   = backgroundHex ?? '#ffffff';
  const quietZoneMargin   = parseInt(document.getElementById('qr-margin').value);
  const fontSize          = parseInt(document.getElementById('font-size').value);
  const fontFamily        = document.getElementById('font-family').value.replace(/'/g, '');
  const letterSpacing     = parseInt(document.getElementById('letter-spacing').value);
  const textColor         = getHexColorValue('text-color-hex');
  const cardBackground    = getHexColorOrNull('text-bg-hex');
  const styles            = applicationState.quickResponseCode.styles;

  const CARD_BORDER_RADIUS                = 20;
  const QUICK_RESPONSE_CODE_BORDER_RADIUS = 8;

  const sidePadding                  = 20;
  const quickResponseCodeTopPadding  = 16;
  const quickResponseCodeBottomPadding = 24;
  const titleTopPadding              = 24;
  const titleBottomGap               = 12;

  const titleLines       = rawTitle.trim() ? rawTitle.split('\n') : [];
  const lineHeight       = Math.ceil(fontSize * 1.4);
  const titleBlockHeight = titleLines.length > 0
    ? titleTopPadding + titleLines.length * lineHeight + titleBottomGap
    : 0;

  const totalWidth  = sidePadding + qrCodeSize + sidePadding;
  const totalHeight = titleBlockHeight + quickResponseCodeTopPadding + qrCodeSize + quickResponseCodeBottomPadding;
  const quickResponseCodeX = sidePadding;
  const quickResponseCodeY = titleBlockHeight + quickResponseCodeTopPadding;

  const qrCodeBitmap   = await renderQuickResponseCodeBitmap(url, qrCodeSize, foregroundColor, backgroundColor, quietZoneMargin);
  const canvasBackground = cardBackground ?? backgroundHex ?? null;

  if (applicationState.quickResponseCode.format === 'svg') {
    const pngBase64DataUrl = qrCodeBitmap.toDataURL('image/png');
    const backgroundRect   = canvasBackground
      ? `<rect width="${totalWidth}" height="${totalHeight}" fill="${canvasBackground}" rx="${CARD_BORDER_RADIUS}"/>`
      : '';
    const clipPathId = 'qrClip';
    const titleSvg   = buildTitleSvgMarkup(
      titleLines, fontSize, fontFamily, letterSpacing, textColor, styles,
      applicationState.quickResponseCode.align, sidePadding, titleTopPadding, totalWidth, lineHeight
    );
    const defs      = `<defs><clipPath id="${clipPathId}"><rect x="${quickResponseCodeX}" y="${quickResponseCodeY}" width="${qrCodeSize}" height="${qrCodeSize}" rx="${QUICK_RESPONSE_CODE_BORDER_RADIUS}"/></clipPath></defs>`;
    const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}">${defs}${backgroundRect}${titleSvg}<image clip-path="url(#${clipPathId})" href="${pngBase64DataUrl}" x="${quickResponseCodeX}" y="${quickResponseCodeY}" width="${qrCodeSize}" height="${qrCodeSize}"/></svg>`;
    triggerBlobDownload(new Blob([svgOutput], { type: 'image/svg+xml' }), 'qr-code.svg');
    return;
  }

  const canvas = buildRasterizedCanvas(
    totalWidth, totalHeight, canvasBackground,
    titleLines, fontSize, fontFamily, letterSpacing, textColor, styles,
    applicationState.quickResponseCode.align, sidePadding, titleTopPadding, lineHeight
  );
  drawImageWithRoundedCorners(
    canvas.getContext('2d'), qrCodeBitmap,
    quickResponseCodeX, quickResponseCodeY,
    qrCodeSize, qrCodeSize, QUICK_RESPONSE_CODE_BORDER_RADIUS
  );
  exportCanvasAsFile(canvas, applicationState.quickResponseCode.format, 'qr-code');
}
