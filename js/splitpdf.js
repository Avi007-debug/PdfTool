/**
 * =====================================================================
 * AviPdf - Module 5: Split & Extract PDF
 * Custom Ranges, Fixed Intervals & Specific Page Extraction via pdf-lib
 * =====================================================================
 */

(function () {
    'use strict';

    const splState = {
        pdfBytes: null,
        pdfDoc: null,
        fileName: 'document',
        totalPages: 0,
        method: 'ranges', // 'ranges' | 'interval' | 'extract'
        ranges: [{ from: 1, to: 1 }],
        mergeRanges: true,
        interval: 2,
        extractMode: 'select', // 'all' | 'select'
        extractSelectedPages: new Set(),
        mergeExtracted: true
    };

    // DOM Elements
    const splDropzone = document.getElementById('splDropzone');
    const splChooseBtn = document.getElementById('splChooseBtn');
    const splLoadDemoBtn = document.getElementById('splLoadDemoBtn');
    const splFileInput = document.getElementById('splFileInput');
    const splFileMeta = document.getElementById('splFileMeta');
    const splDocBar = document.getElementById('splDocBar');
    const splDocTitle = document.getElementById('splDocTitle');
    const splTotalPagesBadge = document.getElementById('splTotalPagesBadge');
    const splEmptyState = document.getElementById('splEmptyState');
    const splThumbGrid = document.getElementById('splThumbGrid');
    const splOutputSummaryBadge = document.getElementById('splOutputSummaryBadge');
    const splPanelRanges = document.getElementById('splPanelRanges');
    const splPanelInterval = document.getElementById('splPanelInterval');
    const splPanelExtract = document.getElementById('splPanelExtract');
    const splRangesContainer = document.getElementById('splRangesContainer');
    const splAddRangeBtn = document.getElementById('splAddRangeBtn');
    const splMergeRangesCheckbox = document.getElementById('splMergeRangesCheckbox');
    const splIntervalInput = document.getElementById('splIntervalInput');
    const splIntervalSummaryBox = document.getElementById('splIntervalSummaryBox');
    const splExtAllBtn = document.getElementById('splExtAllBtn');
    const splExtSelectBtn = document.getElementById('splExtSelectBtn');
    const splExtSpecificBox = document.getElementById('splExtSpecificBox');
    const splExtPagesInput = document.getElementById('splExtPagesInput');
    const splExtMergeWrap = document.getElementById('splExtMergeWrap');
    const splExtMergeCheckbox = document.getElementById('splExtMergeCheckbox');
    const splFilenameInput = document.getElementById('splFilenameInput');
    const splExportBtn = document.getElementById('splExportBtn');
    const splExportBtnLabel = document.getElementById('splExportBtnLabel');

    if (!splDropzone || !splFileInput) return;

    // Load PDF for splitting
    async function loadPdfForSplit(file) {
        const base = file.name.replace(/\.pdf$/i, '') || 'document';
        splState.fileName = base;
        if (splFilenameInput) splFilenameInput.value = `${base}-split`;
        if (splFileMeta) splFileMeta.textContent = `Loaded: ${file.name} (${window.formatBytes(file.size)})`;
        const buf = await file.arrayBuffer();
        splState.pdfBytes = new Uint8Array(buf);
        await initSplitDocument();
    }

    async function initSplitDocument() {
        try {
            const pdfDoc = await pdfjsLib.getDocument({ data: splState.pdfBytes.slice() }).promise;
            splState.pdfDoc = pdfDoc;
            splState.totalPages = pdfDoc.numPages;

            // Default ranges & selections
            splState.ranges = [
                { from: 1, to: Math.min(3, pdfDoc.numPages) }
            ];
            if (pdfDoc.numPages >= 5) {
                splState.ranges.push({ from: 4, to: pdfDoc.numPages });
            }

            splState.extractSelectedPages = new Set();
            for (let p = 1; p <= Math.min(3, pdfDoc.numPages); p++) {
                splState.extractSelectedPages.add(p);
            }
            if (splExtPagesInput) {
                splExtPagesInput.value = Array.from(splState.extractSelectedPages).join(', ');
            }

            if (splDocTitle) splDocTitle.textContent = `${splState.fileName}.pdf`;
            if (splTotalPagesBadge) splTotalPagesBadge.textContent = `${pdfDoc.numPages} Pages`;
            if (splDocBar) splDocBar.classList.remove('hidden');
            if (splEmptyState) splEmptyState.classList.add('hidden');
            if (splExportBtn) splExportBtn.disabled = false;

            await renderSplitThumbnails();
            renderSplitRangesRows();
            updateSplitMethodUI();
            window.showToast(`Loaded "${splState.fileName}.pdf" (${pdfDoc.numPages} pages).`, 'success');
        } catch (err) {
            console.error('Error initializing split PDF:', err);
            window.showToast('Could not open PDF for splitting.', 'error');
        }
    }

    // Render interactive thumbnails
    async function renderSplitThumbnails() {
        if (!splState.pdfDoc || !splThumbGrid) return;
        splThumbGrid.innerHTML = '';
        const total = splState.pdfDoc.numPages;

        for (let p = 1; p <= total; p++) {
            const page = await splState.pdfDoc.getPage(p);
            const vp = page.getViewport({ scale: 0.55 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: vp }).promise;

            const card = document.createElement('div');
            card.id = `spl-thumb-${p}`;
            card.onclick = () => handleSplitThumbClick(p);
            card.className = 'cursor-pointer rounded-xl p-2.5 border transition flex flex-col items-center gap-2 bg-white dark:bg-obsidian-800 border-slate-200 dark:border-obsidian-700';
            card.innerHTML = `
                <div class="w-full flex items-center justify-between text-[11px] font-bold">
                    <span class="spl-page-pill px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-700 text-slate-700 dark:text-slate-300">Page ${p}</span>
                    <span class="spl-range-tag text-[10px] font-bold text-avi-600 dark:text-avi-400"></span>
                </div>
                <img src="${canvas.toDataURL('image/jpeg', 0.82)}" class="max-h-36 object-contain rounded paper-shadow pointer-events-none" alt="Page ${p}">
            `;
            splThumbGrid.appendChild(card);
        }
        highlightSplitThumbnails();
    }

    function handleSplitThumbClick(pageNum) {
        if (splState.method !== 'extract') {
            splState.method = 'extract';
            splState.extractMode = 'select';
        } else if (splState.extractMode === 'all') {
            splState.extractMode = 'select';
        }

        if (splState.extractSelectedPages.has(pageNum)) {
            splState.extractSelectedPages.delete(pageNum);
        } else {
            splState.extractSelectedPages.add(pageNum);
        }
        const sorted = Array.from(splState.extractSelectedPages).sort((a, b) => a - b);
        if (splExtPagesInput) splExtPagesInput.value = sorted.join(', ');
        updateSplitMethodUI();
    }

    function renderSplitRangesRows() {
        if (!splRangesContainer) return;
        const max = splState.totalPages || 999;
        splRangesContainer.innerHTML = splState.ranges.map((r, idx) => `
            <div class="flex items-center justify-between gap-2 bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 rounded-xl px-3 py-2">
                <span class="text-xs font-extrabold text-avi-600 dark:text-avi-400 shrink-0">Range ${idx + 1}</span>
                <div class="flex items-center gap-1.5">
                    <span class="text-[11px] text-slate-400">From</span>
                    <input type="number" min="1" max="${max}" value="${r.from}" onchange="window.AviPdf.updateSplRangeVal(${idx}, 'from', this.value)" class="w-16 bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-obsidian-600 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-900 dark:text-white outline-none">
                    <span class="text-[11px] text-slate-400">To</span>
                    <input type="number" min="1" max="${max}" value="${r.to}" onchange="window.AviPdf.updateSplRangeVal(${idx}, 'to', this.value)" class="w-16 bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-obsidian-600 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-900 dark:text-white outline-none">
                </div>
                <button type="button" onclick="window.AviPdf.removeSplRangeRow(${idx})" ${splState.ranges.length <= 1 ? 'disabled' : ''} class="text-slate-400 hover:text-rose-500 disabled:opacity-25 font-bold text-sm px-1" title="Remove Range">&times;</button>
            </div>
        `).join('');
    }

    window.AviPdf.updateSplRangeVal = function (idx, field, val) {
        const max = splState.totalPages || 999;
        let num = parseInt(val, 10) || 1;
        num = Math.max(1, Math.min(max, num));
        splState.ranges[idx][field] = num;
        renderSplitRangesRows();
        updateSplitMethodUI();
    };
    window.updateSplRangeVal = window.AviPdf.updateSplRangeVal;

    window.AviPdf.removeSplRangeRow = function (idx) {
        if (splState.ranges.length <= 1) return;
        splState.ranges.splice(idx, 1);
        renderSplitRangesRows();
        updateSplitMethodUI();
    };
    window.removeSplRangeRow = window.AviPdf.removeSplRangeRow;

    if (splAddRangeBtn) {
        splAddRangeBtn.addEventListener('click', () => {
            const max = splState.totalPages || 1;
            const last = splState.ranges[splState.ranges.length - 1];
            const nextFrom = last ? Math.min(max, last.to + 1) : 1;
            splState.ranges.push({ from: nextFrom, to: max });
            renderSplitRangesRows();
            updateSplitMethodUI();
        });
    }

    if (splMergeRangesCheckbox) {
        splMergeRangesCheckbox.addEventListener('change', (e) => {
            splState.mergeRanges = e.target.checked;
            updateSplitMethodUI();
        });
    }

    if (splIntervalInput) {
        splIntervalInput.addEventListener('input', (e) => {
            splState.interval = Math.max(1, parseInt(e.target.value, 10) || 1);
            updateSplitMethodUI();
        });
    }

    if (splExtAllBtn) {
        splExtAllBtn.addEventListener('click', () => {
            splState.extractMode = 'all';
            updateSplitMethodUI();
        });
    }

    if (splExtSelectBtn) {
        splExtSelectBtn.addEventListener('click', () => {
            splState.extractMode = 'select';
            updateSplitMethodUI();
        });
    }

    if (splExtPagesInput) {
        splExtPagesInput.addEventListener('input', () => {
            if (window.AviPdf.parsePageExpression) {
                splState.extractSelectedPages = window.AviPdf.parsePageExpression(splExtPagesInput.value, splState.totalPages || 999);
                highlightSplitThumbnails();
                updateSplitSummaryText();
            }
        });
    }

    if (splExtMergeCheckbox) {
        splExtMergeCheckbox.addEventListener('change', (e) => {
            splState.mergeExtracted = e.target.checked;
            updateSplitMethodUI();
        });
    }

    document.querySelectorAll('#splMethodGroup .spl-method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            splState.method = btn.dataset.method;
            updateSplitMethodUI();
        });
    });

    function updateSplitMethodUI() {
        document.querySelectorAll('#splMethodGroup .spl-method-btn').forEach(btn => {
            const active = btn.dataset.method === splState.method;
            btn.className = active
                ? 'spl-method-btn px-2.5 py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300 shadow-sm'
                : 'spl-method-btn px-2.5 py-2.5 rounded-xl border text-xs font-medium transition flex flex-col items-center gap-1 text-center bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400';
        });

        if (splPanelRanges) splPanelRanges.classList.toggle('hidden', splState.method !== 'ranges');
        if (splPanelInterval) splPanelInterval.classList.toggle('hidden', splState.method !== 'interval');
        if (splPanelExtract) splPanelExtract.classList.toggle('hidden', splState.method !== 'extract');

        const isAll = splState.extractMode === 'all';
        if (splExtAllBtn) {
            splExtAllBtn.className = isAll
                ? 'px-3 py-2 rounded-lg border text-xs font-bold transition bg-avi-red dark:bg-avi-500 text-white border-avi-red dark:border-avi-500'
                : 'px-3 py-2 rounded-lg border text-xs font-semibold transition bg-white dark:bg-obsidian-800 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-300';
        }
        if (splExtSelectBtn) {
            splExtSelectBtn.className = !isAll
                ? 'px-3 py-2 rounded-lg border text-xs font-bold transition bg-avi-red dark:bg-avi-500 text-white border-avi-red dark:border-avi-500'
                : 'px-3 py-2 rounded-lg border text-xs font-semibold transition bg-white dark:bg-obsidian-800 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-300';
        }

        if (splExtSpecificBox) splExtSpecificBox.classList.toggle('hidden', isAll);
        if (splExtMergeWrap) splExtMergeWrap.classList.toggle('hidden', isAll);

        highlightSplitThumbnails();
        updateSplitSummaryText();
    }

    function updateSplitSummaryText() {
        const total = splState.totalPages;
        if (!total) {
            if (splOutputSummaryBadge) splOutputSummaryBadge.textContent = 'Awaiting PDF';
            return;
        }

        if (splState.method === 'ranges') {
            const count = splState.ranges.length;
            if (splOutputSummaryBadge) {
                splOutputSummaryBadge.textContent = splState.mergeRanges
                    ? `${count} Range(s) → 1 Merged PDF`
                    : `${count} Range(s) → ${count} PDFs (.ZIP)`;
            }
            if (splExportBtnLabel) {
                splExportBtnLabel.textContent = splState.mergeRanges
                    ? 'Extract & Merge Ranges (.PDF)'
                    : `Split into ${count} Range PDFs (.ZIP)`;
            }
        } else if (splState.method === 'interval') {
            const n = Math.max(1, splState.interval);
            const chunks = Math.ceil(total / n);
            if (splIntervalSummaryBox) {
                splIntervalSummaryBox.textContent = `Splitting ${total} pages every ${n} page(s) will generate ${chunks} separate PDF file(s) bundled in a ZIP archive.`;
            }
            if (splOutputSummaryBadge) splOutputSummaryBadge.textContent = `Every ${n} pg → ${chunks} PDFs (.ZIP)`;
            if (splExportBtnLabel) splExportBtnLabel.textContent = `Split into ${chunks} PDFs (.ZIP)`;
        } else if (splState.method === 'extract') {
            if (splState.extractMode === 'all') {
                if (splOutputSummaryBadge) splOutputSummaryBadge.textContent = `${total} Separate 1-Page PDFs (.ZIP)`;
                if (splExportBtnLabel) splExportBtnLabel.textContent = `Extract All ${total} Pages (.ZIP)`;
            } else {
                const selCount = splState.extractSelectedPages.size;
                if (splOutputSummaryBadge) {
                    splOutputSummaryBadge.textContent = splState.mergeExtracted
                        ? `${selCount} Selected → 1 Merged PDF`
                        : `${selCount} Selected → ${selCount} PDFs (.ZIP)`;
                }
                if (splExportBtnLabel) {
                    splExportBtnLabel.textContent = splState.mergeExtracted
                        ? `Extract ${selCount} Page(s) to PDF`
                        : `Extract ${selCount} Page(s) as ZIP`;
                }
            }
        }
    }

    function highlightSplitThumbnails() {
        const total = splState.totalPages;
        if (!total) return;

        for (let p = 1; p <= total; p++) {
            const card = document.getElementById(`spl-thumb-${p}`);
            if (!card) continue;
            const pill = card.querySelector('.spl-page-pill');
            const tag = card.querySelector('.spl-range-tag');

            let active = false;
            let tagLabel = '';

            if (splState.method === 'ranges') {
                const matchedRanges = [];
                splState.ranges.forEach((r, idx) => {
                    const start = Math.min(r.from, r.to);
                    const end = Math.max(r.from, r.to);
                    if (p >= start && p <= end) matchedRanges.push(`R${idx + 1}`);
                });
                active = matchedRanges.length > 0;
                tagLabel = matchedRanges.join(', ');
            } else if (splState.method === 'interval') {
                active = true;
                const chunkIdx = Math.floor((p - 1) / Math.max(1, splState.interval)) + 1;
                tagLabel = `File #${chunkIdx}`;
            } else if (splState.method === 'extract') {
                if (splState.extractMode === 'all') {
                    active = true;
                    tagLabel = `PDF #${p}`;
                } else {
                    active = splState.extractSelectedPages.has(p);
                    tagLabel = active ? 'Selected' : '';
                }
            }

            if (tag) tag.textContent = tagLabel;
            if (active) {
                card.className = 'cursor-pointer rounded-xl p-2.5 border-2 transition flex flex-col items-center gap-2 bg-orange-50/70 dark:bg-avi-500/15 border-avi-500 shadow-sm';
                if (pill) pill.className = 'spl-page-pill px-2 py-0.5 rounded bg-avi-red dark:bg-avi-500 text-white';
            } else {
                card.className = 'cursor-pointer rounded-xl p-2.5 border transition flex flex-col items-center gap-2 bg-white dark:bg-obsidian-800 border-slate-200 dark:border-obsidian-700 opacity-55 hover:opacity-100';
                if (pill) pill.className = 'spl-page-pill px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-700 text-slate-700 dark:text-slate-300';
            }
        }
    }

    // Split Execution (Lossless pdf-lib)
    if (splExportBtn) {
        splExportBtn.addEventListener('click', async () => {
            if (!splState.pdfBytes || !window.PDFLib) {
                window.showToast('pdf-lib library not loaded.', 'error');
                return;
            }
            const { PDFDocument } = window.PDFLib;
            const prefix = ((splFilenameInput && splFilenameInput.value.trim()) || 'avipdf-split').replace(/\.pdf$/i, '');
            const total = splState.totalPages;

            splExportBtn.disabled = true;
            try {
                const srcDoc = await PDFDocument.load(splState.pdfBytes);

                const buildPdfBytes = async (pageNumbers) => {
                    const outDoc = await PDFDocument.create();
                    const indices = pageNumbers.map(n => n - 1).filter(i => i >= 0 && i < total);
                    const copied = await outDoc.copyPages(srcDoc, indices);
                    copied.forEach(p => outDoc.addPage(p));
                    return await outDoc.save();
                };

                const triggerBlobDownload = (blob, filename) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                };

                if (splState.method === 'ranges') {
                    if (splState.mergeRanges) {
                        const allPages = [];
                        splState.ranges.forEach(r => {
                            const s = Math.min(r.from, r.to);
                            const e = Math.max(r.from, r.to);
                            for (let p = s; p <= e; p++) allPages.push(p);
                        });
                        const bytes = await buildPdfBytes(allPages);
                        triggerBlobDownload(new Blob([bytes], { type: 'application/pdf' }), `${prefix}-merged-ranges.pdf`);
                        window.showToast('Exported merged custom page ranges as a single PDF!', 'success');
                    } else {
                        const zip = new JSZip();
                        for (let i = 0; i < splState.ranges.length; i++) {
                            const r = splState.ranges[i];
                            const s = Math.min(r.from, r.to);
                            const e = Math.max(r.from, r.to);
                            const pages = [];
                            for (let p = s; p <= e; p++) pages.push(p);
                            const bytes = await buildPdfBytes(pages);
                            zip.file(`${prefix}-range-${i + 1}-pages-${s}-to-${e}.pdf`, bytes);
                        }
                        const zipBlob = await zip.generateAsync({ type: 'blob' });
                        triggerBlobDownload(zipBlob, `${prefix}-custom-ranges.zip`);
                        window.showToast(`Exported ${splState.ranges.length} custom range PDFs in a ZIP!`, 'success');
                    }
                } else if (splState.method === 'interval') {
                    const step = Math.max(1, splState.interval);
                    const zip = new JSZip();
                    let part = 1;
                    for (let start = 1; start <= total; start += step) {
                        const end = Math.min(total, start + step - 1);
                        const pages = [];
                        for (let p = start; p <= end; p++) pages.push(p);
                        const bytes = await buildPdfBytes(pages);
                        zip.file(`${prefix}-part-${part}-pages-${start}-to-${end}.pdf`, bytes);
                        part++;
                    }
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    triggerBlobDownload(zipBlob, `${prefix}-interval-${step}-pages.zip`);
                    window.showToast(`Split PDF every ${step} page(s) into ${part - 1} files (.ZIP)!`, 'success');
                } else if (splState.method === 'extract') {
                    if (splState.extractMode === 'all') {
                        const zip = new JSZip();
                        for (let p = 1; p <= total; p++) {
                            const bytes = await buildPdfBytes([p]);
                            zip.file(`${prefix}-page-${String(p).padStart(2, '0')}.pdf`, bytes);
                        }
                        const zipBlob = await zip.generateAsync({ type: 'blob' });
                        triggerBlobDownload(zipBlob, `${prefix}-all-${total}-pages.zip`);
                        window.showToast(`Extracted all ${total} pages as individual PDFs (.ZIP)!`, 'success');
                    } else {
                        const selected = Array.from(splState.extractSelectedPages).sort((a, b) => a - b);
                        if (selected.length === 0) {
                            window.showToast('Please select at least 1 page to extract.', 'error');
                            return;
                        }
                        if (splState.mergeExtracted) {
                            const bytes = await buildPdfBytes(selected);
                            triggerBlobDownload(new Blob([bytes], { type: 'application/pdf' }), `${prefix}-extracted-pages.pdf`);
                            window.showToast(`Extracted ${selected.length} selected page(s) into one PDF!`, 'success');
                        } else {
                            const zip = new JSZip();
                            for (const p of selected) {
                                const bytes = await buildPdfBytes([p]);
                                zip.file(`${prefix}-page-${String(p).padStart(2, '0')}.pdf`, bytes);
                            }
                            const zipBlob = await zip.generateAsync({ type: 'blob' });
                            triggerBlobDownload(zipBlob, `${prefix}-selected-pages.zip`);
                            window.showToast(`Extracted ${selected.length} selected page(s) into a ZIP archive!`, 'success');
                        }
                    }
                }
            } catch (err) {
                console.error('Split/Extract Error:', err);
                window.showToast('Error while splitting/extracting PDF.', 'error');
            } finally {
                splExportBtn.disabled = false;
            }
        });
    }

    // Demo Sample 8-Page Handbook Generator
    if (splLoadDemoBtn) {
        splLoadDemoBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!window.jspdf || !window.jspdf.jsPDF) {
                window.showToast('jsPDF library not available.', 'error');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const palette = [
                [234, 88, 12], [225, 29, 72], [13, 148, 136], [37, 99, 235],
                [124, 58, 237], [217, 119, 6], [5, 150, 105], [79, 70, 229]
            ];
            for (let p = 1; p <= 8; p++) {
                if (p > 1) doc.addPage('a4', 'p');
                const [r, g, b] = palette[p - 1];
                doc.setFillColor(r, g, b);
                doc.rect(14, 14, 182, 48, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text(`AVIPDF SPLIT & EXTRACT — PAGE ${p} OF 8`, 22, 42);
                doc.setTextColor(40, 40, 40);
                doc.setFontSize(13);
                doc.text(`Page #${p}: Test Custom Page Ranges, Fixed Intervals, or Specific Page Extraction.`, 22, 88);
                doc.setDrawColor(r, g, b);
                doc.rect(14, 14, 182, 269);
            }
            const buf = doc.output('arraybuffer');
            splState.fileName = 'avipdf-8-page-handbook';
            if (splFilenameInput) splFilenameInput.value = 'avipdf-8-page-handbook-split';
            if (splFileMeta) splFileMeta.textContent = 'Loaded built-in 8-Page Demo PDF';
            splState.pdfBytes = new Uint8Array(buf);
            await initSplitDocument();
        });
    }

    // Dropzone Listeners
    splChooseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        splFileInput.click();
    });
    splDropzone.addEventListener('click', () => splFileInput.click());
    splFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            await loadPdfForSplit(e.target.files[0]);
            splFileInput.value = '';
        }
    });

    splDropzone.addEventListener('dragover', (e) => e.preventDefault());
    splDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            await loadPdfForSplit(e.dataTransfer.files[0]);
        }
    });

    window.addEventListener('load', () => {
        renderSplitRangesRows();
        updateSplitMethodUI();
    });

})();

