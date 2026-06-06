document.addEventListener("change", async (e) => {
    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {

        status.innerText = "Memproses...";

        // =====================================
        // PDF
        // =====================================

        if (file.type === "application/pdf") {

            const buffer = await file.arrayBuffer();

            const pdf = await pdfjsLib.getDocument({
                data: buffer
            }).promise;

            let fullText = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                status.innerText =
                    `PDF ${pageNum}/${pdf.numPages}`;

                const page = await pdf.getPage(pageNum);

                const content =
                    await page.getTextContent({
                        normalizeWhitespace: true
                    });

                let lines = [];
                let pageLines = []
                let currentLine = [];
                let lastY = null;

                for (const item of content.items) {

                    const y = item.transform[5];

                    if (
                        lastY !== null &&
                        Math.abs(y - lastY) > 5
                    ) {

                        const sampleText =
                            currentLine
                                .map(i => i.text)
                                .join("");

                        if (isMostlyArabic(sampleText)) {

                            currentLine.sort(
                                (a, b) => b.x - a.x
                            );

                        } else {

                            currentLine.sort(
                                (a, b) => a.x - b.x
                            );
                        }

                        lines.push(
                            currentLine
                                .map(i => i.text)
                                .join(" ")
                                .trim()
                        );

                        currentLine = [];
                    }

                    currentLine.push({
                        text: item.str,
                        x: item.transform[4]
                    });

                    lastY = y;
                }

                if (currentLine.length) {

                    const sampleText =
                            currentLine
                                .map(i => i.text)
                                .join("");

                        if (isMostlyArabic(sampleText)) {

                            currentLine.sort(
                                (a, b) => b.x - a.x
                            );

                        } else {

                            currentLine.sort(
                                (a, b) => a.x - b.x
                            );
                        }

                        lines.push(
                            currentLine
                                .map(i => i.text)
                                .join(" ")
                                .trim()
                        );
                }

                fullText +=
                    lines.join("\n") +
                    "\n\n";
            }

            fullText = formatArabicText(fullText); 
            fullText = fullText.replace(
                /([0-9]+)\./g,
                "\n$1. "
            );

            textarea.value +=
                (textarea.value ? "\n\n" : "") +
                fullText;

            status.innerText = "✓ PDF selesai";

            e.target.value = "";

            return;
        }

        // =====================================
        // IMAGE OCR
        // =====================================

        status.innerText =
            "Menyiapkan gambar...";

        const img = await loadImage(file);

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
                                `OCR ${Math.round(
                                    m.progress * 100
                                )}%`;
                        }
                    },

                    tessedit_pageseg_mode: 6,

                    variables: {

                        preserve_interword_spaces: "1",

                        textord_heavy_nr: "1",

                        tessedit_enable_doc_dict: "0",

                        tessedit_fix_fuzzy_spaces: "1"
                    }
                }
            );

        let text = formatArabicText(result.data.text);

        if (
            !text.trim() &&
            result.data.words &&
            result.data.words.length
        ) {

            text = result.data.words
                .map(w => w.text)
                .join(" ");
        }

        text = formatArabicText(text);

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

            const img = new Image();

            img.onload =
                () => resolve(img);

            img.onerror = reject;

            img.src =
                URL.createObjectURL(file);
        }
    );
}

function isMostlyArabic(text) {

    const arabicChars =
        (text.match(/[\u0600-\u06FF]/g) || []).length;

    return arabicChars > text.length * 0.3;
}

// =====================================
// PREPROCESS
// =====================================

function preprocessImage(img) {

    const canvas =
        document.createElement("canvas");

    const ctx =
        canvas.getContext("2d");

    let scale = 1;

    if (img.width < 1200) {

        scale = 2;

    } else if (img.width > 3500) {

        scale = 0.7;
    }

    canvas.width =
        img.width * scale;

    canvas.height =
        img.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    const data = imageData.data;

    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        let gray =
            data[i] * 0.299 +
            data[i + 1] * 0.587 +
            data[i + 2] * 0.114;

        gray = (gray - 128) * 1.6 + 128;

        gray = Math.max(
            0,
            Math.min(255, gray)
        );

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    ctx.putImageData(
        imageData,
        0,
        0
    );

    return canvas;
}


// =====================================
// CLEAN TEXT
// =====================================

function cleanText(text) {

    return text

        .replace(/[ ]{2,}/g, " ")

        .replace(
            / ([\u064B-\u065F])/g,
            "$1"
        )

        .replace(
            /\n{3,}/g,
            "\n\n"
        )

        .replace(
            /[^\S\r\n]+$/gm,
            ""
        )

        .trim();
}


// =====================================
// FORMAT ARABIC
// =====================================

function formatArabicText(text) {

    text = cleanText(text);

    const lines =
        text
            .split("\n")
            .map(
                l => l.trim()
            )
            .filter(Boolean);

    let result = [];

    lines.forEach(line => {

        const arabicOnly =
            /^[\u0600-\u06FF\s]+$/
                .test(line);

        if (
            arabicOnly &&
            line.length < 25 &&
            !line.includes("،") &&
            !line.includes(".")
        ) {

            result.push(
                `\n## ${line}\n`
            );

            return;
        }

        result.push(line);
    });

    return result.join("\n\n");
}