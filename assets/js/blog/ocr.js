document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) {
        FILE_PICKER_ACTIVE = false;
        return;
    }

    FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    status.innerText = "Menginisialisasi Scan...";

    try {
        status.innerText = "Mengoptimalkan kontras gambar...";
        const img = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // AMBIL DATA PIXEL UNTUK FILTER BLACK & WHITE MUTLAK (ADAPTIVE THRESHOLD)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Rumus grayscale standard
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // KALIBRASI BARU: Di bawah nilai 160 (tulisan agak pudar/bayangan) dipaksa menjadi HITAM PEKAT (0)
            // Selebihnya menjadi PUTIH BERSIH (255) agar debu kertas hilang
            const v = brightness < 160 ? 0 : 255;
            data[i] = v;     // R
            data[i + 1] = v; // G
            data[i + 2] = v; // B
        }
        ctx.putImageData(imgData, 0, 0);

        const result = await Tesseract.recognize(
            canvas,
            "ind+eng+ara",
            {
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = "Memindai Gambar: " + Math.round(m.progress * 100) + "%";
                    }
                }
            }
        );

        let rawText = result.data.text || "";
        
        // PEMBERSIHAN KHUSUS: Bersihkan sisa karakter aneh / metadata tak terlihat dari browser
        let cleanText = rawText.trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Hapus hidden unicode formatting character bawaan OCR
            .replace(/[`’'‘”"“_■\-|~<>]+/g, '')   // Hapus simbol sampah fisik kertas
            .replace(/\n{3,}/g, '\n\n');          // Batasi enter maksimal 2 kali

        if (cleanText.length > 2) {
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + cleanText;
            status.innerText = "✓ Scan Gambar Berhasil";
            textarea.scrollTop = textarea.scrollHeight;
        } else {
            status.innerText = "⚠ Teks kurang jelas atau tidak terdeteksi";
        }

        canvas.width = 0;
        canvas.height = 0;

    } catch (err) {
        console.error("Error OCR Gambar:", err);
        status.innerText = "✗ Gagal scan: " + err.message;
    } finally {
        e.target.value = "";
        
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; 
        }, 1500);

        setTimeout(() => {
            if (status.innerText.includes("Berhasil") || status.innerText.includes("Gagal") || status.innerText.includes("terdeteksi")) {
                status.innerText = "";
            }
        }, 5000);
    }
});
