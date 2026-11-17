# AviPdf - Local converter | 100% Offline Client-Side PDF & Image Studio

> A fast, private, 100% client-side web application inspired by **iLovePDF's** comprehensive tool directory and **Smallpdf's** vibrant dropzone workflow. All processing happens entirely within your device's browser memory — **zero cloud uploads, zero tracking, zero server dependencies**.

---

## 🚀 Features

1. **JPG / PNG / WEBP to PDF**
   - Drag-and-drop visual page reordering powered by SortableJS (touch & mouse supported).
   - Per-page 90° rotation and deletion.
   - Page sizing: **A4 Portrait**, **A4 Landscape**, or **Original Image Size**.
   - Margin adjustments: None (edge-to-edge), Small (10 mm), Normal (20 mm).
   - Image fit options: **Contain** (no cropping) or **Cover** (fill full page area).
   - Adjustable compression quality slider (50%–100%) with instant byte estimates.
   - 1-click built-in Demo generator.

2. **PDF to Images (JPG / PNG / WEBP)**
   - Extract All pages, a continuous **Page Range** (e.g. `2 to 5`), or **Specific Page Numbers** (e.g. `1, 3, 5-7`).
   - Interactive page toggle pills to click and select pages visually.
   - High-fidelity resolution options: 108 DPI, 150 DPI, 220 DPI.
   - Individual page downloads or 1-click **ZIP bundle** export via JSZip.
   - Automatic password decryption prompt if opening an encrypted document.
   - 1-click 6-page demo PDF generator for rapid testing.

3. **Unlock PDF (Authorized Decryption)**
   - Remove known passwords from official PDFs, bank statements, or salary slips.
   - Verifies password client-side using PDF.js decryption engine.
   - Previews decrypted pages and exports a permanent, unencrypted clean PDF copy.

4. **Merge PDF (Lossless Engine)**
   - Combine multiple PDF files into one single document.
   - Powered by `pdf-lib` for **lossless vector merging** (preserves text selection, crisp font vectors, and hyperlinks without raster degradation).
   - Move Up / Move Down buttons, alphabetical A–Z sorting, and multi-file drag-and-drop.
   - 1-click 3-document demo loader.

5. **Split & Extract PDF**
   - Three distinct splitting modes:
     1. **Custom Ranges**: Define multiple From–To ranges; export merged into one PDF or download separate PDFs in a ZIP archive.
     2. **Fixed Intervals**: Split every N pages (e.g., every 2 pages) into separate documents bundled in a ZIP archive.
     3. **Extract Specific Pages**: Select pages individually or via expressions (`1, 3, 5-7`); save as a single merged PDF or individual 1-page files.
   - Live interactive page thumbnails showing which pages will be exported in real time.
   - 1-click 8-page color handbook demo for instant verification.

6. **Themes & UI**
   - Crisp Light Theme and Vibrant Obsidian & Orange Dark Theme with localStorage persistence.
   - Responsive design crafted for desktop, tablets, and smartphones.
   - PWA (Progressive Web App) manifest and offline Service Worker.

---

## 📁 Codebase Architecture

```text
PdfTool/
├── index.html                   # Main semantic HTML structure & all tool views
├── manifest.json                # PWA manifest for mobile installation (Add to Home Screen)
├── sw.js                        # Offline Service Worker (caches app shell & CDN libraries)
├── css/
│   └── styles.css               # Themes, dropzone gradients, paper shadows, mobile touch rules
├── js/
│   ├── app.js                   # Application router, theme engine, toasts, ZIP exporter
│   ├── img2pdf.js               # Module 1: Image to PDF conversion engine (Sortable + jsPDF)
│   ├── pdf2img.js               # Module 2: PDF to image extraction engine (PDF.js + JSZip)
│   ├── unlockpdf.js             # Module 3: Password verification & unlocked PDF builder
│   ├── mergepdf.js              # Module 4: Lossless PDF merger (pdf-lib)
│   └── splitpdf.js              # Module 5: Range splitter & page extractor (pdf-lib + PDF.js)
├── icons/
│   └── icon.svg                 # Vector app icon for desktop & mobile PWA
├── offline_image_pdf_toolkit.html # Single-file portable edition (standalone fallback)
└── README.md                    # Project documentation & deployment guide
```

---

## 🔒 100% Client-Side Privacy Guarantee

- **Zero Server Backend**: The application runs completely in the user's browser.
- **No File Uploads**: Files never leave the client's device. Processing happens inside browser memory (`Uint8Array`, `ArrayBuffer`, `Canvas`, and WebAssembly/Blob workers).
- **Safe for Sensitive Documents**: Safe for medical records, bank statements, tax returns, and confidential legal contracts.

---

## 💻 How to Run Locally

### Option A: Double-Click (No Install)
Simply double-click `index.html` (or `offline_image_pdf_toolkit.html`) in your file explorer to open it in Chrome, Edge, Safari, Firefox, or Brave.

### Option B: Local Web Server (Recommended for PWA & Mobile Testing)
To enable Service Worker caching and test mobile access across your home or office Wi-Fi:

```bash
# Using Node.js (npx serve)
npx serve .

# OR using Python 3
python -m http.server 3000
```
Then open `http://localhost:3000` in your desktop browser.

---

## 📱 How to Connect, Deploy & Use on Mobile

You can run and use this application on mobile in three ways:

### 1. Test on Mobile Immediately via Local Wi-Fi (No Deployment Needed)

1. Make sure your computer and mobile phone are connected to the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - **Windows**: Open PowerShell and run `ipconfig` (look for *IPv4 Address*, e.g., `192.168.1.15`).
   - **macOS / Linux**: Open Terminal and run `ifconfig` or `ip a` (look for `inet 192.168.x.x`).
3. Start a local server on your computer:
   ```bash
   python -m http.server 3000
   ```
4. On your mobile phone (iOS Safari or Android Chrome), type the URL in the address bar:
   ```text
   http://192.168.1.15:3000
   ```
   *(replace `192.168.1.15` with your computer's actual IP address)*.
5. The full application will load on your phone!

---

### 2. Free 1-Click Cloud Deployment (Always Available Online)

Since the app has **zero backend code**, you can host it for free on any static web host in less than 2 minutes:

#### A. GitHub Pages (Easiest)
1. Create a new repository on [GitHub](https://github.com).
2. Push this folder to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AviPdf"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository, go to **Settings** &rarr; **Pages**.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Within 60 seconds, GitHub will give you a live HTTPS link:
   ```text
   https://<your-username>.github.io/<your-repo-name>/
   ```

#### B. Vercel
1. Install Vercel CLI: `npm i -g vercel` (or log in to [vercel.com](https://vercel.com)).
2. Run `vercel` in this directory and press Enter for all default prompts.
3. You will receive an instant production URL with automatic HTTPS (e.g., `https://avipdf.vercel.app`).

#### C. Netlify
1. Log in to [netlify.com](https://app.netlify.com).
2. Simply drag and drop the `PdfTool` folder onto the Netlify dashboard.
3. Your site goes live instantly with HTTPS and free custom domain support.

---

### 3. Install on Mobile as a Standalone App (PWA)

Once deployed to HTTPS (or running locally), the app functions as a **Progressive Web App**:

- **On iOS (iPhone / iPad - Safari)**:
  1. Open your deployed URL in Safari.
  2. Tap the **Share** button (box with an arrow pointing up at the bottom).
  3. Scroll down and tap **"Add to Home Screen"**.
  4. Tap **Add**. The AviPdf icon will appear on your iPhone home screen.
  5. Tap the icon to launch the app full-screen without Safari browser bars. It will continue working even in Airplane mode!

- **On Android (Chrome / Brave / Edge)**:
  1. Open your deployed URL in Chrome.
  2. A banner saying **"Add AviPdf to Home screen"** or **"Install App"** will appear (or tap the 3 dots in the top-right and select **"Install App"** / **"Add to Home screen"**).
  3. The app installs into your Android App Drawer and Home screen like any native Google Play Store app.

---

### 4. Optional: Packaging into a Native Android APK (Google Play Store)

If you want to compile this codebase into a real native Android `.apk` or `.aab`:

1. In this directory, initialize Capacitor:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "AviPdf" "com.avipdf.app" --web-dir "."
   ```
2. Add the Android platform:
   ```bash
   npx cap add android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```
4. In Android Studio, click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)** to generate your signed APK.

---

## 🛠️ Browser Compatibility

| Browser | Platform | Offline Engine Supported |
| :--- | :--- | :--- |
| Google Chrome | Windows, macOS, Linux, Android | ✅ 100% |
| Apple Safari | macOS, iOS, iPadOS | ✅ 100% |
| Microsoft Edge | Windows, macOS, Android | ✅ 100% |
| Mozilla Firefox | Windows, macOS, Linux, Android | ✅ 100% |
| Brave Browser | All platforms | ✅ 100% |

---

## 📄 License
MIT License. Free for personal, commercial, and educational use.

