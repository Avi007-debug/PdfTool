/**
 * =====================================================================
 * AviPdf - Module 1: JPG / PNG / WEBP to PDF Converter
 * Drag & Drop, SortableJS Reordering, Rotation, Margins & Canvas Engine
 * =====================================================================
 */

(function () {
    'use strict';

    // State
    const state = {
        images: [], // Array of { id, name, size, dataUrl, width, height, rotation }
        pageSize: 'a4-portrait', // 'a4-portrait' | 'a4-landscape' | 'original'
        margin: 'none',          // 'none' | 'small' | 'normal'
        fit: 'contain',          // 'contain' | 'cover'
        quality: 0.92,
        isGenerating: false
    };

    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const chooseFilesBtn = document.getElementById('chooseFilesBtn');
    const fileInput = document.getElementById('fileInput');
    const imageGrid = document.getElementById('imageGrid');
    const emptyState = document.getElementById('emptyState');
    const gridToolbar = document.getElementById('gridToolbar');
    const imageCountBadge = document.getElementById('imageCountBadge');
    const totalSizeBadge = document.getElementById('totalSizeBadge');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const sortNameBtn = document.getElementById('sortNameBtn');
    const reverseOrderBtn = document.getElementById('reverseOrderBtn');
    const loadDemoBtn = document.getElementById('loadDemoBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const filenameInput = document.getElementById('filenameInput');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercent = document.getElementById('progressPercent');
    const fitSection = document.getElementById('fitSection');
    const marginHint = document.getElementById('marginHint');
    const fitHint = document.getElementById('fitHint');

    if (!dropzone || !fileInput) return;

    // Initialize SortableJS for Touch & Mouse Drag-and-Drop
    let sortableInstance = null;
    function initSortable() {
        if (typeof Sortable !== 'undefined' && imageGrid) {
            sortableInstance = new Sortable(imageGrid, {
                animation: 180,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                handle: '.drag-area',
                onEnd: function (evt) {
                    if (evt.oldIndex === evt.newIndex) return;
                    const movedItem = state.images.splice(evt.oldIndex, 1)[0];
                    state.images.splice(evt.newIndex, 0, movedItem);
                    updatePageNumbers();
                }
            });
        }
    }

    // Settings Buttons UI updater
    function updateSettingButtonsUI() {
        document.querySelectorAll('#pageSizeGroup .setting-btn').forEach(btn => {
            toggleButtonActiveStyle(btn, btn.dataset.size === state.pageSize);
        });
        document.querySelectorAll('#marginGroup .setting-btn').forEach(btn => {
            toggleButtonActiveStyle(btn, btn.dataset.margin === state.margin);
        });
        document.querySelectorAll('#fitGroup .setting-btn').forEach(btn => {
            toggleButtonActiveStyle(btn, btn.dataset.fit === state.fit);
        });

        const marginMap = { none: '0 mm (Edge-to-edge)', small: '10 mm border', normal: '20 mm border' };
        if (marginHint) marginHint.textContent = marginMap[state.margin] || '0 mm';

        if (fitSection && fitHint) {
            if (state.pageSize === 'original') {
                fitSection.classList.add('opacity-40', 'pointer-events-none');
                fitHint.textContent = 'Auto-matched to image';
            } else {
                fitSection.classList.remove('opacity-40', 'pointer-events-none');
                fitHint.textContent = state.fit === 'contain' ? 'Full image visible' : 'Fills page area';
            }
        }

        renderGrid();
    }

    function toggleButtonActiveStyle(btn, isActive) {
        if (isActive) {
            btn.className = 'setting-btn px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition bg-orange-500/15 dark:bg-avi-500/20 border-avi-500 text-avi-700 dark:text-avi-300 shadow-sm';
        } else {
            btn.className = 'setting-btn px-2.5 py-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition bg-slate-50 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-700 text-slate-600 dark:text-slate-400 hover:border-avi-400';
        }
    }

    // Read File as Image object
    function readFileAsImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
                        name: file.name,
                        size: file.size,
                        dataUrl: dataUrl,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        rotation: 0
                    });
                };
                img.onerror = reject;
                img.src = dataUrl;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Handle Uploaded Files
    async function handleFiles(fileList) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const files = Array.from(fileList).filter(file => {
            return validTypes.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
        });

        if (files.length === 0) {
            window.showToast('Please select valid JPG, PNG, or WEBP image files.', 'error');
            return;
        }

        let addedCount = 0;
        for (const file of files) {
            try {
                const imgData = await readFileAsImage(file);
                state.images.push(imgData);
                addedCount++;
            } catch (err) {
                console.error('Error reading image:', file.name, err);
            }
        }

        if (addedCount > 0) {
            renderGrid();
            window.showToast(`Added ${addedCount} image${addedCount > 1 ? 's' : ''}.`, 'success');
        }
    }

    // Render Preview Cards Grid
    function renderGrid() {
        const count = state.images.length;
        if (count === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (gridToolbar) {
                gridToolbar.classList.add('hidden');
                gridToolbar.classList.remove('flex');
            }
            if (imageGrid) imageGrid.innerHTML = '';
            if (exportPdfBtn) exportPdfBtn.disabled = true;
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (gridToolbar) {
            gridToolbar.classList.remove('hidden');
            gridToolbar.classList.add('flex');
        }
        if (exportPdfBtn) exportPdfBtn.disabled = state.isGenerating;

        if (imageCountBadge) imageCountBadge.textContent = `${count} ${count === 1 ? 'Page' : 'Pages'}`;
        const totalBytes = state.images.reduce((acc, item) => acc + (item.size || 0), 0);
        if (totalSizeBadge) totalSizeBadge.textContent = window.formatBytes(totalBytes);

        let pageAspectClass = 'aspect-[210/297]';
        if (state.pageSize === 'a4-landscape') {
            pageAspectClass = 'aspect-[297/210]';
        } else if (state.pageSize === 'original') {
            pageAspectClass = 'aspect-square';
        }

        const padMap = { none: 'p-0', small: 'p-2.5', normal: 'p-5' };
        const sheetPaddingClass = padMap[state.margin] || 'p-0';
        const imgFitClass = (state.pageSize === 'original' || state.fit === 'contain') ? 'object-contain' : 'object-cover';

        if (imageGrid) {
            imageGrid.innerHTML = state.images.map((item, idx) => {
                const isRotatedOdd = (item.rotation % 180) !== 0;
                const displayW = isRotatedOdd ? item.height : item.width;
                const displayH = isRotatedOdd ? item.width : item.height;

                return `
                <div class="group relative bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-obsidian-700 hover:border-avi-400 dark:hover:border-avi-500 rounded-2xl p-3 flex flex-col gap-2.5 transition shadow-sm" data-id="${item.id}">
                    <div class="flex items-center justify-between gap-1">
                        <span class="page-badge inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-500/15 dark:bg-avi-500/20 text-avi-700 dark:text-avi-300">
                            Page ${idx + 1}
                        </span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="window.AviPdf.rotateImage('${item.id}')" class="p-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-700 hover:bg-avi-500 hover:text-white text-slate-600 dark:text-slate-300 transition" title="Rotate 90°">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                            </button>
                            <button type="button" onclick="window.AviPdf.removeImage('${item.id}')" class="p-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-700 hover:bg-rose-500 hover:text-white text-slate-500 transition" title="Remove">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="drag-area cursor-grab active:cursor-grabbing bg-slate-100 dark:bg-obsidian-900 rounded-xl p-3 flex items-center justify-center h-44 sm:h-48 overflow-hidden">
                        <div class="bg-white paper-shadow transition-all duration-200 ${pageAspectClass} ${sheetPaddingClass} max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-[2px]">
                            <img src="${item.dataUrl}" alt="${window.escapeHtml(item.name)}" 
                                 style="transform: rotate(${item.rotation}deg);"
                                 class="w-full h-full ${imgFitClass} transition-transform duration-200 select-none pointer-events-none">
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                        <span class="font-semibold text-slate-700 dark:text-slate-300 truncate" title="${window.escapeHtml(item.name)}">
                            ${window.escapeHtml(item.name)}
                        </span>
                        <span class="text-slate-500 font-mono shrink-0 bg-slate-100 dark:bg-obsidian-900 px-1.5 py-0.5 rounded">
                            ${displayW}&times;${displayH}
                        </span>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    function updatePageNumbers() {
        if (!imageGrid) return;
        const badges = imageGrid.querySelectorAll('.page-badge');
        badges.forEach((badge, index) => {
            badge.textContent = `Page ${index + 1}`;
        });
    }

    // Window-accessible handlers for inline onclicks
    window.AviPdf.rotateImage = function (id) {
        const item = state.images.find(img => img.id === id);
        if (item) {
            item.rotation = (item.rotation + 90) % 360;
            renderGrid();
        }
    };
    window.rotateImage = window.AviPdf.rotateImage;

    window.AviPdf.removeImage = function (id) {
        state.images = state.images.filter(img => img.id !== id);
        renderGrid();
    };
    window.removeImage = window.AviPdf.removeImage;

    // Render image to canvas respecting rotation and margins
    function renderImageForPdfPage(item, targetW_mm, targetH_mm, margin_mm, fitMode, isOriginalMode, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const isRotatedOdd = (item.rotation % 180) !== 0;
                const rotW = isRotatedOdd ? img.naturalHeight : img.naturalWidth;
                const rotH = isRotatedOdd ? img.naturalWidth : img.naturalHeight;

                const rotCanvas = document.createElement('canvas');
                rotCanvas.width = rotW;
                rotCanvas.height = rotH;
                const rCtx = rotCanvas.getContext('2d');

                rCtx.fillStyle = '#FFFFFF';
                rCtx.fillRect(0, 0, rotW, rotH);

                rCtx.translate(rotW / 2, rotH / 2);
                rCtx.rotate((item.rotation * Math.PI) / 180);
                rCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

                if (isOriginalMode || fitMode === 'contain') {
                    resolve({
                        dataUrl: rotCanvas.toDataURL('image/jpeg', quality),
                        widthPx: rotW,
                        heightPx: rotH
                    });
                    return;
                }

                const printW_mm = Math.max(10, targetW_mm - margin_mm * 2);
                const printH_mm = Math.max(10, targetH_mm - margin_mm * 2);
                const targetAspect = printW_mm / printH_mm;
                const imgAspect = rotW / rotH;

                let cropW = rotW, cropH = rotH, cropX = 0, cropY = 0;
                if (imgAspect > targetAspect) {
                    cropW = Math.round(rotH * targetAspect);
                    cropX = Math.round((rotW - cropW) / 2);
                } else {
                    cropH = Math.round(rotW / targetAspect);
                    cropY = Math.round((rotH - cropH) / 2);
                }

                const coverCanvas = document.createElement('canvas');
                coverCanvas.width = cropW;
                coverCanvas.height = cropH;
                const cCtx = coverCanvas.getContext('2d');
                cCtx.fillStyle = '#FFFFFF';
                cCtx.fillRect(0, 0, cropW, cropH);
                cCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

                resolve({
                    dataUrl: coverCanvas.toDataURL('image/jpeg', quality),
                    widthPx: cropW,
                    heightPx: cropH
                });
            };
            img.onerror = reject;
            img.src = item.dataUrl;
        });
    }

    // Generate PDF Client-Side via jsPDF
    async function generatePdf() {
        if (state.images.length === 0 || state.isGenerating) return;
        if (!window.jspdf || !window.jspdf.jsPDF) {
            window.showToast('jsPDF library failed to initialize.', 'error');
            return;
        }

        state.isGenerating = true;
        if (exportPdfBtn) exportPdfBtn.disabled = true;
        if (progressContainer) progressContainer.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercent) progressPercent.textContent = '0%';

        const { jsPDF } = window.jspdf;
        const marginMap = { none: 0, small: 10, normal: 20 };
        const margin_mm = marginMap[state.margin] || 0;

        try {
            let pdf = null;
            const total = state.images.length;

            for (let i = 0; i < total; i++) {
                const item = state.images[i];
                const pct = Math.round((i / total) * 100);
                if (progressStatus) progressStatus.textContent = `Processing page ${i + 1} of ${total}...`;
                if (progressPercent) progressPercent.textContent = `${pct}%`;
                if (progressBar) progressBar.style.width = `${pct}%`;

                await new Promise(r => setTimeout(r, 15));

                if (state.pageSize === 'original') {
                    const processed = await renderImageForPdfPage(item, 0, 0, margin_mm, 'contain', true, state.quality);
                    const pxToMm = 0.264583;
                    const imgW_mm = processed.widthPx * pxToMm;
                    const imgH_mm = processed.heightPx * pxToMm;
                    const pageW_mm = imgW_mm + (margin_mm * 2);
                    const pageH_mm = imgH_mm + (margin_mm * 2);
                    const orientation = pageW_mm > pageH_mm ? 'l' : 'p';

                    if (i === 0) {
                        pdf = new jsPDF({ orientation, unit: 'mm', format: [pageW_mm, pageH_mm], compress: true });
                    } else {
                        pdf.addPage([pageW_mm, pageH_mm], orientation);
                    }
                    pdf.addImage(processed.dataUrl, 'JPEG', margin_mm, margin_mm, imgW_mm, imgH_mm, undefined, 'FAST');
                } else {
                    const isLandscape = state.pageSize === 'a4-landscape';
                    const orientation = isLandscape ? 'l' : 'p';
                    const pageW_mm = isLandscape ? 297 : 210;
                    const pageH_mm = isLandscape ? 210 : 297;

                    if (i === 0) {
                        pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
                    } else {
                        pdf.addPage('a4', orientation);
                    }

                    const processed = await renderImageForPdfPage(item, pageW_mm, pageH_mm, margin_mm, state.fit, false, state.quality);
                    const availW = pageW_mm - (margin_mm * 2);
                    const availH = pageH_mm - (margin_mm * 2);

                    if (state.fit === 'cover') {
                        pdf.addImage(processed.dataUrl, 'JPEG', margin_mm, margin_mm, availW, availH, undefined, 'FAST');
                    } else {
                        const imgRatio = processed.widthPx / processed.heightPx;
                        const boxRatio = availW / availH;
                        let drawW = availW, drawH = availH;
                        if (imgRatio > boxRatio) drawH = availW / imgRatio;
                        else drawW = availH * imgRatio;

                        const offsetX = margin_mm + (availW - drawW) / 2;
                        const offsetY = margin_mm + (availH - drawH) / 2;
                        pdf.addImage(processed.dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
                    }
                }
            }

            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';
            if (progressStatus) progressStatus.textContent = 'Saving PDF file...';

            let rawName = (filenameInput && filenameInput.value.trim()) || 'avipdf-merged';
            rawName = rawName.replace(/\.pdf$/i, '');
            const finalFilename = `${rawName}.pdf`;

            pdf.save(finalFilename);
            window.showToast(`Successfully exported "${finalFilename}"!`, 'success');
        } catch (err) {
            console.error('PDF Export Error:', err);
            window.showToast('An error occurred while creating the PDF.', 'error');
        } finally {
            setTimeout(() => {
                state.isGenerating = false;
                if (exportPdfBtn) exportPdfBtn.disabled = state.images.length === 0;
                if (progressContainer) progressContainer.classList.add('hidden');
            }, 600);
        }
    }

    // Demo Sample Images Generator
    function generateSampleImages(e) {
        if (e) e.stopPropagation();
        const samples = [
            { title: 'AviPdf Executive Cover', subtitle: '100% Offline Image to PDF Conversion', bg1: '#ea580c', bg2: '#e11d48', w: 1200, h: 1600 },
            { title: 'Architecture Diagram', subtitle: 'Zero Cloud Upload Pipeline', bg1: '#0d9488', bg2: '#0284c7', w: 1600, h: 1100 },
            { title: 'Annual Metrics Summary', subtitle: 'Ready for A4 or Original Export', bg1: '#7c3aed', bg2: '#4f46e5', w: 1200, h: 1500 }
        ];

        samples.forEach((s, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = s.w;
            canvas.height = s.h;
            const ctx = canvas.getContext('2d');

            const grad = ctx.createLinearGradient(0, 0, s.w, s.h);
            grad.addColorStop(0, s.bg1);
            grad.addColorStop(1, s.bg2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, s.w, s.h);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 8;
            ctx.strokeRect(50, 50, s.w - 100, s.h - 100);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Inter, sans-serif';
            ctx.fillText(`AVIPDF SAMPLE PAGE 0${index + 1}`, 110, 220);

            ctx.font = 'bold 52px Inter, sans-serif';
            ctx.fillText(s.title, 110, s.h / 2 - 20);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '400 36px Inter, sans-serif';
            ctx.fillText(s.subtitle, 110, s.h / 2 + 45);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const approxBytes = Math.round((dataUrl.length * 3) / 4);

            state.images.push({
                id: 'sample_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
                name: `avipdf-sample-0${index + 1}.jpg`,
                size: approxBytes,
                dataUrl: dataUrl,
                width: s.w,
                height: s.h,
                rotation: 0
            });
        });

        renderGrid();
        window.showToast('Loaded 3 sample pages! Drag cards to reorder or click Convert.', 'info');
    }

    // Event Listeners
    chooseFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
            fileInput.value = '';
        }
    });

    ['dragenter', 'dragover'].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('scale-[1.01]');
        });
    });

    ['dragleave', 'drop'].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('scale-[1.01]');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            state.images = [];
            renderGrid();
            window.showToast('Cleared all images.', 'info');
        });
    }

    if (sortNameBtn) {
        sortNameBtn.addEventListener('click', () => {
            state.images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            renderGrid();
            window.showToast('Sorted pages alphabetically.', 'info');
        });
    }

    if (reverseOrderBtn) {
        reverseOrderBtn.addEventListener('click', () => {
            state.images.reverse();
            renderGrid();
            window.showToast('Reversed page order.', 'info');
        });
    }

    if (loadDemoBtn) loadDemoBtn.addEventListener('click', generateSampleImages);

    document.querySelectorAll('#pageSizeGroup .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.pageSize = btn.dataset.size;
            updateSettingButtonsUI();
        });
    });

    document.querySelectorAll('#marginGroup .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.margin = btn.dataset.margin;
            updateSettingButtonsUI();
        });
    });

    document.querySelectorAll('#fitGroup .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.fit = btn.dataset.fit;
            updateSettingButtonsUI();
        });
    });

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            state.quality = val / 100;
            let label = 'Balanced';
            if (val >= 90) label = 'High';
            else if (val === 100) label = 'Maximum';
            else if (val < 70) label = 'Compact';
            if (qualityValue) qualityValue.textContent = `${val}% (${label})`;
        });
    }

    if (exportPdfBtn) exportPdfBtn.addEventListener('click', generatePdf);

    // Initial setup
    window.addEventListener('load', () => {
        initSortable();
        updateSettingButtonsUI();
    });

})();

