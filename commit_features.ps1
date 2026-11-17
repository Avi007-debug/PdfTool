# =====================================================================
# AviPdf - Feature-Wise Git Commit Script
# Initializes Git repository, configures remote, and executes modular commits
# =====================================================================

Write-Host ">>> Initializing Git Repository..." -ForegroundColor Cyan
git init -b main

# Set remote origin if not already set
$remoteUrl = "https://github.com/Avi007-debug/PdfTool.git"
$existingRemote = git remote get-url origin 2>$null
if (-not $existingRemote) {
    Write-Host ">>> Setting remote origin to $remoteUrl" -ForegroundColor Cyan
    git remote add origin $remoteUrl
} else {
    Write-Host ">>> Remote origin already set to $existingRemote" -ForegroundColor Yellow
}

Write-Host "`n>>> Starting Feature-Wise Commits..." -ForegroundColor Green

# 1. Core Scaffolding
Write-Host "[1/10] Committing Core Scaffolding..." -ForegroundColor White
git add .gitignore offline_image_pdf_toolkit.html index.html css/styles.css
git commit -m "feat(core): initial scaffolding, semantic HTML shell and theme styles"

# 2. Application Orchestrator & Router
Write-Host "[2/10] Committing Application Orchestrator & Router..." -ForegroundColor White
git add js/app.js
git commit -m "feat(app): add application orchestrator, view router, theme switcher and toast notifications"

# 3. Images to PDF Engine
Write-Host "[3/10] Committing Images to PDF Engine..." -ForegroundColor White
git add js/img2pdf.js
git commit -m "feat(img2pdf): add JPG/PNG/WEBP to PDF conversion engine with SortableJS reordering and canvas export"

# 4. PDF to Images Extractor
Write-Host "[4/10] Committing PDF to Images Extractor..." -ForegroundColor White
git add js/pdf2img.js
git commit -m "feat(pdf2img): add PDF to image extractor with continuous range and specific page selection"

# 5. Unlock PDF Module
Write-Host "[5/10] Committing Unlock PDF Module..." -ForegroundColor White
git add js/unlockpdf.js
git commit -m "feat(unlockpdf): add client-side PDF password decryption, preview and unencrypted export"

# 6. Lossless Merge PDF Module
Write-Host "[6/10] Committing Lossless Merge PDF Module..." -ForegroundColor White
git add js/mergepdf.js
git commit -m "feat(mergepdf): add lossless multi-file PDF merger powered by pdf-lib"

# 7. Split & Extract PDF Module
Write-Host "[7/10] Committing Split & Extract PDF Module..." -ForegroundColor White
git add js/splitpdf.js
git commit -m "feat(splitpdf): add PDF split and extraction by custom ranges, fixed intervals and specific pages"

# 8. PWA & Mobile Offline Assets
Write-Host "[8/10] Committing PWA & Mobile Offline Assets..." -ForegroundColor White
git add manifest.json sw.js icons/icon.svg
git commit -m "feat(pwa): add Web App Manifest, app icons and offline Service Worker for mobile installability"

# 9. Documentation & Guides
Write-Host "[9/10] Committing Documentation & Guides..." -ForegroundColor White
git add README.md
git commit -m "docs: add comprehensive documentation, mobile setup and cloud deployment guide"

# 10. CI/CD GitHub Actions
Write-Host "[10/10] Committing CI/CD Deployment Workflow..." -ForegroundColor White
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages automated deployment workflow"

Write-Host "`n>>> All 10 feature-wise commits created successfully!" -ForegroundColor Green
git log --oneline

