document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;[span_2](start_span)[span_2](end_span)

    const file = e.target.files[0];[span_3](start_span)[span_3](end_span)
    if (!file) {
        FILE_PICKER_ACTIVE = false;
        return;
    }

    // KUNCI: Set true agar halaman tidak ter-refresh saat kembali dari file picker
    FILE_PICKER_ACTIVE = true;[span_4](start_span)[span_4](end_span)

    const status = document.getElementById("ocrStatus");[span_5](start_span)[span_5](end_span)
    const textarea = document.getElementById("postContent");[span_6](start_span)[span_6](end_span)

    status.innerText = "Menginisialisasi Scan...";[span_7](start_span)[span_7](end_span)

    try {
        const result = await Tesseract.recognize([span_8](start_span)[span_8](end_span)
            file,[span_9](start_span)[span_9](end_span)
            "ind+eng+ara",[span_10](start_span)[span_10](end_span)
            {
                logger: m => {[span_11](start_span)[span_11](end_span)
                    if (m.status === "recognizing text") {[span_12](start_span)[span_12](end_span)
                        status.innerText = "Memindai Gambar: " + Math.round(m.progress * 100) + "%";[span_13](start_span)[span_13](end_span)
                    } else {
                        status.innerText = "Memuat AI: " + m.status;[span_14](start_span)[span_14](end_span)
                    }
                }
            }
        );

        if (result.data && result.data.text.trim()) {
            // OPTIMASI 1: Membersihkan enter/spasi kosong yang berlebihan dari hasil scan gambar
            const text = result.data.text.trim().replace(/\n{3,}/g, '\n\n');

            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + text;
            status.innerText = "✓ Scan Gambar Berhasil";[span_15](start_span)[span_15](end_span)
            
            // Otomatis scroll ke bawah textarea agar teks baru langsung terlihat
            textarea.scrollTop = textarea.scrollHeight;
        } else {
            status.innerText = "⚠ Selesai, teks tidak terdeteksi";[span_16](start_span)[span_16](end_span)
        }

    } catch (err) {
        console.error("Error OCR Gambar:", err);[span_17](start_span)[span_17](end_span)
        status.innerText = "✗ Gagal scan: " + err.message;[span_18](start_span)[span_18](end_span)
    } finally {
        e.target.value = "";[span_19](start_span)[span_19](end_span)
        
        // Buka kunci kembali setelah proses selesai beberapa saat
        setTimeout(() => { 
            FILE_PICKER_ACTIVE = false;[span_20](start_span)[span_20](end_span)
        }, 1500);

        // OPTIMASI 2: Hilangkan notifikasi status secara otomatis setelah 5 detik jika sukses atau gagal
        setTimeout(() => {
            if (status.innerText.includes("Berhasil") || status.innerText.includes("Gagal") || status.innerText.includes("terdeteksi")) {
                status.innerText = "";
            }
        }, 5000);
    }
});
