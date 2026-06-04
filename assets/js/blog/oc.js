document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) {
        if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = false;
        return;
    }

    if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {
        status.innerText = "Memulai...";

        // =====================================
        // LOGIKA PDF (Real-time per Halaman)
        // =====================================
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                status.innerText = `Memproses Hal ${pageNum}/${pdf.numPages}...`;

                const page = await pdf.getPage(pageNum);
                // Gunakan scale 1.5 (Seimbang antara kecepatan & akurasi Arab)
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                // LANGSUNG SCAN & MASUKKAN TEKS
                const result = await Tesseract.recognize(canvas, "ara+ind");
                const cleanPageText = formatArabicText(result.data.text);

                if (cleanPageText) {
                    // Masukkan teks halaman ini ke textarea SEKARANG juga
                    textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + 
                                     `--- Halaman ${pageNum} ---\n` + cleanPageText;
                    textarea.scrollTop = textarea.scrollHeight;
                }

                // Hancurkan canvas agar RAM HP tidak penuh
                canvas.width = 0; canvas.height = 0;
                
                // Beri jeda 100ms agar browser bisa "napas"
                await new Promise(r => setTimeout(r, 100));
            }
            status.innerText = "✓ Semua Halaman Selesai!";
        } 
        
        // =====================================
        // LOGIKA GAMBAR (Foto Kitab)
        // =====================================
        else {
            status.innerText = "Menajamkan gambar...";
            const img = await loadImage(file);
            const canvas = preprocessImage(img);

            status.innerText = "Membaca teks...";
            const result = await Tesseract.recognize(canvas, "ara+ind", {
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = `Scan: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const finalText = formatArabicText(result.data.text);
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + finalText;
            textarea.scrollTop = textarea.scrollHeight;
            status.innerText = "✓ Gambar Berhasil!";
            
            canvas.width = 0; canvas.height = 0;
        }

    } catch (err) {
        console.error("Gagal:", err);
        status.innerText = "✗ Eror: " + err.message;
    } finally {
        e.target.value = "";
        setTimeout(() => { if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = false; }, 1500);
        setTimeout(() => { status.innerText = ""; }, 5000);
    }
});

// --- FUNGSI PENDUKUNG ---

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function preprocessImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // Batasi ukuran gambar agar loading tidak lama
    const maxDim = 2000;
    let width = img.width;
    let height = img.height;

    if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width *= ratio;
        height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Filter Hitam Putih untuk mempercepat AI membaca
    for (let i = 0; i < data.length; i += 4) {
        const v = (0.3 * data[i] + 0.59 * data[i+1] + 0.11 * data[i+2]) < 128 ? 0 : 255;
        data[i] = data[i+1] = data[i+2] = v;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function formatArabicText(text) {
    if (!text) return "";
    return text.trim()
        .replace(/[`’'‘”"“■\-|~<>\[\]\{\}\\\/]+/g, "")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n");
}

