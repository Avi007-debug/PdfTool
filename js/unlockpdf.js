/**
 * =====================================================================
 * AviPdf - Module 3: Unlock PDF (Known Password Decryption)
 * 100% Offline Client-Side Password Removal & Unencrypted PDF Export
 * =====================================================================
 */

(function () {
    'use strict';

    const unlState = {
        pdfBytes: null,
        pdfDoc: null,
        fileName: 'document',
        scale: 2,
        isUnlocked: false
    };

    // DOM Elements
    const unlDropzone = document.getElementById('unlDropzone');
    const unlChooseBtn = document.getElementById('unlChooseBtn');
    const unlFileInput = document.getElementById('unlFileInput');
    const unlFileSubtext = document.getElementById('unlFileSubtext');
    const unlPasswordInput = document.getElementById('unlPasswordInput');
    const unlTogglePwdBtn = document.getElementById('unlTogglePwdBtn');
    const unlPasswordFeedback = document.getElementById('unlPasswordFeedback');
    const unlVerifyBtn = document.getElementById('unlVerifyBtn');
    const unlStatusBadge = document.getElementById('unlStatusBadge');
    const unlFilenameInput = document.getElementById('unlFilenameInput');
    const unlExportBtn = document.getElementById('unlExportBtn');
    const unlPreviewSection = document.getElementById('unlPreviewSection');
    const unlPreviewGrid = document.getElementById('unlPreviewGrid');
    const unlPageCountBadge = document.getElementById('unlPageCountBadge');
    const unlProgressBox = document.getElementById('unlProgressBox');
    const unlProgressStatus = document.getElementById('unlProgressStatus');
    const unlProgressPct = document.getElementById('unlProgressPct');
    const unlProgressBar = document.getElementById('unlProgressBar');

    if (!unlDropzone || !unlFileInput) return;

    if (unlTogglePwdBtn && unlPasswordInput) {
        unlTogglePwdBtn.addEventListener('click', () => {
            const isPwd = unlPasswordInput.type === 'password';
            unlPasswordInput.type = isPwd ? 'text' : 'password';
            unlTogglePwdBtn.textContent = isPwd ? 'Hide' : 'Show';
        });
    }

    async function handleUnlockFileUpload(file) {
        const baseName = file.name.replace(/\.pdf$/i, '') || 'document';
        unlState.fileName = baseName;
        if (unlFilenameInput) unlFilenameInput.value = `${baseName}-unlocked`;
        if (unlFileSubtext) unlFileSubtext.textContent = `Selected: ${file.name} (${window.formatBytes(file.size)})`;

        const buf = await file.arrayBuffer();
        unlState.pdfBytes = new Uint8Array(buf);
        if (unlVerifyBtn) unlVerifyBtn.disabled = false;

        const pwd = unlPasswordInput ? unlPasswordInput.value : '';
        await attemptUnlockPdf(pwd);
    }

    async function attemptUnlockPdf(password = '') {
        if (!unlState.pdfBytes) return;
        try {
            const loadingTask = pdfjsLib.getDocument({
                data: unlState.pdfBytes.slice(),
                password: password || undefined
            });
            const pdfDoc = await loadingTask.promise;
            unlState.pdfDoc = pdfDoc;
            unlState.isUnlocked = true;

            if (unlStatusBadge) {
                unlStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
                unlStatusBadge.textContent = 'Unlocked & Verified';
            }
            if (unlPasswordFeedback) {
                unlPasswordFeedback.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold';
                unlPasswordFeedback.textContent = password
                    ? 'Password verified! Ready to save an unencrypted copy.'
                    : 'Document opened cleanly! Ready to save an unencrypted copy.';
            }

            if (unlExportBtn) unlExportBtn.disabled = false;
            await renderUnlockedPreviews(pdfDoc);
            window.showToast('PDF unlocked! Click "Save Unlocked PDF Copy" to export.', 'success');
        } catch (err) {
            unlState.isUnlocked = false;
            if (unlExportBtn) unlExportBtn.disabled = true;
            if (unlPreviewSection) unlPreviewSection.classList.add('hidden');

            if (err && err.name === 'PasswordException') {
                if (unlStatusBadge) {
                    unlStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300';
                    unlStatusBadge.textContent = 'Password Required';
                }
                if (unlPasswordFeedback) {
                    unlPasswordFeedback.className = 'text-[11px] text-amber-600 dark:text-amber-400 font-semibold';
                    unlPasswordFeedback.textContent = password
                        ? 'Incorrect password. Please enter the known password for this PDF.'
                        : 'This PDF is password-protected. Enter its password above and click Verify.';
                }
                if (unlPasswordInput) unlPasswordInput.focus();
            } else {
                console.error(err);
                window.showToast('Failed to parse PDF document.', 'error');
            }
        }
    }

    if (unlVerifyBtn && unlPasswordInput) {
        unlVerifyBtn.addEventListener('click', () => attemptUnlockPdf(unlPasswordInput.value));
        unlPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') attemptUnlockPdf(unlPasswordInput.value);
        });
    }

    async function renderUnlockedPreviews(pdfDoc) {
        if (!unlPreviewSection || !unlPreviewGrid) return;
        unlPreviewSection.classList.remove('hidden');
        if (unlPageCountBadge) {
            unlPageCountBadge.textContent = `${pdfDoc.numPages} ${pdfDoc.numPages === 1 ? 'Page' : 'Pages'}`;
        }
        unlPreviewGrid.innerHTML = '';

        const previewLimit = Math.min(pdfDoc.numPages, 6);
        for (let p = 1; p <= previewLimit; p++) {
            const page = await pdfDoc.getPage(p);
            const viewport = page.getViewport({ scale: 0.8 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;

            const card = document.createElement('div');
            card.className = 'bg-slate-50 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-700 rounded-xl p-2.5 flex flex-col items-center gap-2';
            card.innerHTML = `
                <div class="text-[11px] font-bold text-slate-600 dark:text-slate-300">Page ${p}</div>
                <img src="${canvas.toDataURL('image/jpeg', 0.85)}" class="max-h-40 object-contain rounded paper-shadow" alt="Unlocked Page ${p}">
            `;
            unlPreviewGrid.appendChild(card);
        }
    }

    if (unlExportBtn) {
        unlExportBtn.addEventListener('click', async () => {
            if (!unlState.pdfDoc || !unlState.isUnlocked) return;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                window.showToast('jsPDF library not available.', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const total = unlState.pdfDoc.numPages;
            unlExportBtn.disabled = true;
            if (unlProgressBox) unlProgressBox.classList.remove('hidden');

            try {
                let cleanPdf = null;
                for (let p = 1; p <= total; p++) {
                    const pct = Math.round((p / total) * 100);
                    if (unlProgressStatus) unlProgressStatus.textContent = `Rebuilding unlocked page ${p} of ${total}...`;
                    if (unlProgressPct) unlProgressPct.textContent = `${pct}%`;
                    if (unlProgressBar) unlProgressBar.style.width = `${pct}%`;

                    const page = await unlState.pdfDoc.getPage(p);
                    const baseViewport = page.getViewport({ scale: 1 });
                    const renderViewport = page.getViewport({ scale: unlState.scale });

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(renderViewport.width);
                    canvas.height = Math.round(renderViewport.height);
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
                    const pageImgData = canvas.toDataURL('image/jpeg', 0.94);

                    const ptW = baseViewport.width;
                    const ptH = baseViewport.height;
                    const orientation = ptW > ptH ? 'l' : 'p';

                    if (p === 1) {
                        cleanPdf = new jsPDF({ orientation, unit: 'pt', format: [ptW, ptH], compress: true });
                    } else {
                        cleanPdf.addPage([ptW, ptH], orientation);
                    }
                    cleanPdf.addImage(pageImgData, 'JPEG', 0, 0, ptW, ptH, undefined, 'FAST');
                }

                let outName = (unlFilenameInput && unlFilenameInput.value.trim()) || 'unlocked-document';
                outName = outName.replace(/\.pdf$/i, '');
                cleanPdf.save(`${outName}.pdf`);
                window.showToast(`Saved password-free PDF "${outName}.pdf"!`, 'success');
            } catch (err) {
                console.error('Error exporting unlocked PDF:', err);
                window.showToast('Error while creating unlocked PDF.', 'error');
            } finally {
                setTimeout(() => {
                    if (unlProgressBox) unlProgressBox.classList.add('hidden');
                    if (unlExportBtn) unlExportBtn.disabled = false;
                }, 500);
            }
        });
    }

    // Resolution button listeners
    document.querySelectorAll('#unlScaleGroup .unl-scale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            unlState.scale = parseFloat(btn.dataset.scale);
            document.querySelectorAll('#unlScaleGroup .unl-scale-btn').forEach(b => {
                const active = parseFloat(b.dataset.scale) === unlState.scale;
                b.className = active
                    ? 'unl-scale-btn px-3 py-2 rounded-xl border text-xs font-bold transition bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300'
                    : 'unl-scale-btn px-3 py-2 rounded-xl border text-xs font-semibold transition bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400';
            });
        });
    });

    // Dropzone listeners
    unlChooseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlFileInput.click();
    });
    unlDropzone.addEventListener('click', () => unlFileInput.click());
    unlFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            await handleUnlockFileUpload(e.target.files[0]);
            unlFileInput.value = '';
        }
    });

    unlDropzone.addEventListener('dragover', (e) => e.preventDefault());
    unlDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            await handleUnlockFileUpload(e.dataTransfer.files[0]);
        }
    });

})();

