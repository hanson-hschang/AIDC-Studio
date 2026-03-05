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

## Project Structure & Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full annotated file tree, module dependency graph, CSS import chain, and rendering flow diagrams.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide, naming conventions, and pull request checklist.

---

## Licence

© 2025 AIDC Studio. All Rights Reserved.  
Generated codes are for personal use. Verify critical codes before deployment.
