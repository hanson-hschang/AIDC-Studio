/**
 * barcode-service.js
 *
 * All business logic for Barcode generation, live title rendering, and file
 * export.  Depends on the shared application state and utility modules.
 *
 * Relies on the JsBarcode global loaded via the CDN script tag.
 */

import { applicationState }                        from '../../../javascript/application-state.js';
import { getHexColorValue, getHexColorOrNull }      from '../../../javascript/utilities/user-interface-utilities.js';
import {
  applyTitleTextStyles,
  buildTitleSvgMarkup,
  buildRasterizedCanvas,
  drawImageWithRoundedCorners,
  convertSvgToCanvas,
  exportCanvasAsFile,
  triggerBlobDownload
} from '../../../javascript/utilities/export-utilities.js';

/* ─────────────────────────────────────────
   LIVE PREVIEW — TITLE
───────────────────────────────────────── */

/**
 * Reads the current title and typography settings from the Barcode panel
 * controls and updates the live title preview element and card background.
 */
export function updateBarcodeTitle() {
  const rawText       = document.getElementById('bc-title-input').value;
  const fontSize      = parseInt(document.getElementById('bc-font-size').value);
  const fontFamily    = document.getElementById('bc-font-family').value;
  const letterSpacing = document.getElementById('bc-letter-spacing').value;
  const textColor     = getHexColorValue('bc-text-color-hex');
  const backgroundHex = getHexColorOrNull('bc-card-bg-hex');

  document.getElementById('bc-char-count').textContent = rawText.length + '/200';

  applyTitleTextStyles(
    document.getElementById('bc-title-preview'),
    rawText, fontSize, fontFamily, letterSpacing, textColor,
    applicationState.barcode.styles,
    applicationState.barcode.align
  );

  document.getElementById('bc-preview-card').style.background = backgroundHex ?? '#000000';
}

/* ─────────────────────────────────────────
   LIVE PREVIEW — BARCODE
───────────────────────────────────────── */

/**
 * Schedules a debounced call to `generateBarcode` to avoid regenerating on
 * every keystroke.
 */
export function scheduleBarcodeUpdate() {
  clearTimeout(applicationState.barcodeDebounceTimer);
  applicationState.barcodeDebounceTimer = setTimeout(generateBarcode, 280);
}

/**
 * Generates and renders the Barcode SVG into the preview area.
 * Disables the download button when no value is provided or the format
 * validation fails.
 */
export function generateBarcode() {
  const value              = document.getElementById('bc-data-input').value.trim();
  const format             = document.getElementById('bc-format').value;
  const foregroundHex      = getHexColorOrNull('bc-fg-hex');
  const backgroundHex      = getHexColorOrNull('bc-bg-hex');
  const foregroundColor    = foregroundHex ?? '#000000';
  const backgroundColor    = backgroundHex ?? 'transparent';
  const barWidth           = parseInt(document.getElementById('bc-width').value);
  const barHeight          = parseInt(document.getElementById('bc-height').value);
  const showDisplayValue   = applicationState.barcode.displayValue;
  const svgElement         = document.getElementById('bc-svg');
  const placeholderElement = document.getElementById('bc-placeholder');
  const errorMessageElement = document.getElementById('bc-err');

  if (!value) {
    svgElement.style.display         = 'none';
    placeholderElement.style.display = 'flex';
    document.getElementById('bc-dl-btn').disabled = true;
    applicationState.barcode.generated = false;
    errorMessageElement.classList.remove('show');
    return;
  }

  try {
    JsBarcode(svgElement, value, {
      format,
      lineColor:    foregroundColor,
      background:   backgroundColor,
      width:        barWidth,
      height:       barHeight,
      displayValue: showDisplayValue,
      font:         'DM Mono',
      fontSize:     14,
      margin:       10
    });
    svgElement.style.display         = 'block';
    placeholderElement.style.display = 'none';
    applicationState.barcode.generated = true;
    document.getElementById('bc-dl-btn').disabled = false;
    errorMessageElement.classList.remove('show');
    svgElement.classList.remove('bc-pop');
    void svgElement.offsetWidth;
    svgElement.classList.add('bc-pop');
    const previewCard = document.getElementById('bc-preview-card');
    previewCard.classList.remove('flash');
    void previewCard.offsetWidth;
    previewCard.classList.add('flash');
  } catch (error) {
    svgElement.style.display         = 'none';
    placeholderElement.style.display = 'flex';
    applicationState.barcode.generated = false;
    document.getElementById('bc-dl-btn').disabled = true;
    errorMessageElement.classList.add('show');
  }
}

/* ─────────────────────────────────────────
   EXPORT — DOWNLOAD
───────────────────────────────────────── */

/**
 * Reads the current Barcode and typography settings, composites the title and
 * barcode onto a canvas (or builds an SVG document), and triggers a file download.
 */
export async function downloadBarcode() {
  if (!applicationState.barcode.generated) return;

  const rawTitle        = document.getElementById('bc-title-input').value;
  const fontSize        = parseInt(document.getElementById('bc-font-size').value);
  const fontFamily      = document.getElementById('bc-font-family').value.replace(/'/g, '');
  const letterSpacing   = parseInt(document.getElementById('bc-letter-spacing').value);
  const textColor       = getHexColorValue('bc-text-color-hex');
  const cardBackground  = getHexColorOrNull('bc-card-bg-hex');
  const backgroundHex   = getHexColorOrNull('bc-bg-hex');
  const styles          = applicationState.barcode.styles;
  const barcodeSvgElement = document.getElementById('bc-svg');

  const CARD_BORDER_RADIUS    = 20;
  const BARCODE_BORDER_RADIUS = 8;

  const boundingRect = barcodeSvgElement.getBoundingClientRect();
  const svgWidth     = Math.round(boundingRect.width)  || 300;
  const svgHeight    = Math.round(boundingRect.height) || 120;

  const sidePadding            = 20;
  const barcodeTopPadding      = 16;
  const barcodeBottomPadding   = 24;
  const titleTopPadding        = 24;
  const titleBottomGap         = 12;

  const titleLines       = rawTitle.trim() ? rawTitle.split('\n') : [];
  const lineHeight       = Math.ceil(fontSize * 1.4);
  const titleBlockHeight = titleLines.length > 0
    ? titleTopPadding + titleLines.length * lineHeight + titleBottomGap
    : 0;

  const totalWidth  = sidePadding + svgWidth + sidePadding;
  const totalHeight = titleBlockHeight + barcodeTopPadding + svgHeight + barcodeBottomPadding;
  const barcodeX    = sidePadding;
  const barcodeY    = titleBlockHeight + barcodeTopPadding;

  const canvasBackground = cardBackground ?? backgroundHex ?? null;

  // Strip JsBarcode's internal background rect so the card background shows through.
  const cleanedSvgString = (() => {
    const clone = barcodeSvgElement.cloneNode(true);
    clone.setAttribute('width',  svgWidth);
    clone.setAttribute('height', svgHeight);
    Array.from(clone.children).forEach(childElement => {
      if (childElement.tagName === 'rect'
          && (childElement.getAttribute('width') === '100%'
              || parseFloat(childElement.getAttribute('width')) >= svgWidth * 0.9)) {
        childElement.remove();
      }
    });
    return new XMLSerializer().serializeToString(clone);
  })();

  if (applicationState.barcode.format === 'svg') {
    const base64DataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(cleanedSvgString)));
    const backgroundRect = canvasBackground
      ? `<rect width="${totalWidth}" height="${totalHeight}" fill="${canvasBackground}" rx="${CARD_BORDER_RADIUS}"/>`
      : '';
    const clipPathId = 'bcClip';
    const defs       = `<defs><clipPath id="${clipPathId}"><rect x="${barcodeX}" y="${barcodeY}" width="${svgWidth}" height="${svgHeight}" rx="${BARCODE_BORDER_RADIUS}"/></clipPath></defs>`;
    const titleSvg   = buildTitleSvgMarkup(
      titleLines, fontSize, fontFamily, letterSpacing, textColor, styles,
      applicationState.barcode.align, sidePadding, titleTopPadding, totalWidth, lineHeight
    );
    const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}">${defs}${backgroundRect}${titleSvg}<image clip-path="url(#${clipPathId})" href="${base64DataUri}" x="${barcodeX}" y="${barcodeY}" width="${svgWidth}" height="${svgHeight}"/></svg>`;
    triggerBlobDownload(new Blob([svgOutput], { type: 'image/svg+xml' }), 'barcode.svg');
    return;
  }

  const barcodeBitmap = await convertSvgToCanvas(barcodeSvgElement, svgWidth, svgHeight);
  const canvas        = buildRasterizedCanvas(
    totalWidth, totalHeight, canvasBackground,
    titleLines, fontSize, fontFamily, letterSpacing, textColor, styles,
    applicationState.barcode.align, sidePadding, titleTopPadding, lineHeight
  );
  drawImageWithRoundedCorners(
    canvas.getContext('2d'), barcodeBitmap,
    barcodeX, barcodeY, svgWidth, svgHeight, BARCODE_BORDER_RADIUS
  );
  exportCanvasAsFile(canvas, applicationState.barcode.format, 'barcode');
}
