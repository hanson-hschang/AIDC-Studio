/**
 * main.js
 *
 * Application entry point.  Imports all feature services and utility modules,
 * registers every DOM event listener, and performs the initial render.
 *
 * Because this file is loaded as a JavaScript module (`type="module"`), it is
 * deferred automatically — the DOM is fully parsed before any line here runs,
 * so no `DOMContentLoaded` wrapper is required.
 */

import {
  initializeDropdownDelegation,
  registerDropdownOptionCallback,
  toggleDropdown,
  switchActiveTab,
  synchronizeColorPicker,
  synchronizeHexInput,
  setTextAlignment,
  toggleTextStyle,
  setDownloadFormat,
  setErrorCorrectionLevel,
  setBarcodeDisplayValue
} from './utilities/user-interface-utilities.js';

import {
  updateQuickResponseCodeTitle,
  scheduleQuickResponseCodeUpdate,
  downloadQuickResponseCode
} from '../features/qrcode/services/qrcode-service.js';

import {
  updateBarcodeTitle,
  scheduleBarcodeUpdate,
  downloadBarcode
} from '../features/barcode/services/barcode-service.js';

/* ─────────────────────────────────────────
   DROPDOWN INITIALISATION
───────────────────────────────────────── */

initializeDropdownDelegation();

// Map each dropdown to the callback that should run after an option is chosen.
registerDropdownOptionCallback('qr-font-dropdown',      updateQuickResponseCodeTitle);
registerDropdownOptionCallback('qr-font-size-dd',       updateQuickResponseCodeTitle);
registerDropdownOptionCallback('qr-letter-spacing-dd',  updateQuickResponseCodeTitle);
registerDropdownOptionCallback('qr-size-dd',            scheduleQuickResponseCodeUpdate);
registerDropdownOptionCallback('qr-margin-dd',          scheduleQuickResponseCodeUpdate);

registerDropdownOptionCallback('bc-font-dropdown',      updateBarcodeTitle);
registerDropdownOptionCallback('bc-font-size-dd',       updateBarcodeTitle);
registerDropdownOptionCallback('bc-letter-spacing-dd',  updateBarcodeTitle);
registerDropdownOptionCallback('bc-format-dd',          scheduleBarcodeUpdate);
registerDropdownOptionCallback('bc-width-dd',           scheduleBarcodeUpdate);
registerDropdownOptionCallback('bc-height-dd',          scheduleBarcodeUpdate);

/* ─────────────────────────────────────────
   TAB NAVIGATION
───────────────────────────────────────── */

document.querySelectorAll('.tab-btn[data-tab]').forEach(tabButton => {
  tabButton.addEventListener('click', () => switchActiveTab(tabButton.dataset.tab));
});

/* ─────────────────────────────────────────
   DROPDOWN TOGGLE BUTTONS
   (one listener per .custom-dd-btn; the option-click delegation is handled
   inside user-interface-utilities.js)
───────────────────────────────────────── */

document.querySelectorAll('.custom-dd-btn').forEach(dropdownButton => {
  dropdownButton.addEventListener('click', () => {
    const dropdown = dropdownButton.closest('.custom-dd');
    if (dropdown) toggleDropdown(dropdown.id);
  });
});

/* ─────────────────────────────────────────
   QR CODE PANEL — INPUTS
───────────────────────────────────────── */

document.getElementById('url-input').addEventListener('input', scheduleQuickResponseCodeUpdate);
document.getElementById('title-input').addEventListener('input', updateQuickResponseCodeTitle);

// Typography color — text color
document.getElementById('text-color').addEventListener('input', () => {
  synchronizeColorPicker('text-color', 'text-color-hex', 'text-color-swatch');
  updateQuickResponseCodeTitle();
});
document.getElementById('text-color-hex').addEventListener('input', () => {
  synchronizeHexInput('text-color-hex', 'text-color', 'text-color-swatch');
  updateQuickResponseCodeTitle();
});

// Typography color — card background
document.getElementById('text-bg').addEventListener('input', () => {
  synchronizeColorPicker('text-bg', 'text-bg-hex', 'text-bg-swatch');
  updateQuickResponseCodeTitle();
});
document.getElementById('text-bg-hex').addEventListener('input', () => {
  synchronizeHexInput('text-bg-hex', 'text-bg', 'text-bg-swatch');
  updateQuickResponseCodeTitle();
});

// QR Code colors — foreground
document.getElementById('qr-fg').addEventListener('input', () => {
  synchronizeColorPicker('qr-fg', 'qr-fg-hex', 'qr-fg-swatch');
  scheduleQuickResponseCodeUpdate();
});
document.getElementById('qr-fg-hex').addEventListener('input', () => {
  synchronizeHexInput('qr-fg-hex', 'qr-fg', 'qr-fg-swatch');
  scheduleQuickResponseCodeUpdate();
});

// QR Code colors — background
document.getElementById('qr-bg').addEventListener('input', () => {
  synchronizeColorPicker('qr-bg', 'qr-bg-hex', 'qr-bg-swatch');
  scheduleQuickResponseCodeUpdate();
});
document.getElementById('qr-bg-hex').addEventListener('input', () => {
  synchronizeHexInput('qr-bg-hex', 'qr-bg', 'qr-bg-swatch');
  scheduleQuickResponseCodeUpdate();
});

/* ─────────────────────────────────────────
   QR CODE PANEL — BUTTON DELEGATION
───────────────────────────────────────── */

document.getElementById('qr-panel').addEventListener('click', event => {
  // Error-correction level buttons
  const errorCorrectionButton = event.target.closest('.ec-btn[data-ec]');
  if (errorCorrectionButton) {
    setErrorCorrectionLevel(errorCorrectionButton.dataset.ec);
    scheduleQuickResponseCodeUpdate();
    return;
  }
  // Text-alignment buttons
  const alignmentButton = event.target.closest('.align-btn[data-align]');
  if (alignmentButton) {
    setTextAlignment(alignmentButton.dataset.align, 'qr');
    updateQuickResponseCodeTitle();
    return;
  }
  // Typography style chips
  const styleChipElement = event.target.closest('.style-chip[data-style]');
  if (styleChipElement) {
    toggleTextStyle(styleChipElement.dataset.style, 'qr');
    updateQuickResponseCodeTitle();
    return;
  }
  // Download format buttons
  const formatButton = event.target.closest('.fmt-btn[data-fmt]');
  if (formatButton) {
    setDownloadFormat(formatButton.dataset.fmt, 'qr');
  }
});

document.getElementById('qr-dl-btn').addEventListener('click', downloadQuickResponseCode);

/* ─────────────────────────────────────────
   BARCODE PANEL — INPUTS
───────────────────────────────────────── */

document.getElementById('bc-data-input').addEventListener('input', scheduleBarcodeUpdate);
document.getElementById('bc-title-input').addEventListener('input', updateBarcodeTitle);

// Typography color — text color
document.getElementById('bc-text-color').addEventListener('input', () => {
  synchronizeColorPicker('bc-text-color', 'bc-text-color-hex', 'bc-text-color-swatch');
  updateBarcodeTitle();
});
document.getElementById('bc-text-color-hex').addEventListener('input', () => {
  synchronizeHexInput('bc-text-color-hex', 'bc-text-color', 'bc-text-color-swatch');
  updateBarcodeTitle();
});

// Typography color — card background
document.getElementById('bc-card-bg').addEventListener('input', () => {
  synchronizeColorPicker('bc-card-bg', 'bc-card-bg-hex', 'bc-card-bg-swatch');
  updateBarcodeTitle();
});
document.getElementById('bc-card-bg-hex').addEventListener('input', () => {
  synchronizeHexInput('bc-card-bg-hex', 'bc-card-bg', 'bc-card-bg-swatch');
  updateBarcodeTitle();
});

// Barcode colors — foreground (bar color)
document.getElementById('bc-fg').addEventListener('input', () => {
  synchronizeColorPicker('bc-fg', 'bc-fg-hex', 'bc-fg-swatch');
  scheduleBarcodeUpdate();
});
document.getElementById('bc-fg-hex').addEventListener('input', () => {
  synchronizeHexInput('bc-fg-hex', 'bc-fg', 'bc-fg-swatch');
  scheduleBarcodeUpdate();
});

// Barcode colors — background
document.getElementById('bc-bg').addEventListener('input', () => {
  synchronizeColorPicker('bc-bg', 'bc-bg-hex', 'bc-bg-swatch');
  scheduleBarcodeUpdate();
});
document.getElementById('bc-bg-hex').addEventListener('input', () => {
  synchronizeHexInput('bc-bg-hex', 'bc-bg', 'bc-bg-swatch');
  scheduleBarcodeUpdate();
});

/* ─────────────────────────────────────────
   BARCODE PANEL — BUTTON DELEGATION
───────────────────────────────────────── */

document.getElementById('barcode-panel').addEventListener('click', event => {
  // Show / Hide display-value toggle
  const displayValueButton = event.target.closest('.ec-btn[data-bcdisplay]');
  if (displayValueButton) {
    setBarcodeDisplayValue(displayValueButton.dataset.bcdisplay === 'true');
    scheduleBarcodeUpdate();
    return;
  }
  // Text-alignment buttons
  const alignmentButton = event.target.closest('.align-btn[data-align]');
  if (alignmentButton) {
    setTextAlignment(alignmentButton.dataset.align, 'barcode');
    updateBarcodeTitle();
    return;
  }
  // Typography style chips
  const styleChipElement = event.target.closest('.style-chip[data-style]');
  if (styleChipElement) {
    toggleTextStyle(styleChipElement.dataset.style, 'barcode');
    updateBarcodeTitle();
    return;
  }
  // Download format buttons
  const formatButton = event.target.closest('.fmt-btn[data-fmt]');
  if (formatButton) {
    setDownloadFormat(formatButton.dataset.fmt, 'barcode');
  }
});

document.getElementById('bc-dl-btn').addEventListener('click', downloadBarcode);

/* ─────────────────────────────────────────
   INITIAL RENDER
───────────────────────────────────────── */

updateQuickResponseCodeTitle();
updateBarcodeTitle();
