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
            const viewport = page.getViewport({ scale: 1.3 });
            
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // FILTER PERTAJAMAN HITAM PUTIH MUTLAK DOKUMEN PDF
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const v = brightness < 160 ? 0 : 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
            }
            ctx.putImageData(imgData, 0, 0);

            status.innerText = `Memindai Halaman ${pageNum}/${pdf.numPages}...`;
            const result = await Tesseract.recognize(canvas, "ind+eng+ara");

            if (result.data && result.data.text.trim()) {
                const scannedText = result.data.text.trim()
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    .replace(/[`’'‘”"Spacer“_■\-|~<>]+/g, '')
                    .replace(/\n{3,}/g, '\n\n');
                
                if (scannedText.length > 2) {
                    textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + scannedText;
                    textarea.scrollTop = textarea.scrollHeight;
                }
            }
            
            canvas.width = 0;
            canvas.height = 0;

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
