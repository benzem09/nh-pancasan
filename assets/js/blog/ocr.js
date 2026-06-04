document.addEventListener("change", async (e) => {

    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

    const status =
        document.getElementById("ocrStatus");

    const textarea =
        document.getElementById("postContent");

    try {

        status.innerText = "Memproses...";

        // ==========================
        // PDF
        // ==========================

        if (file.type === "application/pdf") {

            const arrayBuffer =
                await file.arrayBuffer();

            const pdf =
                await pdfjsLib.getDocument({
                    data: arrayBuffer
                }).promise;

            let fullText = "";

            for (
                let pageNum = 1;
                pageNum <= pdf.numPages;
                pageNum++
            ) {

                status.innerText =
                    `PDF ${pageNum}/${pdf.numPages}`;

                const page =
                    await pdf.getPage(pageNum);

                const content =
                    await page.getTextContent();

                const pageText =
                    content.items
                    .map(item => item.str)
                    .join(" ");

                fullText +=
                    pageText +
                    "\n\n";
            }

            textarea.value +=
                (textarea.value ? "\n\n" : "") +
                fullText;

            status.innerText =
                "✓ PDF selesai";

            return;
        }

        // ==========================
        // IMAGE OCR
        // ==========================

        const result =
            await Tesseract.recognize(
                file,
                "ara+ind",
                {
                    logger: m => {
                        if (
                            m.status ===
                            "recognizing text"
                        ) {
                            status.innerText =
                                "OCR " +
                                Math.round(
                                    m.progress * 100
                                ) +
                                "%";
                        }
                    }
                }
            );

        let text =
            result.data.text;

        text = text
            .replace(/[‎‏]/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ ]{2,}/g, " ")
            .trim();

        textarea.value +=
            (textarea.value ? "\n\n" : "") +
            text;

        status.innerText =
            "✓ OCR selesai";

    } catch (err) {

        console.error(err);

        status.innerText =
            "✗ Gagal membaca file";
    }
});

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// =====================================
// PREPROCESS IMAGE (OPTIMAL UNTUK KITAB ARAB)
// =====================================
function preprocessImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const targetWidth = 2500;
    const scale = targetWidth / img.width;
    
    canvas.width = targetWidth;
    canvas.height = img.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
       
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
       
        const v = gray < 145 ? 0 : 255; 
        data[i] = data[i+1] = data[i+2] = v;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
// FUNGSI PEMBANTU: Memuat Gambar
function formatArabicText(text) {
    if (!text) return "";
    return text.trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[`’'‘”"“■\-|~<>\[\]\{\}\\\/]+/g, "")
        .replace(/[ ]{2,}/g, " ") 
        .replace(/\n{3,}/g, "\n\n");
}
