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
        // --- PROSES PENJERNIHAN GAMBAR (PRE-PROCESSING) ---
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

        // Buat canvas offline untuk filter penjernihan
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Ambil data piksel gambar untuk manipulasi kontras hitam-putih
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Rumus tingkat kecerahan grayscale
            const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            // Tingkatkan kontras: Jika agak gelap buat jadi hitam pekat, jika terang buat jadi putih bersih
            const threshold = brightness < 128 ? brightness * 0.6 : 255;
            data[i] = threshold;     // Red
            data[i + 1] = threshold; // Green
            data[i + 2] = threshold; // Blue
        }
        ctx.putImageData(imgData, 0, 0);
        // --------------------------------------------------

        const result = await Tesseract.recognize(
            canvas, // Kirim gambar yang sudah dijernihkan ke AI
            "ind+eng+ara",
            {
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = "Memindai Gambar: " + Math.round(m.progress * 100) + "%";
                    } else {
                        status.innerText = "Memuat AI: " + m.status;
                    }
                }
            }
        );

        let rawText = result.data.text || "";
        
        // PEMBERSIHAN ADVANCED: Hapus karakter sampah yang sering muncul akibat bintik gambar
        let cleanText = rawText.trim()
            .replace(/[`’'‘”"“_■\-|~]+/g, '') // Hapus simbol pengganggu
            .replace(/\n{3,}/g, '\n\n');     // Rapikan spasi ganda

        if (cleanText.length > 2) {
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + cleanText;
            status.innerText = "✓ Scan Gambar Berhasil (Dijernihkan)";
            textarea.scrollTop = textarea.scrollHeight;
        } else {
            status.innerText = "⚠ Teks kurang jelas atau tidak terdeteksi";
        }

        // Hancurkan canvas offline dari memori
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