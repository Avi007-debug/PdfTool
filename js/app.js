/**
 * =====================================================================
 * AviPdf - Local converter | Core Application Orchestrator
 * Theme Management, View Routing, Directory Filtering, Toasts & PWA Setup
 * =====================================================================
 */

(function () {
    'use strict';

    // Global AviPdf Namespace
    window.AviPdf = window.AviPdf || {};

    // 1. DOM Elements
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIconSun = document.getElementById('themeIconSun');
    const themeIconMoon = document.getElementById('themeIconMoon');
    const themeToggleLabel = document.getElementById('themeToggleLabel');

    const views = {
        home: document.getElementById('view-home'),
        img2pdf: document.getElementById('view-img2pdf'),
        pdf2img: document.getElementById('view-pdf2img'),
        unlockpdf: document.getElementById('view-unlockpdf'),
        mergepdf: document.getElementById('view-mergepdf'),
        splitpdf: document.getElementById('view-splitpdf')
    };

    const viewTitles = {
        img2pdf: 'JPG to PDF Converter',
        pdf2img: 'PDF to Images (Range & Page #)',
        unlockpdf: 'Unlock PDF (Password Decryption)',
        mergepdf: 'Merge PDF (Combine PDFs)',
        splitpdf: 'Split & Extract PDF (Ranges, Intervals & Pages)'
    };

    const toolBreadcrumbBar = document.getElementById('toolBreadcrumbBar');
    const breadcrumbCurrentTool = document.getElementById('breadcrumbCurrentTool');

    // 2. Shared Utilities
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
    }
    window.escapeHtml = escapeHtml;
    window.AviPdf.escapeHtml = escapeHtml;

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    window.formatBytes = formatBytes;
    window.AviPdf.formatBytes = formatBytes;

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const colors = {
            success: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200',
            error: 'bg-rose-950/95 border-rose-500/40 text-rose-200',
            info: 'bg-slate-900/95 border-avi-500/40 text-slate-100'
        };

        toast.className = `pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button type="button" class="text-slate-400 hover:text-white ml-2 text-base leading-none">&times;</button>
        `;

        toastContainer.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        const removeToast = () => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('button').addEventListener('click', removeToast);
        setTimeout(removeToast, 3500);
    }
    window.showToast = showToast;
    window.AviPdf.showToast = showToast;

    // 3. Theme Engine (Light Theme + Vibrant Orange Dark Theme)
    function applyTheme(isDark) {
        if (isDark) {
            htmlEl.classList.add('dark');
            htmlEl.classList.remove('light');
            if (themeIconSun) themeIconSun.classList.remove('hidden');
            if (themeIconMoon) themeIconMoon.classList.add('hidden');
            if (themeToggleLabel) themeToggleLabel.textContent = 'Light Mode';
        } else {
            htmlEl.classList.remove('dark');
            htmlEl.classList.add('light');
            if (themeIconSun) themeIconSun.classList.add('hidden');
            if (themeIconMoon) themeIconMoon.classList.remove('hidden');
            if (themeToggleLabel) themeToggleLabel.textContent = 'Orange Dark';
        }
        try {
            localStorage.setItem('avipdf_theme', isDark ? 'dark' : 'light');
        } catch (e) {}
    }
    window.applyTheme = applyTheme;
    window.AviPdf.applyTheme = applyTheme;

    // Load initial theme
    const savedTheme = (() => {
        try {
            return localStorage.getItem('avipdf_theme');
        } catch (e) {
            return null;
        }
    })();
    if (savedTheme) {
        applyTheme(savedTheme === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            applyTheme(!htmlEl.classList.contains('dark'));
        });
    }

    // 4. View Switching & Navigation Router
    function switchView(viewKey) {
        Object.keys(views).forEach(k => {
            if (!views[k]) return;
            if (k === viewKey) {
                views[k].classList.remove('hidden');
            } else {
                views[k].classList.add('hidden');
            }
        });

        if (toolBreadcrumbBar) {
            if (viewKey === 'home') {
                toolBreadcrumbBar.classList.add('hidden');
            } else {
                toolBreadcrumbBar.classList.remove('hidden');
                if (breadcrumbCurrentTool) {
                    breadcrumbCurrentTool.textContent = viewTitles[viewKey] || 'PDF Tool';
                }
            }
        }

        // Highlight Desktop & Mobile top nav items
        document.querySelectorAll('.top-nav-link').forEach(btn => {
            const active = btn.dataset.nav === viewKey;
            if (active) {
                btn.className = 'top-nav-link px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition text-avi-red dark:text-avi-400 bg-orange-50/90 dark:bg-avi-500/15';
            } else {
                btn.className = 'top-nav-link px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition text-slate-600 dark:text-slate-300 hover:text-avi-red dark:hover:text-avi-400';
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.switchView = switchView;
    window.AviPdf.switchView = switchView;

    // 5. Category Filtering Pills on Home Screen
    document.querySelectorAll('#categoryFilterBar .cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const cat = pill.dataset.cat;
            document.querySelectorAll('#categoryFilterBar .cat-pill').forEach(p => {
                const active = p.dataset.cat === cat;
                p.className = active
                    ? 'cat-pill px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition bg-slate-900 text-white dark:bg-avi-500 dark:text-obsidian-950 shadow-sm'
                    : 'cat-pill px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition bg-white dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-obsidian-700 hover:border-slate-400 dark:hover:border-avi-500';
            });

            document.querySelectorAll('#toolDirectoryGrid .tool-dir-card').forEach(card => {
                if (cat === 'all' || card.dataset.category === cat) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // 6. Export Clean Project (.ZIP) Modal & Download
    const zipModal = document.getElementById('zipModal');
    const downloadProjectZipBtn = document.getElementById('downloadProjectZipBtn');

    window.openZipModal = function () {
        if (zipModal) zipModal.classList.remove('hidden');
    };
    window.closeZipModal = function () {
        if (zipModal) zipModal.classList.add('hidden');
    };

    if (downloadProjectZipBtn) {
        downloadProjectZipBtn.addEventListener('click', async () => {
            if (!window.JSZip) {
                showToast('JSZip library is not loaded.', 'error');
                return;
            }

            try {
                downloadProjectZipBtn.disabled = true;
                downloadProjectZipBtn.textContent = 'Generating ZIP...';

                const zip = new JSZip();
                const folder = zip.folder('avipdf-local-converter');

                // Read current scripts and styles or bundle cleanly
                const cssRes = await fetch('css/styles.css').then(r => r.text()).catch(() => '');
                const appJsRes = await fetch('js/app.js').then(r => r.text()).catch(() => '');
                const img2pdfRes = await fetch('js/img2pdf.js').then(r => r.text()).catch(() => '');
                const pdf2imgRes = await fetch('js/pdf2img.js').then(r => r.text()).catch(() => '');
                const mergepdfRes = await fetch('js/mergepdf.js').then(r => r.text()).catch(() => '');
                const splitpdfRes = await fetch('js/splitpdf.js').then(r => r.text()).catch(() => '');
                const unlockpdfRes = await fetch('js/unlockpdf.js').then(r => r.text()).catch(() => '');
                const manifestRes = await fetch('manifest.json').then(r => r.text()).catch(() => '');
                const swRes = await fetch('sw.js').then(r => r.text()).catch(() => '');
                const readmeRes = await fetch('README.md').then(r => r.text()).catch(() => '');
                const indexRes = await fetch('index.html').then(r => r.text()).catch(() => document.documentElement.outerHTML);

                folder.file('index.html', indexRes);
                folder.file('manifest.json', manifestRes);
                folder.file('sw.js', swRes);
                folder.file('README.md', readmeRes);
                folder.folder('css').file('styles.css', cssRes);
                const jsFolder = folder.folder('js');
                jsFolder.file('app.js', appJsRes);
                jsFolder.file('img2pdf.js', img2pdfRes);
                jsFolder.file('pdf2img.js', pdf2imgRes);
                jsFolder.file('mergepdf.js', mergepdfRes);
                jsFolder.file('splitpdf.js', splitpdfRes);
                jsFolder.file('unlockpdf.js', unlockpdfRes);

                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'avipdf-local-converter.zip';
                a.click();
                URL.revokeObjectURL(url);

                window.closeZipModal();
                showToast('Downloaded avipdf-local-converter.zip!', 'success');
            } catch (err) {
                console.error(err);
                showToast('Failed to generate ZIP archive.', 'error');
            } finally {
                downloadProjectZipBtn.disabled = false;
                downloadProjectZipBtn.textContent = 'Download Project .ZIP';
            }
        });
    }

    // 7. Register Service Worker for Offline PWA Support
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('AviPdf Service Worker registered successfully:', reg.scope);
            }).catch(err => {
                console.warn('Service Worker registration skipped/failed:', err);
            });
        });
    }

})();

