document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) {
        if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = false;
        return;
    }

    // KUNCI: Amankan halaman agar browser HP tidak refresh otomatis
    if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = true;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {
        status.innerText = "Membaca berkas...";

        // =====================================
        // 1. PROSES TEXT EXTRACTOR UNTUK PDF
        // =====================================
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            status.innerText = "Membuka dokumen PDF...";
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                status.innerText = `Mengekstrak PDF: Halaman ${pageNum}/${pdf.numPages}`;
                const page = await pdf.getPage(pageNum);
                
                // Gunakan normalizeWhitespace agar spasi PDF tidak renggang acak
                const content = await page.getTextContent({ normalizeWhitespace: true });

                // Susun teks berdasarkan koordinat agar format Arab RTL stabil
                let pageLines = [];
                let currentLine = [];
                let lastY = null;

                // Urutkan elemen berdasarkan koordinat Y (atas ke bawah) lalu X (kanan ke kiri untuk Arab)
                const items = content.items.sort((a, b) => {
                    if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                        return b.transform[5] - a.transform[5]; // Atas ke bawah
                    }
                    return b.transform[4] - a.transform[4]; // Kanan ke kiri
                });

                for (let item of items) {
                    if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                        pageLines.push(currentLine.join(" "));
                        currentLine = [];
                    }
                    if (item.str.trim()) {
                        currentLine.push(item.str);
                    }
                    lastY = item.transform[5];
                }
                if (currentLine.length > 0) pageLines.push(currentLine.join(" "));

                fullText += pageLines.join("\n") + "\n\n";
                
                // Jeda singkat untuk membebaskan RAM internal HP
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const formattedPDFText = formatArabicText(fullText);
            if (formattedPDFText) {
                textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + formattedPDFText;
                status.innerText = "✓ PDF Berhasil Diekstrak!";
                textarea.scrollTop = textarea.scrollHeight;
            } else {
                status.innerText = "⚠ Gagal mengambil teks dari PDF";
            }
            e.target.value = "";
            return;
        }

        // =====================================
        // 2. PROSES ADVANCED IMAGE OCR (FOTO/SCREENSHOT)
        // =====================================
        status.innerText = "Menyiapkan pemrosesan gambar...";
        const img = await loadImage(file);
        
        status.innerText = "Menjalankan filter penajaman teks...";
        const canvas = preprocessImage(img);

        status.innerText = "AI memindai teks Arab & Indonesia...";
        const result = await Tesseract.recognize(
            canvas,
            "ara+ind",
            {
                // Menggunakan mode otomatis penuh yang paling stabil untuk lembaran kitab
                tessedit_pageseg_mode: "3", 
                variables: {
                    textord_heavy_nr: "1",         // Mengabaikan bercak hitam/kotoran kertas pada foto HP
                    tessedit_enable_doc_dict: "0", // Matikan kamus kaku agar harakat tidak rusak dipaksa ke bahasa lain
                    tessedit_char_blacklist: "=`’'‘”"“■|~<>_[]{}\\" // Blokir karakter sampah fisik kertas sejak awal
                },
                logger: m => {
                    if (m.status === "recognizing text") {
                        status.innerText = `Memindai Gambar: ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        );

        let processedImgText = formatArabicText(result.data.text);
        
        if (processedImgText.length > 2) {
            textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + processedImgText;
            status.innerText = "✓ Scan Gambar Berhasil!";
            textarea.scrollTop = textarea.scrollHeight;
        } else {
            status.innerText = "⚠ Teks tidak terdeteksi, pastikan foto tegak lurus";
        }

        // Hancurkan objek canvas dari RAM
        canvas.width = 0;
        canvas.height = 0;
        e.target.value = "";

    } catch (err) {
        console.error("Proses OCR Gagal:", err);
        status.innerText = "✗ Gagal membaca file: " + err.message;
    } finally {
        setTimeout(() => { 
            if (typeof FILE_PICKER_ACTIVE !== 'undefined') FILE_PICKER_ACTIVE = false; 
        }, 1500);

        // Otomatis bersihkan notifikasi status setelah 5 detik
        setTimeout(() => {
            if (status.innerText.includes("Berhasil") || status.innerText.includes("Selesai") || status.innerText.includes("Gagal") || status.innerText.includes("tidak terdeteksi")) {
                status.innerText = "";
            }
        }, 5000);
    }
});

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Cegah kebocoran memori di HP Android
            resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// =====================================
// PREPROCESS IMAGE (ADAPTIF UNTUK FOTO HP & SCREENSHOT)
// =====================================
function preprocessImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let scale = 1;
    if (img.width < 1500) {
        scale = 2.0; // Perbesar screenshot kecil agar lekukan huruf Arab tidak buram
    } else if (img.width > 2500) {
        scale = 0.6; // Perkecil sedikit foto kamera HP yang terlampau besar agar RAM tidak jebol
    }

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // ALGORITMA ADAPTIVE THRESHOLD (Penyelamat Bayangan Lipatan Buku)
    const S = Math.floor(width / 8) | 1; 
    const T = 0.12; // Diturunkan ke 12% agar harakat Arab yang tipis tidak patah/pecah menjadi putih

    const intImg = new Uint32Array(width * height);
    
    for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            sum += grayData[idx];
            intImg[idx] = (y === 0) ? sum : intImg[idx - width] + sum;
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            const x1 = Math.max(x - Math.floor(S / 2), 0);
            const x2 = Math.min(x + Math.floor(S / 2), width - 1);
            const y1 = Math.max(y - Math.floor(S / 2), 0);
            const y2 = Math.min(y + Math.floor(S / 2), height - 1);
            
            const count = (x2 - x1 + 1) * (y2 - y1 + 1);
            
            const idx1 = y2 * width + x2;
            const idx2 = (y1 - 1) * width + x2;
            const idx3 = y2 * width + (x1 - 1);
            const idx4 = (y1 - 1) * width + (x1 - 1);
            
            let sum = intImg[idx1];
            if (y1 > 0) sum -= intImg[idx2];
            if (x1 > 0) sum -= intImg[idx3];
            if (y1 > 0 && x1 > 0) sum += intImg[idx4];

            const dataIdx = idx * 4;
            if (grayData[idx] * count < sum * (1.0 - T)) {
                data[dataIdx] = data[dataIdx + 1] = data[dataIdx + 2] = 0;   // Huruf Kitab (Hitam)
            } else {
                data[dataIdx] = data[dataIdx + 1] = data[dataIdx + 2] = 255; // Kertas Bersih (Putih)
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
    if (!text) return "";
    return text
        // Bersihkan sisa bintik simbol bawaan scanner tanpa merusak font Arab
        .replace(/[`’'‘”"“■\-|~<>\[\]\{\}\\\/]+/g, "")
        // Satukan spasi ganda agar rata tengah/kiri tulisan kembali normal
        .replace(/[ ]{2,}/g, " ")
        // Gabungkan kembali harakat yang terpisah spasi dari huruf utamanya
        .replace(/ ([\u064B-\u0652])/g, "$1") 
        // Batasi penumpukan baris baru kosong agar tidak terlalu ke bawah
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function formatArabicText(text) {
    // FIX: Sekarang memanggil fungsi pembersih utama dengan benar
    text = cleanText(text);
    if (!text) return "";

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line);

    let result = [];

    lines.forEach(line => {
        // Deteksi Otomatis Jika teks tersebut adalah baris Judul Kitab/Bab Arab penuh
        if (line.length < 60 && /^[\u0600-\u06FF\s\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+$/.test(line)) {
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

