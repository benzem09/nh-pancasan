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

        // =====================================
        // PDF TEXT EXTRACT
        // =====================================

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

            fullText =
                formatArabicText(fullText);

            textarea.value +=
                (textarea.value ? "\n\n" : "") +
                fullText;

            status.innerText =
                "✓ PDF selesai";

            e.target.value = "";

            return;
        }

        // =====================================
        // IMAGE OCR
        // =====================================

        status.innerText =
            "Menyiapkan gambar...";

        const img =
            await loadImage(file);

        const canvas =
            preprocessImage(img);

        const result =
            await Tesseract.recognize(
                canvas,
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
            formatArabicText(
                    result.data.text
                );

        textarea.value +=
            (textarea.value ? "\n\n" : "") +
            text;

        status.innerText =
            "✓ OCR selesai";

        e.target.value = "";

    } catch (err) {

        console.error(err);

        status.innerText =
            "✗ Gagal membaca file";
    }
});


// =====================================
// LOAD IMAGE
// =====================================

function loadImage(file) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();

            img.onload =
                () => resolve(img);

            img.onerror =
                reject;

            img.src =
                URL.createObjectURL(file);
        }
    );
}


// =====================================
// PREPROCESS IMAGE
// =====================================

function preprocessImage(img) {

    const canvas =
        document.createElement("canvas");

    const ctx =
        canvas.getContext("2d");

    canvas.width =
        img.width;

    canvas.height =
        img.height;

    ctx.drawImage(
        img,
        0,
        0
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    const data =
        imageData.data;

    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        let gray =
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2];

        gray =
            gray > 180
                ? 255
                : 0;

        data[i] =
        data[i + 1] =
        data[i + 2] =
            gray;
    }

    ctx.putImageData(
        imageData,
        0,
        0
    );

    return canvas;
}


// =====================================
// CLEAN OCR RESULT
// =====================================

function cleanText(text) {

    return text

        // karakter RTL tersembunyi
        .replace(/[‎‏]/g, "")

        // hapus spasi berlebih
        .replace(/[ ]{2,}/g, " ")

        // rapikan enter
        .replace(/\n{3,}/g, "\n\n")

        // artefak OCR umum
        .replace(/PURPORT/g, "")
        .replace(/Goyang/g, "")
        .replace(/Jest/g, "")
        .replace(/£\d+/g, "")

        // trim
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

        // Judul Arab pendek
        if (
            line.length < 40 &&
            /^[\u0600-\u06FF\s]+$/.test(line)
        ) {

            result.push(
                `\n## ${line}\n`
            );

            return;
        }

        // Judul Indonesia
        if (
            line.startsWith("📘") ||
            line.startsWith("📌") ||
            line.startsWith("🔹")
        ) {

            result.push(
                `\n${line}\n`
            );

            return;
        }

        result.push(line);
    });

    return result.join("\n\n");
}