/**
 * =====================================================================
 * AviPdf - Module 4: Merge PDF Files (Combine PDFs)
 * High-Speed Lossless PDF Merging Engine via pdf-lib
 * =====================================================================
 */

(function () {
    'use strict';

    const mrgFiles = [];

    // DOM Elements
    const mrgDropzone = document.getElementById('mrgDropzone');
    const mrgChooseBtn = document.getElementById('mrgChooseBtn');
    const mrgLoadDemoBtn = document.getElementById('mrgLoadDemoBtn');
    const mrgFileInput = document.getElementById('mrgFileInput');
    const mrgToolbar = document.getElementById('mrgToolbar');
    const mrgCountBadge = document.getElementById('mrgCountBadge');
    const mrgTotalPagesBadge = document.getElementById('mrgTotalPagesBadge');
    const mrgSortAzBtn = document.getElementById('mrgSortAzBtn');
    const mrgClearBtn = document.getElementById('mrgClearBtn');
    const mrgList = document.getElementById('mrgList');
    const mrgEmpty = document.getElementById('mrgEmpty');
    const mrgExportBtn = document.getElementById('mrgExportBtn');
    const mrgFilename = document.getElementById('mrgFilename');

    if (!mrgDropzone || !mrgFileInput) return;

    async function addPdfFilesToMerge(fileList) {
        let added = 0;
        for (const file of fileList) {
            try {
                const buf = await file.arrayBuffer();
                const bytes = new Uint8Array(buf);
                const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
                mrgFiles.push({
                    id: 'mrg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    name: file.name,
                    size: file.size,
                    numPages: doc.numPages,
                    bytes,
                    doc
                });
                added++;
            } catch (err) {
                console.error('Error loading PDF for merge:', err);
            }
        }
        if (added > 0) {
            renderMrgList();
            window.showToast(`Added ${added} PDF file(s) to Merge queue.`, 'success');
        }
    }

    function renderMrgList() {
        if (!mrgList) return;

        if (mrgFiles.length === 0) {
            if (mrgEmpty) mrgEmpty.classList.remove('hidden');
            if (mrgToolbar) {
                mrgToolbar.classList.add('hidden');
                mrgToolbar.classList.remove('flex');
            }
            mrgList.innerHTML = '';
            if (mrgExportBtn) mrgExportBtn.disabled = true;
            return;
        }

        if (mrgEmpty) mrgEmpty.classList.add('hidden');
        if (mrgToolbar) {
            mrgToolbar.classList.remove('hidden');
            mrgToolbar.classList.add('flex');
        }
        if (mrgExportBtn) mrgExportBtn.disabled = false;

        const totalP = mrgFiles.reduce((acc, f) => acc + f.numPages, 0);
        if (mrgCountBadge) mrgCountBadge.textContent = `${mrgFiles.length} PDF ${mrgFiles.length === 1 ? 'File' : 'Files'}`;
        if (mrgTotalPagesBadge) mrgTotalPagesBadge.textContent = `${totalP} Total Pages`;

        mrgList.innerHTML = mrgFiles.map((f, i) => `
            <div class="bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 hover:border-avi-400 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm transition">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="w-7 h-7 rounded-lg bg-teal-500/15 dark:bg-avi-500/20 text-teal-700 dark:text-avi-400 text-xs font-extrabold flex items-center justify-center shrink-0">
                        ${i + 1}
                    </span>
                    <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">${window.escapeHtml(f.name)}</div>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400">${f.numPages} ${f.numPages === 1 ? 'page' : 'pages'} • ${window.formatBytes(f.size)}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="window.AviPdf.moveMrgFile(${i}, -1)" ${i === 0 ? 'disabled' : ''} class="p-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-700 hover:bg-slate-200 disabled:opacity-30 text-slate-700 dark:text-slate-200 text-xs font-bold" title="Move Up">&uarr;</button>
                    <button type="button" onclick="window.AviPdf.moveMrgFile(${i}, 1)" ${i === mrgFiles.length - 1 ? 'disabled' : ''} class="p-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-700 hover:bg-slate-200 disabled:opacity-30 text-slate-700 dark:text-slate-200 text-xs font-bold" title="Move Down">&darr;</button>
                    <button type="button" onclick="window.AviPdf.removeMrgFile(${i})" class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold transition">Remove</button>
                </div>
            </div>
        `).join('');
    }

    window.AviPdf.moveMrgFile = function (idx, dir) {
        const target = idx + dir;
        if (target < 0 || target >= mrgFiles.length) return;
        const temp = mrgFiles[idx];
        mrgFiles[idx] = mrgFiles[target];
        mrgFiles[target] = temp;
        renderMrgList();
    };
    window.moveMrgFile = window.AviPdf.moveMrgFile;

    window.AviPdf.removeMrgFile = function (idx) {
        mrgFiles.splice(idx, 1);
        renderMrgList();
    };
    window.removeMrgFile = window.AviPdf.removeMrgFile;

    if (mrgSortAzBtn) {
        mrgSortAzBtn.addEventListener('click', () => {
            mrgFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            renderMrgList();
        });
    }

    if (mrgClearBtn) {
        mrgClearBtn.addEventListener('click', () => {
            mrgFiles.length = 0;
            renderMrgList();
        });
    }

    // Merge Button Event Handler (Lossless pdf-lib)
    if (mrgExportBtn) {
        mrgExportBtn.addEventListener('click', async () => {
            if (mrgFiles.length === 0) return;
            if (!window.PDFLib) {
                window.showToast('pdf-lib library not loaded.', 'error');
                return;
            }

            mrgExportBtn.disabled = true;
            const origText = mrgExportBtn.innerHTML;
            mrgExportBtn.textContent = 'Merging PDFs Losslessly...';

            try {
                const { PDFDocument } = window.PDFLib;
                const mergedPdf = await PDFDocument.create();

                for (const item of mrgFiles) {
                    const srcDoc = await PDFDocument.load(item.bytes);
                    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }

                const mergedBytes = await mergedPdf.save();
                const blob = new Blob([mergedBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const out = ((mrgFilename && mrgFilename.value.trim()) || 'avipdf-merged-document').replace(/\.pdf$/i, '') + '.pdf';
                a.download = out;
                a.click();
                URL.revokeObjectURL(url);
                window.showToast(`Successfully merged ${mrgFiles.length} PDFs into "${out}"!`, 'success');
            } catch (e) {
                console.error('Merge error:', e);
                window.showToast('Error merging PDFs.', 'error');
            } finally {
                mrgExportBtn.disabled = false;
                mrgExportBtn.innerHTML = origText;
            }
        });
    }

    // Demo Multi-file PDFs Generator
    if (mrgLoadDemoBtn) {
        mrgLoadDemoBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!window.jspdf || !window.jspdf.jsPDF) {
                window.showToast('jsPDF library not available.', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const demos = [
                { name: '01-Cover-And-Overview.pdf', pages: 2, color: [13, 148, 136] },
                { name: '02-Financial-Statements.pdf', pages: 3, color: [234, 88, 12] },
                { name: '03-Appendix-Charts.pdf', pages: 2, color: [79, 70, 229] }
            ];

            for (const d of demos) {
                const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                for (let p = 1; p <= d.pages; p++) {
                    if (p > 1) doc.addPage('a4', 'p');
                    doc.setFillColor(...d.color);
                    doc.rect(15, 15, 180, 45, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.text(`${d.name} — Page ${p} of ${d.pages}`, 24, 42);
                    doc.setTextColor(50, 50, 50);
                    doc.setFontSize(12);
                    doc.text(`This demo document will be merged in order by AviPdf Local Converter.`, 24, 85);
                }
                const buf = doc.output('arraybuffer');
                const bytes = new Uint8Array(buf);
                const pdfDoc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
                mrgFiles.push({
                    id: 'mrg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    name: d.name,
                    size: bytes.byteLength,
                    numPages: d.pages,
                    bytes,
                    doc: pdfDoc
                });
            }
            renderMrgList();
            window.showToast('Loaded 3 Demo PDFs! Reorder them or click Merge & Download.', 'info');
        });
    }

    // Dropzone listeners
    mrgChooseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mrgFileInput.click();
    });
    mrgDropzone.addEventListener('click', () => mrgFileInput.click());
    mrgFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            await addPdfFilesToMerge(e.target.files);
            mrgFileInput.value = '';
        }
    });

    mrgDropzone.addEventListener('dragover', (e) => e.preventDefault());
    mrgDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            await addPdfFilesToMerge(e.dataTransfer.files);
        }
    });

})();

