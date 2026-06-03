document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

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

        const text = result.data.text.trim();

        if (text) {
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + text;
            status.innerText = "✓ Scan Gambar Berhasil";
        } else {
            status.innerText = "⚠ Selesai, teks tidak terdeteksi";
        }

    } catch (err) {
        console.error("Error OCR Gambar:", err);
        status.innerText = "✗ Gagal scan: " + err.message;
    } finally {
        e.target.value = "";
        // Buka kunci kembali setelah proses selesai beberapa saat
        setTimeout(() => { FILE_PICKER_ACTIVE = false; }, 1000);
    }
});
