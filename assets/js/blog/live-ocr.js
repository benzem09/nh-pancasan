let streamInstance = null;
let liveScanInterval = null;
let isProcessingLive = false;

async function toggleLiveScan() {
    const container = document.getElementById("cameraContainer");
    
    // Jika kamera sedang aktif, maka tombol ini akan mematikannya
    if (streamInstance) {
        stopLiveScan();
        return;
    }

    const video = document.getElementById("videoStream");
    const status = document.getElementById("ocrStatus");
    const indicator = document.getElementById("liveOcrIndicator");

    container.classList.remove("hidden");
    status.innerText = "Mengaktifkan kamera...";
    indicator.innerText = "🔵 Menginisialisasi kamera...";

    try {
        // Membuka kamera belakang HP (facingMode: environment)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        streamInstance = stream;
        video.srcObject = stream;
        status.innerText = "✓ Kamera Aktif";

        // Mulai interval pembacaan teks setiap 2 detik (2000 ms)
        startLiveOcrLoop();

    } catch (err) {
        console.error("Gagal akses kamera:", err);
        status.innerText = "✗ Gagal membuka kamera: " + err.message;
        container.classList.add("hidden");
    }
}

function startLiveOcrLoop() {
    const video = document.getElementById("videoStream");
    const canvas = document.getElementById("videoCanvas");
    const ctx = canvas.getContext("2d");
    const textarea = document.getElementById("postContent");
    const indicator = document.getElementById("liveOcrIndicator");

    liveScanInterval = setInterval(async () => {
        // Jika proses scan sebelumnya belum selesai, lewati antrean ini
        if (isProcessingLive) return;

        // Pastikan video sudah siap dan memiliki dimensi ukuran
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            isProcessingLive = true;
            indicator.innerText = "⚡ Membaca teks...";
            indicator.className = "text-amber-400 animate-bounce";

            // Set ukuran canvas rahasia mengikuti ukuran video frame
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Salin gambar dari video stream ke canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                // Jalankan AI Tesseract ke canvas cuplikan tersebut
                const result = await Tesseract.recognize(canvas, "ind+eng+ara");
                const cleanText = (result.data.text || "").trim().replace(/\n{3,}/g, '\n\n');

                if (cleanText.length > 3) { // Hanya masukkan jika teks minimal 4 karakter
                    textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + cleanText;
                    textarea.scrollTop = textarea.scrollHeight;
                    
                    indicator.innerText = "✓ Teks Masuk!";
                    indicator.className = "text-emerald-400 font-bold";
                } else {
                    indicator.innerText = "🔍 Mencari tulisan...";
                    indicator.className = "text-slate-400";
                }
            } catch (ocrErr) {
                console.error("Live OCR Error:", ocrErr);
                indicator.innerText = "⚠ Gagal membaca";
                indicator.className = "text-red-400";
            } finally {
                isProcessingLive = false;
            }
        }
    }, 2000); // 2000ms = Rentang waktu scan ulang otomatis
}

function stopLiveScan() {
    const container = document.getElementById("cameraContainer");
    const status = document.getElementById("ocrStatus");

    // Hentikan interval loop scan
    if (liveScanInterval) {
        clearInterval(liveScanInterval);
        liveScanInterval = null;
    }

    // Matikan hardware aliran kamera
    if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
        streamInstance = null;
    }

    const video = document.getElementById("videoStream");
    if (video) video.srcObject = null;

    isProcessingLive = false;
    container.classList.add("hidden");
    status.innerText = "Kamera dimatikan";
    
    setTimeout(() => { status.innerText = ""; }, 3000);
}
