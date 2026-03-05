/**
 * export-utilities.js
 *
 * Shared canvas rendering and file export utilities used by both the
 * Quick Response Code and Barcode features.  Consolidating these here
 * satisfies the Don't Repeat Yourself principle for all title-rendering
 * and canvas-drawing logic.
 */

/* ─────────────────────────────────────────
   TITLE — DOM RENDERING (live preview)
───────────────────────────────────────── */

/**
 * Renders lowercase letters as visually-smaller uppercase characters inside
 * the given element, producing a small-caps typographic effect.
 *
 * @param {HTMLElement} element   - The container element to render into.
 * @param {string}      rawText   - The raw multi-line text string.
 * @param {number}      fontSize  - The base font size in pixels.
 */
export function renderSmallCapsText(element, rawText, fontSize) {
  element.innerHTML = '';
  rawText.split('\n').forEach((line, lineIndex) => {
    for (const character of line) {
      if (character >= 'a' && character <= 'z') {
        const span = document.createElement('span');
        span.textContent = character.toUpperCase();
        span.style.fontSize = Math.round(fontSize * 0.75) + 'px';
        element.appendChild(span);
      } else {
        element.appendChild(document.createTextNode(character));
      }
    }
    if (lineIndex < rawText.split('\n').length - 1) {
      element.appendChild(document.createElement('br'));
    }
  });
}

/**
 * Applies all active typography styles to a title preview element.
 *
 * @param {HTMLElement} element       - The preview element to style.
 * @param {string}      rawText       - The raw text content.
 * @param {number}      fontSize      - Font size in pixels.
 * @param {string}      fontFamily    - CSS font-family string.
 * @param {string|number} letterSpacing - Letter spacing in pixels.
 * @param {string}      textColor     - CSS color value.
 * @param {Set<string>} styles        - Active style names ('bold', 'italic', 'underline', 'smallcaps').
 * @param {string}      align         - CSS text-align value.
 */
export function applyTitleTextStyles(element, rawText, fontSize, fontFamily, letterSpacing, textColor, styles, align) {
  const isSmallCaps = styles.has('smallcaps');
  if (isSmallCaps) {
    renderSmallCapsText(element, rawText, fontSize);
  } else {
    element.textContent = rawText;
  }
  element.style.fontFamily     = fontFamily;
  element.style.fontSize       = fontSize + 'px';
  element.style.fontWeight     = styles.has('bold')      ? '700' : '400';
  element.style.fontStyle      = styles.has('italic')    ? 'italic' : 'normal';
  element.style.textDecoration = styles.has('underline') ? 'underline' : 'none';
  element.style.letterSpacing  = letterSpacing + 'px';
  element.style.color          = textColor;
  element.style.textAlign      = align;
  element.style.marginBottom   = rawText.trim() ? '12px' : '0';
  element.style.lineHeight     = '1.4';
}

/* ─────────────────────────────────────────
   TITLE — SVG EXPORT RENDERING
───────────────────────────────────────── */

/**
 * Builds SVG `<text>` markup for each title line, respecting small-caps,
 * bold, italic, underline, letter-spacing, and text-alignment.
 *
 * @param {string[]}  titleLines       - Array of text lines.
 * @param {number}    fontSize         - Base font size in pixels.
 * @param {string}    fontFamily       - Font family name (no surrounding quotes).
 * @param {number}    letterSpacing    - Letter spacing in pixels.
 * @param {string}    textColor        - CSS fill color.
 * @param {Set<string>} styles         - Active style names.
 * @param {string}    textAlign        - 'left' | 'center' | 'right'.
 * @param {number}    sidePadding      - Horizontal padding in pixels.
 * @param {number}    titleTopPadding  - Top padding before the first line.
 * @param {number}    totalWidth       - Full canvas width in pixels.
 * @param {number}    lineHeight       - Height of each line in pixels.
 * @returns {string} SVG markup string.
 */
export function buildTitleSvgMarkup(titleLines, fontSize, fontFamily, letterSpacing, textColor, styles, textAlign, sidePadding, titleTopPadding, totalWidth, lineHeight) {
  if (!titleLines.length) return '';

  const anchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
  const textXPosition = textAlign === 'center' ? totalWidth / 2
    : textAlign === 'right' ? totalWidth - sidePadding
    : sidePadding;

  const isBold      = styles.has('bold');
  const isItalic    = styles.has('italic');
  const isUnderline = styles.has('underline');
  const isSmallCaps = styles.has('smallcaps');

  let output = '';
  titleLines.forEach((line, lineIndex) => {
    const yPosition = titleTopPadding + fontSize + lineIndex * lineHeight;
    let content = '';
    if (isSmallCaps) {
      for (const character of line) {
        const isLowercase   = character >= 'a' && character <= 'z';
        const charFontSize  = isLowercase ? Math.round(fontSize * 0.75) : fontSize;
        const displayChar   = isLowercase ? character.toUpperCase() : character.replace(/&/g, '&amp;');
        content += `<tspan font-size="${charFontSize}">${displayChar}</tspan>`;
      }
    } else {
      content = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    output += `<text x="${textXPosition}" y="${yPosition}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${isBold ? '700' : '400'}" font-style="${isItalic ? 'italic' : 'normal'}" text-decoration="${isUnderline ? 'underline' : 'none'}" letter-spacing="${letterSpacing}" fill="${textColor}" text-anchor="${anchor}">${content}</text>`;
  });
  return output;
}

/* ─────────────────────────────────────────
   CANVAS HELPERS
───────────────────────────────────────── */

/**
 * Draws a rounded-rectangle path on the given canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx    - The 2D canvas context.
 * @param {number} x      - Left edge.
 * @param {number} y      - Top edge.
 * @param {number} width  - Rectangle width.
 * @param {number} height - Rectangle height.
 * @param {number} radius - Corner radius.
 */
export function drawCanvasRoundedRectangle(ctx, x, y, width, height, radius) {
  radius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y,          x + width, y + radius,          radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height,  x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x,           y + height, x,          y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x,           y,          x + radius, y,                   radius);
  ctx.closePath();
}

/**
 * Draws a source image or canvas clipped to a rounded rectangle.
 *
 * @param {CanvasRenderingContext2D} ctx    - The 2D canvas context.
 * @param {HTMLCanvasElement|HTMLImageElement} source - The image to draw.
 * @param {number} x      - Destination left edge.
 * @param {number} y      - Destination top edge.
 * @param {number} width  - Destination width.
 * @param {number} height - Destination height.
 * @param {number} radius - Corner radius.
 */
export function drawImageWithRoundedCorners(ctx, source, x, y, width, height, radius) {
  ctx.save();
  drawCanvasRoundedRectangle(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(source, x, y, width, height);
  ctx.restore();
}

/**
 * Creates and returns a canvas pre-filled with the card background and
 * the title text rendered in the given typography settings.
 *
 * @param {number}    totalWidth       - Canvas width in pixels.
 * @param {number}    totalHeight      - Canvas height in pixels.
 * @param {string|null} backgroundColor - CSS color string, or null for transparent.
 * @param {string[]}  titleLines       - Array of text lines.
 * @param {number}    fontSize         - Base font size in pixels.
 * @param {string}    fontFamily       - Font family name.
 * @param {number}    letterSpacing    - Letter spacing in pixels.
 * @param {string}    textColor        - CSS fill color.
 * @param {Set<string>} styles         - Active style names.
 * @param {string}    textAlign        - 'left' | 'center' | 'right'.
 * @param {number}    sidePadding      - Horizontal padding in pixels.
 * @param {number}    titleTopPadding  - Top padding before the first line.
 * @param {number}    lineHeight       - Line height in pixels.
 * @returns {HTMLCanvasElement}
 */
export function buildRasterizedCanvas(totalWidth, totalHeight, backgroundColor, titleLines, fontSize, fontFamily, letterSpacing, textColor, styles, textAlign, sidePadding, titleTopPadding, lineHeight) {
  const CARD_BORDER_RADIUS = 20;
  const canvas = document.createElement('canvas');
  canvas.width  = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    drawCanvasRoundedRectangle(ctx, 0, 0, totalWidth, totalHeight, CARD_BORDER_RADIUS);
    ctx.fill();
  }

  if (!titleLines.length) return canvas;

  const isBold      = styles.has('bold');
  const isItalic    = styles.has('italic');
  const isUnderline = styles.has('underline');
  const isSmallCaps = styles.has('smallcaps');
  const fontWeight  = isBold   ? '700'    : '400';
  const fontStyle   = isItalic ? 'italic' : 'normal';

  ctx.fillStyle   = textColor;
  ctx.textBaseline = 'top';

  titleLines.forEach((line, lineIndex) => {
    const yPosition = titleTopPadding + lineIndex * lineHeight;
    if (isSmallCaps) {
      let totalLineWidth = 0;
      for (const character of line) {
        const isLowercase  = character >= 'a' && character <= 'z';
        const charFontSize = isLowercase ? Math.round(fontSize * 0.75) : fontSize;
        ctx.font = `${fontStyle} ${fontWeight} ${charFontSize}px ${fontFamily}`;
        totalLineWidth += ctx.measureText(isLowercase ? character.toUpperCase() : character).width + letterSpacing;
      }
      let currentDrawX = textAlign === 'center' ? (totalWidth - totalLineWidth) / 2
        : textAlign === 'right' ? totalWidth - sidePadding - totalLineWidth
        : sidePadding;
      for (const character of line) {
        const isLowercase  = character >= 'a' && character <= 'z';
        const charFontSize = isLowercase ? Math.round(fontSize * 0.75) : fontSize;
        ctx.font = `${fontStyle} ${fontWeight} ${charFontSize}px ${fontFamily}`;
        const displayChar = isLowercase ? character.toUpperCase() : character;
        ctx.fillText(displayChar, currentDrawX, yPosition + (fontSize - charFontSize));
        currentDrawX += ctx.measureText(displayChar).width + letterSpacing;
      }
    } else {
      ctx.font      = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'right' : 'left';
      const textXPosition = textAlign === 'center' ? totalWidth / 2
        : textAlign === 'right' ? totalWidth - sidePadding
        : sidePadding;
      ctx.fillText(line, textXPosition, yPosition);
      if (isUnderline) {
        const measuredWidth  = ctx.measureText(line).width;
        let underlineStartX  = textXPosition;
        if (textAlign === 'center')  underlineStartX -= measuredWidth / 2;
        else if (textAlign === 'right') underlineStartX -= measuredWidth;
        ctx.fillRect(underlineStartX, yPosition + fontSize + 2, measuredWidth, 1.5);
      }
    }
  });
  return canvas;
}

/* ─────────────────────────────────────────
   SVG → CANVAS CONVERSION
───────────────────────────────────────── */

/**
 * Rasterizes an SVG element into an off-screen canvas of the given dimensions.
 * Strips any full-width background rectangle that JsBarcode inserts to avoid
 * overwriting the card background color.
 *
 * @param {SVGElement} svgElement - The source SVG element.
 * @param {number}     width      - Output canvas width in pixels.
 * @param {number}     height     - Output canvas height in pixels.
 * @returns {Promise<HTMLCanvasElement>}
 */
export function convertSvgToCanvas(svgElement, width, height) {
  return new Promise((resolve, reject) => {
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('width',  width);
    clone.setAttribute('height', height);
    const backgroundRect = clone.querySelector('rect[width="100%"]');
    if (backgroundRect) backgroundRect.remove();
    const xmlString = new XMLSerializer().serializeToString(clone);
    const dataUri   = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xmlString);
    const image     = new Image(width, height);
    image.onload  = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error('SVG render failed'));
    image.src = dataUri;
  });
}

/* ─────────────────────────────────────────
   FILE EXPORT
───────────────────────────────────────── */

/**
 * Exports the canvas as a downloadable file in the requested format.
 * Supports PNG, JPEG, WebP, BMP, and PDF.
 *
 * @param {HTMLCanvasElement} canvas   - The source canvas.
 * @param {string}            format   - 'png' | 'jpeg' | 'webp' | 'bmp' | 'pdf'.
 * @param {string}            basename - File name without extension.
 */
export function exportCanvasAsFile(canvas, format, basename) {
  if (format === 'pdf') {
    try {
      const jsPdfConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      if (!jsPdfConstructor) { alert('PDF library not loaded. Try refreshing.'); return; }
      const millimeterWidth  = canvas.width  * 0.2646;
      const millimeterHeight = canvas.height * 0.2646;
      const pdfDocument = new jsPdfConstructor({
        orientation: millimeterWidth >= millimeterHeight ? 'l' : 'p',
        unit:   'mm',
        format: [millimeterWidth, millimeterHeight]
      });
      pdfDocument.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, millimeterWidth, millimeterHeight);
      pdfDocument.save(`${basename}.pdf`);
    } catch (error) {
      alert('PDF export failed: ' + error.message);
    }
    return;
  }
  const mimeTypeMap  = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' };
  const extensionMap = { png: 'png', jpeg: 'jpg', webp: 'webp', bmp: 'bmp' };
  const mimeType     = mimeTypeMap[format]  || 'image/png';
  const extension    = extensionMap[format] || 'png';
  const quality      = format === 'jpeg' ? 0.92 : undefined;
  const dataUrl      = canvas.toDataURL(mimeType, quality);
  const anchorElement = document.createElement('a');
  anchorElement.href     = dataUrl;
  anchorElement.download = `${basename}.${extension}`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
}

/**
 * Creates a temporary object URL from a Blob and triggers a file download.
 * The URL is revoked after a short delay to free memory.
 *
 * @param {Blob}   blob     - The file content as a Blob.
 * @param {string} filename - The download filename including extension.
 */
export function triggerBlobDownload(blob, filename) {
  const objectUrl    = URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');
  anchorElement.href     = objectUrl;
  anchorElement.download = filename;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 20000);
}
