/**
 * user-interface-utilities.js
 *
 * Reusable User Interface utilities: custom dropdown, tab switching,
 * color-picker synchronization, and shared button-state helpers used by
 * both the Quick Response Code and Barcode panels.
 */

import { applicationState } from '../application-state.js';

/* ─────────────────────────────────────────
   CUSTOM DROPDOWN
───────────────────────────────────────── */

const DROPDOWN_OPTION_HEIGHT       = 38;
const VISIBLE_OPTIONS_ABOVE_SELECTED = 3;

let openDropdown            = null;
let openDropdownList        = null;
let originalDropdownParent  = null;
let suppressDropdownClose   = false;

/** Map from dropdown element ID → callback to invoke on option selection. */
const dropdownCallbackRegistry = new Map();

/**
 * Registers the callback that should be invoked when the user selects an
 * option in the specified dropdown.
 *
 * @param {string}   dropdownId - The `id` of the `.custom-dd` element.
 * @param {Function} callback   - Function called after selection with no arguments.
 */
export function registerDropdownOptionCallback(dropdownId, callback) {
  dropdownCallbackRegistry.set(dropdownId, callback);
}

/** Closes the currently open dropdown and restores the list to its original parent. */
export function closeDropdown() {
  if (!openDropdown) return;
  openDropdown.classList.remove('open');
  if (openDropdownList && originalDropdownParent) {
    originalDropdownParent.appendChild(openDropdownList);
    openDropdownList.style.cssText = '';
  }
  openDropdown           = null;
  openDropdownList       = null;
  originalDropdownParent = null;
}

/**
 * Toggles the dropdown identified by `dropdownId`.
 * The list is teleported to `<body>` so it escapes any stacking contexts.
 *
 * @param {string} dropdownId - The `id` of the `.custom-dd` element.
 */
export function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (openDropdown === dropdown) { closeDropdown(); return; }
  closeDropdown();

  const list       = dropdown.querySelector('.custom-dd-list');
  const button     = dropdown.querySelector('.custom-dd-btn');
  const buttonRect = button.getBoundingClientRect();

  originalDropdownParent = list.parentElement;
  openDropdown           = dropdown;
  openDropdownList       = list;
  dropdown.classList.add('open');

  const listWidth = buttonRect.width;
  list.style.cssText = `display:block;visibility:hidden;position:absolute;top:-9999px;left:-9999px;width:${listWidth}px;`;
  document.body.appendChild(list);

  const listHeight     = Math.min(list.scrollHeight, 280);
  list.style.maxHeight = listHeight + 'px';

  const selectedOption = list.querySelector('.custom-dd-opt.selected');
  if (selectedOption) {
    const options = Array.from(list.querySelectorAll('.custom-dd-opt'));
    list.scrollTop = Math.max(0, (options.indexOf(selectedOption) - VISIBLE_OPTIONS_ABOVE_SELECTED) * DROPDOWN_OPTION_HEIGHT);
  }

  const scrollX     = window.scrollX || window.pageXOffset;
  const scrollY     = window.scrollY || window.pageYOffset;
  const spaceBelow  = window.innerHeight - buttonRect.bottom;
  const topPosition = (spaceBelow < listHeight + 8 && buttonRect.top > listHeight + 8)
    ? scrollY + buttonRect.top - listHeight - 4
    : scrollY + buttonRect.bottom + 4;

  list.style.cssText = `display:block;position:absolute;top:${topPosition}px;left:${scrollX + buttonRect.left}px;width:${listWidth}px;max-height:${listHeight}px;z-index:99999;overflow-y:auto;`;

  suppressDropdownClose = true;
  setTimeout(() => { suppressDropdownClose = false; }, 0);
}

/**
 * Selects an option in the given dropdown, updates the button label and hidden
 * input value, marks the option as selected, closes the list, and invokes the
 * registered callback (if any).
 *
 * @param {string}      dropdownId    - The `id` of the `.custom-dd` element.
 * @param {HTMLElement} optionElement - The `.custom-dd-opt` element that was clicked.
 */
export function selectDropdownOption(dropdownId, optionElement) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  const value = optionElement.dataset.value;
  if (!value) return; // group header rows have no value — ignore them

  const label  = optionElement.dataset.label || optionElement.textContent.trim();
  const button = dropdown.querySelector('.custom-dd-btn');
  button.textContent = label;
  if (optionElement.dataset.font) button.style.fontFamily = optionElement.dataset.font;

  dropdown.querySelector('input[type="hidden"]').value = value;

  const list = openDropdownList || dropdown.querySelector('.custom-dd-list');
  list.querySelectorAll('.custom-dd-opt').forEach(option =>
    option.classList.toggle('selected', option === optionElement)
  );
  closeDropdown();

  const callback = dropdownCallbackRegistry.get(dropdownId);
  if (callback) callback();
}

/**
 * Initialises all dropdown-related global event delegation.
 * Must be called once after the DOM is ready.
 * Also stamps each dropdown list with a `data-owner-dropdown-id` attribute
 * so delegated click handlers can look up which dropdown an option belongs to.
 */
export function initializeDropdownDelegation() {
  document.querySelectorAll('.custom-dd').forEach(dropdown => {
    const list = dropdown.querySelector('.custom-dd-list');
    if (list) list.dataset.ownerDropdownId = dropdown.id;
  });

  // Delegate option clicks — works even after the list is teleported to <body>.
  document.addEventListener('click', event => {
    const optionElement = event.target.closest('.custom-dd-opt');
    if (!optionElement) return;
    let list = optionElement.closest('.custom-dd-list');
    if (!list && openDropdownList && openDropdownList.contains(optionElement)) {
      list = openDropdownList;
    }
    if (list && list.dataset.ownerDropdownId) {
      selectDropdownOption(list.dataset.ownerDropdownId, optionElement);
    }
  });

  // Close on outside interaction, scroll, or resize.
  document.addEventListener('mousedown', event => {
    if (suppressDropdownClose) return;
    if (openDropdownList
        && !openDropdownList.contains(event.target)
        && !event.target.closest('.custom-dd-btn')) {
      closeDropdown();
    }
  });
  window.addEventListener('scroll', closeDropdown);
  window.addEventListener('resize', closeDropdown);
}

/* ─────────────────────────────────────────
   TAB SWITCHING
───────────────────────────────────────── */

/**
 * Activates the tab matching `tab` ('qr' | 'barcode'), updating button and
 * panel visibility accordingly.
 *
 * @param {string} tab - The `data-tab` value of the tab to activate.
 */
export function switchActiveTab(tab) {
  applicationState.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(button =>
    button.classList.toggle('active', button.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('active', panel.id === tab + '-panel')
  );
}

/* ─────────────────────────────────────────
   COLOR PICKER SYNCHRONIZATION
───────────────────────────────────────── */

/**
 * Synchronises a colour-picker input value to its paired hex text field and
 * swatch element.
 *
 * @param {string} colorInputId - ID of the `<input type="color">`.
 * @param {string} hexInputId   - ID of the hex text input.
 * @param {string} swatchId     - ID of the swatch button element.
 */
export function synchronizeColorPicker(colorInputId, hexInputId, swatchId) {
  const value  = document.getElementById(colorInputId).value;
  document.getElementById(hexInputId).value = value;
  const swatch = document.getElementById(swatchId);
  swatch.style.background  = value;
  swatch.style.borderStyle = 'solid';
  swatch.classList.remove('transparent-swatch');
}

/**
 * Synchronises a hex text field value back to its paired colour-picker input
 * and swatch element.  Handles empty (transparent) input gracefully.
 *
 * @param {string} hexInputId   - ID of the hex text input.
 * @param {string} colorInputId - ID of the `<input type="color">`.
 * @param {string} swatchId     - ID of the swatch button element.
 */
export function synchronizeHexInput(hexInputId, colorInputId, swatchId) {
  const value  = document.getElementById(hexInputId).value.trim();
  const swatch = document.getElementById(swatchId);
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    document.getElementById(colorInputId).value = value;
    swatch.style.background  = value;
    swatch.style.borderStyle = 'solid';
    swatch.classList.remove('transparent-swatch');
  } else if (value === '') {
    swatch.style.background  = '';
    swatch.style.borderStyle = 'dashed';
    swatch.classList.add('transparent-swatch');
  }
}

/**
 * Returns the hex color value from the given input if it is a valid 6-digit
 * hex code, otherwise returns `'transparent'`.
 *
 * @param {string} hexInputId - ID of the hex text input.
 * @returns {string}
 */
export function getHexColorValue(hexInputId) {
  const value = document.getElementById(hexInputId).value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : 'transparent';
}

/**
 * Returns the hex color value from the given input if it is valid, or `null`
 * when the field is empty / contains an invalid value.
 *
 * @param {string} hexInputId - ID of the hex text input.
 * @returns {string|null}
 */
export function getHexColorOrNull(hexInputId) {
  const value = document.getElementById(hexInputId).value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

/* ─────────────────────────────────────────
   BUTTON-STATE HELPERS
───────────────────────────────────────── */

/**
 * Updates the active text-alignment button within the appropriate panel and
 * stores the new alignment in application state.
 *
 * @param {string} alignment    - 'left' | 'center' | 'right' | 'justify'.
 * @param {string} panelContext - 'qr' | 'barcode'.
 */
export function setTextAlignment(alignment, panelContext) {
  const panelState = panelContext === 'qr'
    ? applicationState.quickResponseCode
    : applicationState.barcode;
  panelState.align = alignment;
  const panelId = panelContext === 'qr' ? 'qr-panel' : 'barcode-panel';
  document.getElementById(panelId).querySelectorAll('.align-btn').forEach(button =>
    button.classList.toggle('active', button.dataset.align === alignment)
  );
}

/**
 * Toggles a typography style chip active/inactive within the appropriate panel
 * and updates application state.
 *
 * @param {string} style        - 'bold' | 'italic' | 'underline' | 'smallcaps'.
 * @param {string} panelContext - 'qr' | 'barcode'.
 */
export function toggleTextStyle(style, panelContext) {
  const panelState = panelContext === 'qr'
    ? applicationState.quickResponseCode
    : applicationState.barcode;
  const styles = panelState.styles;
  styles.has(style) ? styles.delete(style) : styles.add(style);
  const panelId = panelContext === 'qr' ? 'qr-panel' : 'barcode-panel';
  document.getElementById(panelId)
    .querySelector(`.style-chip[data-style="${style}"]`)
    .classList.toggle('active', styles.has(style));
}

/**
 * Marks the selected download format button as active within the appropriate
 * panel and stores the format in application state.
 *
 * @param {string} format       - 'png' | 'svg' | 'jpeg' | 'webp' | 'bmp' | 'pdf'.
 * @param {string} panelContext - 'qr' | 'barcode'.
 */
export function setDownloadFormat(format, panelContext) {
  const panelState = panelContext === 'qr'
    ? applicationState.quickResponseCode
    : applicationState.barcode;
  panelState.format = format;
  const panelId = panelContext === 'qr' ? 'qr-panel' : 'barcode-panel';
  document.getElementById(panelId).querySelectorAll('.fmt-btn').forEach(button =>
    button.classList.toggle('active', button.dataset.fmt === format)
  );
}

/**
 * Updates the active error-correction-level button and stores the new level
 * in application state.
 *
 * @param {string} level - 'L' | 'M' | 'Q' | 'H'.
 */
export function setErrorCorrectionLevel(level) {
  applicationState.currentErrorCorrectionLevel = level;
  document.querySelectorAll('.ec-btn[data-ec]').forEach(button =>
    button.classList.toggle('active', button.dataset.ec === level)
  );
}

/**
 * Updates the barcode display-value toggle and stores the new preference in
 * application state.
 *
 * @param {boolean} value - `true` to show the human-readable value beneath the bars.
 */
export function setBarcodeDisplayValue(value) {
  applicationState.barcode.displayValue = value;
  document.querySelectorAll('.ec-btn[data-bcdisplay]').forEach(button =>
    button.classList.toggle('active', button.dataset.bcdisplay === String(value))
  );
}
