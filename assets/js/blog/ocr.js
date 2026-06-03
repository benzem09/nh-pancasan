document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) {
        FILE_PICKER_ACTIVE = false;
        return;
    }

    // KUNCI: Set true agar halaman tidak ter-refresh saat kembali dari file picker
    FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    status.innerText = "Menginisialisasi Scan...";

    try {
        const result = await Tesseract.recognize(
            file,
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

        // Ambil teks murni dari data hasil recognize
        const rawText = result.data.text || "";
        const cleanText = rawText.trim().replace(/\n{3,}/g, '\n\n');

        if (cleanText) {
            // Masukkan teks ke dalam textarea
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + cleanText;
            status.innerText = "✓ Scan Gambar Berhasil";
            
            // Otomatis scroll ke bawah textarea agar teks baru langsung terlihat
            textarea.scrollTop = textarea.scrollHeight;
        } else {
            status.innerText = "⚠ Selesai, teks tidak terdeteksi";
        }

    } catch (err) {
        console.error("Error OCR Gambar:", err);
        status.innerText = "✗ Gagal scan: " + err.message;
    } finally {
        e.target.value = "";
        
        // Buka kunci kembali setelah proses selesai beberapa saat
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false; 
        }, 1500);

        // Hilangkan notifikasi status secara otomatis setelah 5 detik jika sukses atau gagal
        setTimeout(() => {
            if (status.innerText.includes("Berhasil") || status.innerText.includes("Gagal") || status.innerText.includes("terdeteksi")) {
                status.innerText = "";
            }
        }, 5000);
    }
});