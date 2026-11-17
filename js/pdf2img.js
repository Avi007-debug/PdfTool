/**
 * =====================================================================
 * AviPdf - Module 2: PDF to Images (JPG / PNG / WEBP)
 * Continuous Range & Specific Page Number Extraction Engine
 * =====================================================================
 */

(function () {
    'use strict';

    const p2iState = {
        pdfBytes: null,
        pdfDoc: null,
        fileName: 'document',
        totalPages: 0,
        mode: 'all', // 'all' | 'range' | 'specific'
        selectedPages: new Set(),
        format: 'png',
        scale: 2,
        extractedItems: []
    };

    // DOM Elements
    const p2iDropzone = document.getElementById('p2iDropzone');
    const p2iChooseBtn = document.getElementById('p2iChooseBtn');
    const p2iFileInput = document.getElementById('p2iFileInput');
    const p2iFileMeta = document.getElementById('p2iFileMeta');
    const p2iPasswordBox = document.getElementById('p2iPasswordBox');
    const p2iPasswordInput = document.getElementById('p2iPasswordInput');
    const p2iUnlockBtn = document.getElementById('p2iUnlockBtn');
    const p2iDocumentBar = document.getElementById('p2iDocumentBar');
    const p2iDocName = document.getElementById('p2iDocName');
    const p2iTotalPagesBadge = document.getElementById('p2iTotalPagesBadge');
    const p2iPagePills = document.getElementById('p2iPagePills');
    const p2iSelectAllPagesBtn = document.getElementById('p2iSelectAllPagesBtn');
    const p2iClearSelectionBtn = document.getElementById('p2iClearSelectionBtn');
    const p2iRangeControls = document.getElementById('p2iRangeControls');
    const p2iSpecificControls = document.getElementById('p2iSpecificControls');
    const p2iRangeFrom = document.getElementById('p2iRangeFrom');
    const p2iRangeTo = document.getElementById('p2iRangeTo');
    const p2iSpecificInput = document.getElementById('p2iSpecificInput');
    const p2iSelectedSummary = document.getElementById('p2iSelectedSummary');
    const p2iExtractBtn = document.getElementById('p2iExtractBtn');
    const p2iGrid = document.getElementById('p2iGrid');
    const p2iEmptyState = document.getElementById('p2iEmptyState');
    const p2iResultsToolbar = document.getElementById('p2iResultsToolbar');
    const p2iRenderedCountBadge = document.getElementById('p2iRenderedCountBadge');
    const p2iDownloadZipBtn = document.getElementById('p2iDownloadZipBtn');
    const p2iProgressBox = document.getElementById('p2iProgressBox');
    const p2iProgressStatus = document.getElementById('p2iProgressStatus');
    const p2iProgressPct = document.getElementById('p2iProgressPct');
    const p2iProgressBar = document.getElementById('p2iProgressBar');
    const p2iLoadSampleBtn = document.getElementById('p2iLoadSampleBtn');

    if (!p2iDropzone || !p2iFileInput) return;

    // Load PDF
    async function loadPdfForExtraction(file) {
        p2iState.fileName = file.name.replace(/\.pdf$/i, '') || 'document';
        if (p2iFileMeta) p2iFileMeta.textContent = `Selected: ${file.name} (${window.formatBytes(file.size)})`;
        const arrayBuffer = await file.arrayBuffer();
        p2iState.pdfBytes = new Uint8Array(arrayBuffer);
        await openP2iDocument('');
    }

    async function openP2iDocument(password = '') {
        try {
            if (p2iPasswordBox) p2iPasswordBox.classList.add('hidden');
            const loadingTask = pdfjsLib.getDocument({
                data: p2iState.pdfBytes.slice(),
                password: password || undefined
            });
            const pdfDoc = await loadingTask.promise;
            p2iState.pdfDoc = pdfDoc;
            p2iState.totalPages = pdfDoc.numPages;

            p2iState.selectedPages = new Set();
            for (let p = 1; p <= pdfDoc.numPages; p++) {
                p2iState.selectedPages.add(p);
            }

            if (p2iRangeFrom) {
                p2iRangeFrom.max = pdfDoc.numPages;
                p2iRangeFrom.value = 1;
            }
            if (p2iRangeTo) {
                p2iRangeTo.max = pdfDoc.numPages;
                p2iRangeTo.value = pdfDoc.numPages;
            }
            if (p2iSpecificInput) p2iSpecificInput.value = `1-${pdfDoc.numPages}`;

            if (p2iDocName) p2iDocName.textContent = `${p2iState.fileName}.pdf`;
            if (p2iTotalPagesBadge) p2iTotalPagesBadge.textContent = `${pdfDoc.numPages} Pages`;
            if (p2iDocumentBar) p2iDocumentBar.classList.remove('hidden');

            syncP2iSelectionFromMode();
            window.showToast(`Loaded "${p2iState.fileName}.pdf" (${pdfDoc.numPages} pages).`, 'success');
        } catch (err) {
            if (err && err.name === 'PasswordException') {
                if (p2iPasswordBox) p2iPasswordBox.classList.remove('hidden');
                if (p2iPasswordInput) p2iPasswordInput.focus();
                window.showToast('Password-protected PDF. Enter its password to unlock.', 'info');
            } else {
                console.error('Error loading PDF:', err);
                window.showToast('Could not read PDF file.', 'error');
            }
        }
    }

    if (p2iUnlockBtn && p2iPasswordInput) {
        p2iUnlockBtn.addEventListener('click', () => openP2iDocument(p2iPasswordInput.value));
        p2iPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openP2iDocument(p2iPasswordInput.value);
        });
    }

    // Parse page expression like "1, 3, 5-8"
    function parsePageExpression(expr, maxPage) {
        const result = new Set();
        if (!expr || !maxPage) return result;
        const parts = expr.split(',');
        for (const raw of parts) {
            const part = raw.trim();
            if (!part) continue;
            if (part.includes('-')) {
                const [startStr, endStr] = part.split('-').map(s => s.trim());
                let start = parseInt(startStr, 10);
                let end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end)) {
                    if (start > end) [start, end] = [end, start];
                    for (let p = Math.max(1, start); p <= Math.min(maxPage, end); p++) {
                        result.add(p);
                    }
                }
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num) && num >= 1 && num <= maxPage) {
                    result.add(num);
                }
            }
        }
        return result;
    }
    window.AviPdf.parsePageExpression = parsePageExpression;

    function syncP2iSelectionFromMode() {
        const max = p2iState.totalPages;
        if (!max) return;

        if (p2iState.mode === 'all') {
            p2iState.selectedPages = new Set();
            for (let i = 1; i <= max; i++) p2iState.selectedPages.add(i);
        } else if (p2iState.mode === 'range') {
            let from = (p2iRangeFrom && parseInt(p2iRangeFrom.value, 10)) || 1;
            let to = (p2iRangeTo && parseInt(p2iRangeTo.value, 10)) || max;
            from = Math.max(1, Math.min(max, from));
            to = Math.max(1, Math.min(max, to));
            if (from > to) [from, to] = [to, from];
            p2iState.selectedPages = new Set();
            for (let i = from; i <= to; i++) p2iState.selectedPages.add(i);
        } else if (p2iState.mode === 'specific') {
            const val = p2iSpecificInput ? p2iSpecificInput.value : '';
            p2iState.selectedPages = parsePageExpression(val, max);
        }
        renderP2iPagePills();
    }

    function renderP2iPagePills() {
        const max = p2iState.totalPages;
        const count = p2iState.selectedPages.size;
        if (p2iSelectedSummary) p2iSelectedSummary.textContent = `${count} of ${max} selected`;
        if (p2iExtractBtn) p2iExtractBtn.disabled = count === 0 || !p2iState.pdfDoc;

        if (!p2iPagePills) return;
        let html = '';
        for (let p = 1; p <= max; p++) {
            const isSelected = p2iState.selectedPages.has(p);
            const cls = isSelected
                ? 'bg-avi-red dark:bg-avi-500 text-white border-avi-red dark:border-avi-500 shadow-sm'
                : 'bg-slate-50 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-obsidian-700 hover:border-avi-400';
            html += `<button type="button" onclick="window.AviPdf.toggleP2iPagePill(${p})" class="px-2.5 py-1 rounded-lg border text-xs font-bold transition ${cls}">Page ${p}</button>`;
        }
        p2iPagePills.innerHTML = html;
    }

    window.AviPdf.toggleP2iPagePill = function (pageNum) {
        if (p2iState.selectedPages.has(pageNum)) {
            p2iState.selectedPages.delete(pageNum);
        } else {
            p2iState.selectedPages.add(pageNum);
        }
        setP2iModeUI('specific', false);
        const sorted = Array.from(p2iState.selectedPages).sort((a, b) => a - b);
        if (p2iSpecificInput) p2iSpecificInput.value = sorted.join(', ');
        renderP2iPagePills();
    };

    function setP2iModeUI(mode, recalculate = true) {
        p2iState.mode = mode;
        document.querySelectorAll('#p2iModeGroup .p2i-mode-btn').forEach(btn => {
            const active = btn.dataset.mode === mode;
            btn.className = active
                ? 'p2i-mode-btn px-2 py-2.5 rounded-xl border text-xs font-bold transition bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300'
                : 'p2i-mode-btn px-2 py-2.5 rounded-xl border text-xs font-medium transition bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400';
        });
        if (p2iRangeControls) p2iRangeControls.classList.toggle('hidden', mode !== 'range');
        if (p2iSpecificControls) p2iSpecificControls.classList.toggle('hidden', mode !== 'specific');
        if (recalculate) syncP2iSelectionFromMode();
    }
    window.AviPdf.setP2iModeUI = setP2iModeUI;

    document.querySelectorAll('#p2iModeGroup .p2i-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setP2iModeUI(btn.dataset.mode, true));
    });

    if (p2iRangeFrom) p2iRangeFrom.addEventListener('input', syncP2iSelectionFromMode);
    if (p2iRangeTo) p2iRangeTo.addEventListener('input', syncP2iSelectionFromMode);
    if (p2iSpecificInput) p2iSpecificInput.addEventListener('input', syncP2iSelectionFromMode);

    if (p2iSelectAllPagesBtn) p2iSelectAllPagesBtn.addEventListener('click', () => setP2iModeUI('all', true));
    if (p2iClearSelectionBtn) {
        p2iClearSelectionBtn.addEventListener('click', () => {
            p2iState.selectedPages.clear();
            if (p2iSpecificInput) p2iSpecificInput.value = '';
            setP2iModeUI('specific', false);
            renderP2iPagePills();
        });
    }

    document.querySelectorAll('#p2iFormatGroup .p2i-fmt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            p2iState.format = btn.dataset.format;
            document.querySelectorAll('#p2iFormatGroup .p2i-fmt-btn').forEach(b => {
                const active = b.dataset.format === p2iState.format;
                b.className = active
                    ? 'p2i-fmt-btn px-3 py-2 rounded-xl border text-xs font-bold transition bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300'
                    : 'p2i-fmt-btn px-3 py-2 rounded-xl border text-xs font-medium transition bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400';
            });
        });
    });

    document.querySelectorAll('#p2iScaleGroup .p2i-scale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            p2iState.scale = parseFloat(btn.dataset.scale);
            document.querySelectorAll('#p2iScaleGroup .p2i-scale-btn').forEach(b => {
                const active = parseFloat(b.dataset.scale) === p2iState.scale;
                b.className = active
                    ? 'p2i-scale-btn px-2 py-2 rounded-xl border text-xs font-bold transition bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300'
                    : 'p2i-scale-btn px-2 py-2 rounded-xl border text-xs font-medium transition bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400';
            });
        });
    });

    // Render Pages to Canvas & Export
    if (p2iExtractBtn) {
        p2iExtractBtn.addEventListener('click', async () => {
            if (!p2iState.pdfDoc || p2iState.selectedPages.size === 0) return;

            const pagesToExtract = Array.from(p2iState.selectedPages).sort((a, b) => a - b);
            p2iState.extractedItems = [];
            p2iExtractBtn.disabled = true;
            if (p2iProgressBox) p2iProgressBox.classList.remove('hidden');

            const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
            const extMap = { png: 'png', jpeg: 'jpg', webp: 'webp' };
            const mime = mimeMap[p2iState.format] || 'image/png';
            const ext = extMap[p2iState.format] || 'png';

            try {
                for (let i = 0; i < pagesToExtract.length; i++) {
                    const pageNum = pagesToExtract[i];
                    const pct = Math.round(((i + 1) / pagesToExtract.length) * 100);
                    if (p2iProgressStatus) p2iProgressStatus.textContent = `Rendering page ${pageNum} (${i + 1}/${pagesToExtract.length})...`;
                    if (p2iProgressPct) p2iProgressPct.textContent = `${pct}%`;
                    if (p2iProgressBar) p2iProgressBar.style.width = `${pct}%`;

                    const page = await p2iState.pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: p2iState.scale });
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(viewport.width);
                    canvas.height = Math.round(viewport.height);
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    await page.render({ canvasContext: ctx, viewport }).promise;
                    const dataUrl = canvas.toDataURL(mime, 0.92);
                    const paddedPage = String(pageNum).padStart(2, '0');
                    const outName = `${p2iState.fileName}-page-${paddedPage}.${ext}`;

                    p2iState.extractedItems.push({
                        pageNum,
                        dataUrl,
                        ext,
                        fileName: outName,
                        width: canvas.width,
                        height: canvas.height
                    });
                }

                renderP2iExtractedGrid();
                window.showToast(`Extracted ${p2iState.extractedItems.length} page image(s)!`, 'success');
            } catch (err) {
                console.error('Extraction error:', err);
                window.showToast('Error rendering PDF pages.', 'error');
            } finally {
                setTimeout(() => {
                    if (p2iProgressBox) p2iProgressBox.classList.add('hidden');
                    if (p2iExtractBtn) p2iExtractBtn.disabled = false;
                }, 400);
            }
        });
    }

    function renderP2iExtractedGrid() {
        const items = p2iState.extractedItems;
        if (items.length === 0) {
            if (p2iEmptyState) p2iEmptyState.classList.remove('hidden');
            if (p2iResultsToolbar) p2iResultsToolbar.classList.add('hidden');
            if (p2iGrid) p2iGrid.innerHTML = '';
            return;
        }

        if (p2iEmptyState) p2iEmptyState.classList.add('hidden');
        if (p2iResultsToolbar) {
            p2iResultsToolbar.classList.remove('hidden');
            p2iResultsToolbar.classList.add('flex');
        }
        if (p2iRenderedCountBadge) {
            p2iRenderedCountBadge.textContent = `${items.length} Extracted ${items.length === 1 ? 'Image' : 'Images'}`;
        }

        if (p2iGrid) {
            p2iGrid.innerHTML = items.map(item => `
                <div class="bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-500/15 dark:bg-avi-500/20 text-avi-700 dark:text-avi-300">
                            Page ${item.pageNum}
                        </span>
                        <span class="text-[11px] font-mono text-slate-400">${item.width}&times;${item.height}px • ${item.ext.toUpperCase()}</span>
                    </div>
                    <div class="bg-slate-100 dark:bg-obsidian-900 rounded-xl p-2.5 h-48 flex items-center justify-center overflow-hidden">
                        <img src="${item.dataUrl}" alt="Page ${item.pageNum}" class="max-h-full max-w-full object-contain rounded paper-shadow">
                    </div>
                    <a href="${item.dataUrl}" download="${window.escapeHtml(item.fileName)}" class="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-avi-500 hover:opacity-90 text-white dark:text-obsidian-950 text-xs font-bold transition flex items-center justify-center gap-1.5">
                        <span>Download Page ${item.pageNum}</span>
                    </a>
                </div>
            `).join('');
        }
    }

    if (p2iDownloadZipBtn) {
        p2iDownloadZipBtn.addEventListener('click', async () => {
            if (!window.JSZip || p2iState.extractedItems.length === 0) return;
            const zip = new JSZip();
            p2iState.extractedItems.forEach(item => {
                const base64Data = item.dataUrl.split(',')[1];
                zip.file(item.fileName, base64Data, { base64: true });
            });
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${p2iState.fileName}-extracted-images.zip`;
            a.click();
            URL.revokeObjectURL(url);
            window.showToast('Downloaded ZIP archive of extracted pages!', 'success');
        });
    }

    // Demo Sample PDF Generator
    if (p2iLoadSampleBtn) {
        p2iLoadSampleBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!window.jspdf || !window.jspdf.jsPDF) {
                window.showToast('jsPDF library not loaded.', 'error');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const colors = [
                [234, 88, 12], [229, 50, 45], [5, 150, 105],
                [217, 119, 6], [14, 165, 233], [124, 58, 237]
            ];
            for (let p = 1; p <= 6; p++) {
                if (p > 1) doc.addPage('a4', 'p');
                const [r, g, b] = colors[p - 1];
                doc.setFillColor(r, g, b);
                doc.rect(15, 15, 180, 50, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text(`AVIPDF SAMPLE REPORT — PAGE ${p} OF 6`, 25, 42);
                doc.setTextColor(40, 40, 40);
                doc.setFontSize(14);
                doc.text(`Test Page #${p} for 1. Page Range & 2. Specific Page Number Extraction`, 20, 90);
                doc.setFontSize(11);
                doc.text(`Select "1. Range" (e.g. 2 to 4) or "2. Page #" (e.g. 1, 3, 6) in the right panel.`, 20, 105);
                doc.setDrawColor(r, g, b);
                doc.setLineWidth(1);
                doc.rect(15, 15, 180, 267);
            }
            const arrayBuf = doc.output('arraybuffer');
            p2iState.fileName = 'avipdf-6-page-demo';
            if (p2iFileMeta) p2iFileMeta.textContent = 'Loaded built-in 6-page demo PDF';
            p2iState.pdfBytes = new Uint8Array(arrayBuf);
            await openP2iDocument('');
        });
    }

    // Dropzone listeners
    p2iChooseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        p2iFileInput.click();
    });
    p2iDropzone.addEventListener('click', () => p2iFileInput.click());
    p2iFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            await loadPdfForExtraction(e.target.files[0]);
            p2iFileInput.value = '';
        }
    });

    ['dragenter', 'dragover'].forEach(evt => {
        p2iDropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            p2iDropzone.classList.add('scale-[1.01]');
        });
    });
    ['dragleave', 'drop'].forEach(evt => {
        p2iDropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            p2iDropzone.classList.remove('scale-[1.01]');
        });
    });
    p2iDropzone.addEventListener('drop', async (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            await loadPdfForExtraction(e.dataTransfer.files[0]);
        }
    });

    window.addEventListener('load', () => {
        setP2iModeUI('all', false);
    });

})();

