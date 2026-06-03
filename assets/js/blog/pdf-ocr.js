// Menentukan Worker path PDF.js secara eksplisit agar tidak crash (Wajib untuk PDF.js v3+)
if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener("change", async (e) => {
    if (e.target.id !== "pdfFile") return;

    const file = e.target.files[0];
    if (!file) {
        FILE_PICKER_ACTIVE = false;
        return;
    }

    FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    status.innerText = "Membaca file PDF...";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        status.innerText = `Terdeteksi ${pdf.numPages} halaman. Menyiapkan sistem...`;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            status.innerText = `Mengoptimalkan Halaman ${pageNum}/${pdf.numPages}...`;

            const page = await pdf.getPage(pageNum);
            
            // Menggunakan scale 1.3 (Rasio emas ketajaman teks vs Kecepatan RAM di HP)
            const viewport = page.getViewport({ scale: 1.3 });
            
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // --- FILTER PENJERNIHAN PIKSEL DOKUMEN ---
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                // Buat teks abu-abu pudar menjadi hitam tegas, dan background menjadi putih mutlak
                const threshold = brightness < 140 ? brightness * 0.5 : 255;
                data[i] = threshold;
                data[i + 1] = threshold;
                data[i + 2] = threshold;
            }
            ctx.putImageData(imgData, 0, 0);
            // -----------------------------------------

            status.innerText = `Memindai Halaman ${pageNum}/${pdf.numPages}...`;
            const result = await Tesseract.recognize(canvas, "ind+eng+ara");

            if (result.data && result.data.text.trim()) {
                // PEMBERSIHAN ADVANCED: Menepis bintik pemindaian ilegal
                const scannedText = result.data.text.trim()
                    .replace(/[`’'‘”"“_■\-|~]+/g, '')
                    .replace(/\n{3,}/g, '\n\n');
                
                if (scannedText.length > 2) {
                    textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + scannedText;
                    textarea.scrollTop = textarea.scrollHeight;
                }
            }
            
            // Bersihkan memori canvas halaman aktif
            canvas.width = 0;
            canvas.height = 0;

            // Jeda istirahat 300 milidetik agar CPU handphone tidak overheat/stuck
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        status.innerText = "✓ Scan PDF Selesai & Dijernihkan!";

    } catch (err) {
        console.error("Error OCR PDF:", err);
        status.innerText = "✗ PDF gagal diproses: " + err.message;
    } finally {
        e.target.value = "";
        
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; 
        }, 1500);

        setTimeout(() => {
            if (status.innerText.includes("Selesai") || status.innerText.includes("gagal")) {
                status.innerText = "";
            }
        }, 5000);
    }
});