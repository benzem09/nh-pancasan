document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

    if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {
        status.innerText = "Menyiapkan mesin...";

        // --- LOGIKA 1: JIKA FILE ADALAH PDF ---
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                status.innerText = `Mengolah Hal ${pageNum}/${pdf.numPages} (High Accuracy)...`;

                const page = await pdf.getPage(pageNum);
                
                // POWER UP: Gunakan Scale 2.5 agar lekukan huruf Arab sangat tajam
                const viewport = page.getViewport({ scale: 4 });
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                // FILTER PENAJAMAN: Buat teks PDF menjadi Hitam-Putih pekat sebelum masuk AI
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                    const v = brightness < 180 ? 0 : 255; // Threshold ketat untuk teks bersih
                    data[i] = data[i+1] = data[i+2] = v;
                }
                ctx.putImageData(imgData, 0, 0);

                // PROSES OCR DENGAN MODE KITAB (ara+ind)
                const result = await Tesseract.recognize(canvas, "ara+ind", {
                    tessedit_pageseg_mode: "3", // Mode deteksi blok teks otomatis
                    logger: m => {
                        if (m.status === "recognizing text") {
                            status.innerText = `Hal ${pageNum}: Memindai ${Math.round(m.progress * 100)}%`;
                        }
                    }
                });

                const cleanPageText = formatArabicText(result.data.text);
                if (cleanPageText) {
                    textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + 
                                     `--- Hal ${pageNum} ---\n` + cleanPageText;
                    textarea.scrollTop = textarea.scrollHeight;
                }

                canvas.width = 0; canvas.height = 0;
                await new Promise(r => setTimeout(r, 100));
            }
            status.innerText = "✓ PDF Berhasil Discan!";
        } 
        
        // --- LOGIKA 2: JIKA FILE ADALAH GAMBAR (FOTO) ---
        else {
            status.innerText = "Menajamkan gambar...";
            const img = await loadImage(file);
            const canvas = preprocessImage(img); // Fungsi penajaman teks Arab

            status.innerText = "AI sedang membaca teks...";
            const result = await Tesseract.recognize(canvas, "ind+eng+ara", {
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = `Memindai: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const finalText = formatArabicText(result.data.text);
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + finalText;
            status.innerText = "✓ Gambar Berhasil Discan!";
            
            canvas.width = 0; canvas.height = 0;
        }

        textarea.scrollTop = textarea.scrollHeight;
        
    } catch (err) {
        console.error("Gagal:", err);
        status.innerText = "✗ Eror: " + err.message;
    } finally {
        e.target.value = "";
        setTimeout(() => { if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = false; }, 1500);
    }
});

// FUNGSI PEMBANTU: Memuat Gambar
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// FUNGSI PEMBANTU: Penajaman Teks (Adaptive Thresholding)
// Sangat penting untuk foto kitab yang ada bayangan/remang
function preprocessImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        // Jika piksel gelap (huruf), hitamkan pekat. Jika terang (kertas), putihkan bersih.
        const v = brightness < 140 ? 0 : 255;
        data[i] = data[i+1] = data[i+2] = v;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// FUNGSI PEMBANTU: Merapikan Teks Arab
function formatArabicText(text) {
    if (!text) return "";
    return text.trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Hapus hidden formatting
        .replace(/[`’'‘”"“■\-|~<>\[\]\{\}\\\/]+/g, "") // Hapus karakter sampah
        .replace(/[ ]{2,}/g, " ") // Rapikan spasi
        .replace(/\n{3,}/g, "\n\n"); // Rapikan baris
}
