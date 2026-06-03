// Menentukan Worker path PDF.js secara eksplisit agar tidak crash (Wajib untuk PDF.js v3+)
if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener("change", async (e) => {
    if (e.target.id !== "pdfFile") return;

    const file = e.target.files[0];
    
    // JIKA USER BATAL MEMILIH FILE
    if (!file) {
        FILE_PICKER_ACTIVE = false; // Lepas kunci perlindungan
        return;
    }

    // Pastikan proteksi tetap aktif selama proses berjalan
    FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    status.innerText = "Membaca file PDF...";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let finalText = "";

        status.innerText = `Terdeteksi ${pdf.numPages} halaman. Memulai OCR...`;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            status.innerText = `Memproses Halaman ${pageNum}/${pdf.numPages}...`;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            const result = await Tesseract.recognize(canvas, "ind+eng+ara");

            if (result.data && result.data.text) {
                finalText += "\n\n" + result.data.text.trim();
            }
            
            canvas.width = 0;
            canvas.height = 0;
        }

        if (finalText.trim()) {
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + finalText.trim();
            status.innerText = "✓ Scan PDF Selesai!";
        } else {
            status.innerText = "⚠ PDF selesai dibaca, namun teks kosong.";
        }

    } catch (err) {
        console.error("Error OCR PDF:", err);
        status.innerText = "✗ PDF gagal diproses: " + err.message;
    } finally {
        e.target.value = "";
        // Beri jeda 1,5 detik sebelum mematikan proteksi reload halaman demi keamanan browser HP
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; 
        }, 1500);
    }
});