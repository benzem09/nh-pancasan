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

        status.innerText = `Terdeteksi ${pdf.numPages} halaman. Memulai OCR...`;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            status.innerText = `Memproses Halaman ${pageNum}/${pdf.numPages}...`;

            const page = await pdf.getPage(pageNum);
            
            // Gunakan scale 1.2 untuk dokumen banyak halaman agar super ringan & cepat di HP
            const viewport = page.getViewport({ scale: 1.2 });
            
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Proses scan halaman aktif
            const result = await Tesseract.recognize(canvas, "ind+eng+ara");

            if (result.data && result.data.text.trim()) {
                const scannedText = result.data.text.trim();
                
                // LANGSUNG MASUKKAN TEKS PER HALAMAN KE TEXTAREA (Real-time)
                textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + scannedText;
                
                // Otomatis scroll textarea ke bagian paling bawah agar Anda bisa melihat teks baru masuk
                textarea.scrollTop = textarea.scrollHeight;
            }
            
            // Hancurkan objek gambar dari RAM segera setelah halaman ini selesai
            canvas.width = 0;
            canvas.height = 0;
        }

        status.innerText = "✓ Scan PDF Selesai!";

    } catch (err) {
        console.error("Error OCR PDF:", err);
        status.innerText = "✗ PDF gagal diproses: " + err.message;
    } finally {
        e.target.value = "";
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; 
        }, 1500);
    }
});
