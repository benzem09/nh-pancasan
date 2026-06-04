document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {
        status.innerText = "Memproses...";

        // =====================================
        // PDF TEXT EXTRACT (Dioptimalkan untuk Arab RTL)
        // =====================================
        if (file.type === "application/pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                status.innerText = `PDF ${pageNum}/${pdf.numPages}`;
                const page = await pdf.getPage(pageNum);
                
                // Gunakan normalizeWhitespace agar spasi PDF tidak renggang acak
                const content = await page.getTextContent({ normalizeWhitespace: true });

                // Susun teks Arab per baris dengan benar agar tidak terbalik
                let lastY = null;
                let pageLines = [];
                let currentLine = [];

                for (let item of content.items) {
                    // Cek jika ganti baris berdasarkan koordinat Y PDF
                    if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                        pageLines.push(currentLine.join(""));
                        currentLine = [];
                    }
                    currentLine.push(item.str);
                    lastY = item.transform[5];
                }
                if (currentLine.length > 0) pageLines.push(currentLine.join(""));

                fullText += pageLines.join("\n") + "\n\n";
            }

            fullText = formatArabicText(fullText);
            textarea.value += (textarea.value ? "\n\n" : "") + fullText;
            status.innerText = "✓ PDF selesai";
            e.target.value = "";
            return;
        }

        // =====================================
        // IMAGE OCR (Dioptimalkan untuk Font Arab)
        // =====================================
        status.innerText = "Menyiapkan gambar...";
        const img = await loadImage(file);
        
        // PENTING: Gunakan canvas asli jika gambar sudah kontras, 
        // atau gunakan preprocess baru yang menjaga detail harakat.
        const canvas = preprocessImage(img);

        const result = await Tesseract.recognize(
            canvas,
            "ara+ind",
            {
              // Parameter internal Tesseract untuk meningkatkan akurasi teks Arab berharakat
                tessedit_pageseg_mode: "3", // 3 = Fully automatic page segmentation (Terbaik untuk buku/kitab)
                tessjavascript_engine: "1",
                variables: {
                    textord_heavy_nr: "1",       // Mengurangi noise cetakan buruk pada foto HP
                    tessedit_enable_doc_dict: "0" // Matikan kamus kaku agar harakat tidak dikoreksi paksa menjadi kata lain
                },
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = `OCR ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        );

        let text = formatArabicText(result.data.text);
        textarea.value += (textarea.value ? "\n\n" : "") + text;
        status.innerText = "✓ OCR selesai";
        e.target.value = "";

    } catch (err) {
        console.error(err);
        status.innerText = "✗ Gagal membaca file";
    }
});


function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}


// =====================================// PREPROCESS IMAGE (ADAPTIF UNTUK FOTO HP & SCREENSHOT)// =====================================
function preprocessImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 1. Deteksi jenis gambar berdasarkan dimensi
    // Screenshot biasanya kecil, Foto HP biasanya sangat besar (> 2000px)
    let scale = 1;
    if (img.width < 1500) {
        scale = 2.5; // Hubungkan piksel screenshot yang kecil agar teks Arab tegak & jelas
    } else if (img.width > 3000) {
        scale = 0.5; // Perkecil foto HP yang terlalu raksasa agar pemrosesan tidak lag/crash
    }

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Aktifkan interpolasi kualitas tinggi untuk screenshot
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Buat array grayscale untuk kalkulasi adaptif
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. Algoritma Adaptive Thresholding (Penyelamat Foto Kamera HP)
    // Memeriksa area sekitar (S) untuk menentukan apakah piksel itu teks atau bayangan kertas
    const S = Math.floor(width / 8) | 1; // Ukuran jendela sekitar
    const T = 0.15; // Sensitivitas (15%). Naikkan jika teks Arab terlalu tipis/putus

    const intImg = new Uint32Array(width * height);
    
    // Tahap A: Buat Integral Image untuk kalkulasi cepat
    for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            sum += grayData[idx];
            if (y === 0) {
                intImg[idx] = sum;
            } else {
                intImg[idx] = intImg[idx - width] + sum;
            }
        }
    }

    // Tahap B: Binarisasi lokal berdasarkan nilai rata-rata tetangga
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            // Batas-batas jendela sekitar
            const x1 = Math.max(x - Math.floor(S / 2), 0);
            const x2 = Math.min(x + Math.floor(S / 2), width - 1);
            const y1 = Math.max(y - Math.floor(S / 2), 0);
            const y2 = Math.min(y + Math.floor(S / 2), height - 1);
            
            const count = (x2 - x1 + 1) * (y2 - y1 + 1);
            
            // Hitung total nilai tangga menggunakan integral image
            const idx1 = y2 * width + x2;
            const idx2 = (y1 - 1) * width + x2;
            const idx3 = y2 * width + (x1 - 1);
            const idx4 = (y1 - 1) * width + (x1 - 1);
            
            let sum = intImg[idx1];
            if (y1 > 0) sum -= intImg[idx2];
            if (x1 > 0) sum -= intImg[idx3];
            if (y1 > 0 && x1 > 0) sum += intImg[idx4];

            // Tentukan hitam atau putih mutlak
            const dataIdx = idx * 4;
            if (grayData[idx] * count < sum * (1.0 - T)) {
                data[dataIdx] = data[dataIdx + 1] = data[dataIdx + 2] = 0; // Teks (Hitam Pekat)
            } else {
                data[dataIdx] = data[dataIdx + 1] = data[dataIdx + 2] = 255; // Latar/Bayangan (Putih Bersih)
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}


// =====================================
// CLEAN & REPAIR ARABIC TEXT
// =====================================
function cleanText(text) {
    return text
        // JANGAN hapus karakter RTL tersembunyi karena Arab membutuhkannya agar tidak terbalik
        
        // Hapus spasi ganda tapi pertahankan format spasi antar kata Arab
        .replace(/[ ]{2,}/g, " ")
        
        // Normalisasi spasi yang sering terselip di antara harakat Arab
        .replace(/ ([\u064B-\u0652])/g, "$1") 
        
        // Rapikan enter berlebih
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function formatArabicText(text) {
    text = cleanText(text);

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line);

    let result = [];

    lines.forEach(line => {
        // Deteksi Judul Arab (Mendukung rentang karakter Unicode Arab lengkap)
        if (line.length < 50 && /^[\u0600-\u06FF\s\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+$/.test(line)) {
            result.push(`\n## ${line}\n`);
            return;
        }

        if (line.startsWith("📘") || line.startsWith("📌") || line.startsWith("🔹")) {
            result.push(`\n${line}\n`);
            return;
        }

        result.push(line);
    });

    return result.join("\n\n");
}
