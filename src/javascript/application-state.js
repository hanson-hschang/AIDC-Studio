/**
 * application-state.js
 *
 * Single source of truth for all mutable application state and shared constants.
 * Imported by service and utility modules that need to read or update state.
 */

export const applicationState = {
  quickResponseCode: {
    format: 'png',
    align: 'center',
    styles: new Set(),
    generated: false
  },
  barcode: {
    format: 'png',
    align: 'center',
    styles: new Set(),
    generated: false,
    displayValue: true
  },
  currentErrorCorrectionLevel: 'L',
  currentTab: 'qr',
  quickResponseCodeDebounceTimer: null,
  barcodeDebounceTimer: null
};
