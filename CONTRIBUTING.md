# Contributing to AIDC-Studio

First off, thank you for taking the time to contribute! 🎉 
Whether you're squashing a bug, polishing the UI, or just fixing a typo in the docs, your help makes **AIDC-Studio** better for everyone.

Please take a moment to review these guidelines to ensure a smooth collaboration process.

---

## 📦 Development Environment Setup

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository

If you are contributing via a fork (recommended):

```bash
git clone https://github.com/hanson-hschang/AIDC-Studio.git
cd AIDC-Studio

```

### 2. Start a Local Server

Because the application uses ES Modules it **must** be served over HTTP — opening `index.html` directly as a `file://` URL will cause import errors in most browsers.

**Option A — Built-in Python development server (recommended)**

```bash
python server.py
```

**Option B — Python standard library (no extra files)**

```bash
python3 -m http.server 3000
```

**Option C — Node.js `serve` package**

```bash
npx serve .
```

**Option D — Any static web server**

Point your web server at the repository root. The entry point is `index.html`.

### 3. View the Website

Open your browser and navigate to the URL printed by your chosen server option — for example:

> **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Running Tests & Verification

Before submitting your changes, ensure everything is working as expected:

1. **Manual Verification:** Navigate through the modified pages to ensure the UI renders correctly.
2. **Console Check:** Open Browser Developer Tools (`F12`) and check for any Javascript errors or failed resource loads.
3. **Cross-Browser Check:** If you’ve made significant UI changes, try to view them in at least two different browsers (e.g., Chrome and Firefox).

---

## 🔀 Pull Request Workflow

We follow a standard "Feature Branch" workflow.

### 1. Create a Branch

Avoid working directly on `main`. Create a descriptive branch for your task:

* `feature/improve-homepage`
* `fix/broken-nav-link`
* `docs/update-readme`

```bash
git checkout -b feature/your-feature-name

```

### 2. Commit with Clarity

Keep your commits small and focused. We prefer [Conventional Commits](https://www.conventionalcommits.org/):

* `feat:` for new features.
* `fix:` for bug fixes.
* `docs:` for documentation changes.

### 3. Push and Open a PR

```bash
git push origin feature/your-feature-name

```

When opening the Pull Request on GitHub, please include:

* **What changed?** A concise summary.
* **Why?** Reference an issue number (e.g., `Fixes #23`).
* **Visuals:** Screenshots or GIFs are highly encouraged for UI changes!

---

## 📝 Code Style Guidelines

To keep the codebase clean and maintainable, please keep these "golden rules" in mind:

* **Be Descriptive:** Use clear variable and function names (e.g., `isMenuOpen` instead of `mo`).
* **Stay Modular:** Keep functions small and focused on a single task.
* **Comment Wisely:** Explain the *why* behind complex logic, not just the *what*.
* **Format:** Maintain consistent indentation (2 or 4 spaces as per the existing file style).

### Naming Conventions

All names must use **full words** — abbreviations and acronyms are forbidden unless the term is universally well-known to all engineers (e.g. `qrcode`).

| Context | Convention | Correct example | Incorrect example |
|---|---|---|---|
| File names | kebab-case | `barcode-service.js` | `bc-svc.js` |
| Folder names | kebab-case | `form-controls/` | `frm-ctrl/` |
| JavaScript variables | camelCase, full words | `applicationState` | `appSt` |
| JavaScript functions | camelCase, full words | `downloadQuickResponseCode()` | `dlQR()` |
| CSS classes | kebab-case | `.preview-card` | `.pvw-crd` |

> **Note:** `qrcode` is treated as a single well-known compound word and is used as-is in file and folder names.

### 💡 Pro-Tip: The "Hard Refresh"

Browsers love to cache files, which can hide your brilliant changes. 
If things look old, use a hard refresh:

| OS | Shortcut |
| --- | --- |
| **Windows / Linux** | `Ctrl` + `Shift` + `R` |
| **macOS (Chrome/Firefox)** | `Cmd` + `Shift` + `R` |
| **macOS (Safari)** | `Option` + `Cmd` + `E` (then `Cmd` + `R`) |

---

## 🐛 Reporting Issues

Notice something broken? We want to hear about it! Before opening a new issue:

1. **Search:** Check if the issue has already been reported.
2. **Details:** Use the issue template to provide:
* A clear description of the problem.
* Steps to reproduce the bug.
* Your OS and Browser version.
* Screenshots (if applicable).

---

## ✅ Pull Request Checklist

Before you hit that "Submit" button, double-check the following:

* [ ] The code runs locally without errors.
* [ ] You have tested your changes in the browser.
* [ ] Documentation has been updated (if necessary).
* [ ] Commit messages follow the project style.
* [ ] Your branch is up-to-date with the latest `main`.
* [ ] New files and identifiers follow the [Naming Conventions](#naming-conventions) above.
* [ ] You have read the [Architecture Overview](ARCHITECTURE.md) to understand how the codebase is structured.

---

### Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and constructive environment. 
Happy coding!
