// Menentukan Worker path PDF.js secara eksplisit agar tidak crash (Wajib untuk PDF.js v3+)
if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener("change", async (e) => {
    if (e.target.id !== "pdfFile") return;

    const file = e.target.files[0];
    if (!file) {
        FILE_PICKER_ACTIVE = false; //[span_1](start_span)[span_1](end_span)
        return;
    }

    FILE_PICKER_ACTIVE = true; //[span_2](start_span)[span_2](end_span)

    const status = document.getElementById("ocrStatus"); //[span_3](start_span)[span_3](end_span)
    const textarea = document.getElementById("postContent"); //[span_4](start_span)[span_4](end_span)

    status.innerText = "Membaca file PDF..."; //[span_5](start_span)[span_5](end_span)

    try {
        const arrayBuffer = await file.arrayBuffer(); //[span_6](start_span)[span_6](end_span)
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; //[span_7](start_span)[span_7](end_span)

        status.innerText = `Terdeteksi ${pdf.numPages} halaman. Memulai OCR...`; //[span_8](start_span)[span_8](end_span)

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) { //[span_9](start_span)[span_9](end_span)
            status.innerText = `Memproses Halaman ${pageNum}/${pdf.numPages}...`; //[span_10](start_span)[span_10](end_span)

            const page = await pdf.getPage(pageNum); //[span_11](start_span)[span_11](end_span)
            
            // Gunakan scale 1.2 untuk dokumen banyak halaman agar super ringan & cepat di HP
            const viewport = page.getViewport({ scale: 1.2 }); //[span_12](start_span)[span_12](end_span)
            
            const canvas = document.createElement("canvas"); //[span_13](start_span)[span_13](end_span)
            const ctx = canvas.getContext("2d"); //[span_14](start_span)[span_14](end_span)
            canvas.width = viewport.width; //[span_15](start_span)[span_15](end_span)
            canvas.height = viewport.height; //[span_16](start_span)[span_16](end_span)

            await page.render({ //[span_17](start_span)[span_17](end_span)
                canvasContext: ctx, //[span_18](start_span)[span_18](end_span)
                viewport: viewport //[span_19](start_span)[span_19](end_span)
            }).promise; //[span_20](start_span)[span_20](end_span)

            // Proses scan halaman aktif
            const result = await Tesseract.recognize(canvas, "ind+eng+ara"); //[span_21](start_span)[span_21](end_span)

            if (result.data && result.data.text.trim()) { //[span_22](start_span)[span_22](end_span)
                // OPTIMASI 1: Bersihkan penumpukan enter/spasi kosong yang berlebihan dari hasil scan AI
                const scannedText = result.data.text.trim().replace(/\n{3,}/g, '\n\n');
                
                // LANGSUNG MASUKKAN TEKS PER HALAMAN KE TEXTAREA (Real-time)
                textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + scannedText; //[span_23](start_span)[span_23](end_span)
                
                // Otomatis scroll textarea ke bagian paling bawah agar Anda bisa melihat teks baru masuk
                textarea.scrollTop = textarea.scrollHeight; //[span_24](start_span)[span_24](end_span)
            }
            
            // Hancurkan objek gambar dari RAM segera setelah halaman ini selesai
            canvas.width = 0; //[span_25](start_span)[span_25](end_span)
            canvas.height = 0; //[span_26](start_span)[span_26](end_span)
        }

        status.innerText = "✓ Scan PDF Selesai!"; //[span_27](start_span)[span_27](end_span)

    } catch (err) {
        console.error("Error OCR PDF:", err); //[span_28](start_span)[span_28](end_span)
        status.innerText = "✗ PDF gagal diproses: " + err.message; //[span_29](start_span)[span_29](end_span)
    } finally {
        e.target.value = ""; //[span_30](start_span)[span_30](end_span)
        
        // Lepaskan proteksi reload halaman
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; //[span_31](start_span)[span_31](end_span)
        }, 1500); //[span_32](start_span)[span_32](end_span)

        // OPTIMASI 2: Hilangkan notifikasi status secara otomatis setelah 5 detik jika sukses atau gagal
        setTimeout(() => {
            if (status.innerText.includes("Selesai") || status.innerText.includes("gagal")) {
                status.innerText = "";
            }
        }, 5000);
    }
});
