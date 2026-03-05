# AIDC Studio

A fast, free, and open-source studio for creating, styling, and exporting design-first **Automatic Identification and Data Capture (AIDC)** assets — currently supporting **Quick Response Codes** and **Barcodes**.

---

## Features

- **Quick Response Code Generator** — enter any URL, configure error-correction level, colours, quiet-zone margin, and output size
- **Barcode Generator** — supports Code 128, EAN-13, EAN-8, UPC-A, UPC-E, Code 39, Code 93, ITF-14, MSI Plessey, and Pharmacode formats
- **Typography Controls** — per-feature title labels with font family, size, letter-spacing, weight, italic, underline, and small-caps
- **Colour Picker** — hex input and native colour picker with transparent-background support
- **Export Formats** — PNG, JPEG, WebP, BMP, SVG, and PDF downloads; all exports composite the title label and code onto a single canvas
- **No build step required** — plain HTML, CSS, and JavaScript ES modules served directly from a static host

---

## Technology Stack

| Concern | Technology |
|---|---|
| Markup | HTML5 |
| Styling | Vanilla CSS with custom properties |
| Logic | Vanilla JavaScript ES Modules (`type="module"`) |
| Quick Response Code rendering | [qrcodejs](https://github.com/davidshimjs/qrcodejs) (CDN) |
| Barcode rendering | [JsBarcode](https://github.com/lindell/JsBarcode) (CDN) |
| PDF export | [jsPDF](https://github.com/parallax/jsPDF) (CDN) |
| Fonts | Google Fonts — Playfair Display, DM Sans, DM Mono |

---

## Getting Started

Because the application uses ES Modules it **must** be served over HTTP — opening `index.html` directly as a `file://` URL will cause import errors in most browsers.

### Option A — Python (no dependencies)

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Option B — Node.js `serve` package

```bash
npx serve .
```

### Option C — Any static web server

Point your web server at the repository root.  The entry point is `index.html`.

---

## Project Structure

```
AIDC-Studio/
├── index.html                          # Application shell (markup only — no inline styles or scripts)
├── README.md
└── src/
    ├── css/
    │   ├── global-styles.css           # Entry point — @imports all focused stylesheets
    │   ├── base.css                    # CSS custom properties, reset, body, grain overlay
    │   ├── header.css                  # Application header and logo
    │   ├── tabs.css                    # Tab navigation bar and tab panels
    │   ├── layout.css                  # Workspace grid, cards, field labels, two-column grid
    │   ├── form-controls.css           # Inputs, colour pickers, dropdowns, style chips, EC buttons
    │   ├── preview.css                 # Sticky preview column, QR and Barcode preview cards
    │   ├── download.css                # Download card, format buttons, download action button
    │   ├── animations.css              # Keyframes and animation utility classes
    │   └── footer.css                  # Site footer
    ├── javascript/
    │   ├── application-state.js        # Single mutable state object (shared across all modules)
    │   ├── main.js                     # Entry point — registers all DOM event listeners
    │   └── utilities/
    │       ├── user-interface-utilities.js   # Dropdown, tab switching, colour sync, button-state helpers
    │       └── export-utilities.js           # Shared title rendering, canvas helpers, file export
    └── features/
        ├── qrcode/
        │   └── services/
        │       └── qrcode-service.js   # Quick Response Code generation, preview, and download
        └── barcode/
            └── services/
                └── barcode-service.js  # Barcode generation, preview, and download
```

### Architecture Principles

- **Feature-based layout** — code is grouped by functional domain (`qrcode`, `barcode`) rather than by file type
- **ES Modules** — every JavaScript file uses `import`/`export`; there are no global variables
- **Separation of Concerns** — HTML contains only markup; CSS files each focus on a single visual concern; JavaScript modules each own a single responsibility
- **Don't Repeat Yourself** — shared title-rendering and canvas-drawing logic lives in `export-utilities.js` and is imported by both feature services
- **No inline handlers** — all `onclick`/`oninput` attributes have been replaced with `addEventListener` calls in `main.js`
- **No abbreviations** in JavaScript identifiers — variable and function names use full words (e.g. `updateQuickResponseCodeTitle`, `synchronizeColorPicker`)

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| File names | kebab-case | `barcode-service.js` |
| Folder names | kebab-case | `form-controls.css` |
| JavaScript variables | camelCase, full words | `applicationState` |
| JavaScript functions | camelCase, full words | `downloadQuickResponseCode()` |
| CSS classes | kebab-case | `.preview-card` |

> **Note:** `qrcode` is treated as a single well-known compound word and may be used in file and folder names.

---

## Contributing

1. Fork the repository and create a feature branch
2. Follow the naming conventions above
3. Keep each pull request focused on a single concern
4. Test exports in at least Chrome and Firefox before submitting

---

## Licence

© 2025 AIDC Studio. All Rights Reserved.  
Generated codes are for personal use. Verify critical codes before deployment.
