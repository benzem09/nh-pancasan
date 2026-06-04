document.addEventListener("change", async (e) => {

    if (e.target.id !== "ocrFile") return;

    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    try {

        status.innerText = "Memproses...";

        // =====================================
        // PDF TEXT EXTRACT
        // =====================================

        if (file.type === "application/pdf") {

            const arrayBuffer = await file.arrayBuffer();

            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer
            }).promise;

            let fullText = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                status.innerText =
                    `PDF ${pageNum}/${pdf.numPages}`;

                const page = await pdf.getPage(pageNum);

                const content =
                    await page.getTextContent();

                let pageText = "";

                let lastY = null;

                content.items.forEach(item => {

                    const y = item.transform[5];

                    if (
                        lastY !== null &&
                        Math.abs(lastY - y) > 5
                    ) {
                        pageText += "\n";
                    }

                    pageText += item.str + " ";

                    lastY = y;
                });

                fullText +=
                    pageText +
                    "\n\n--------------------\n\n";
            }

            fullText = cleanText(fullText);

            textarea.value +=
                (textarea.value ? "\n\n" : "") +
                fullText;

            status.innerText =
                "✓ PDF selesai";

            e.target.value = "";

            return;
        }

        // =====================================
        // IMAGE PREPROCESS
        // =====================================

        status.innerText = "Menyiapkan gambar...";

        const img = await loadImage(file);

        const canvas =
            preprocessImage(img);

        // =====================================
        // OCR IMAGE
        // =====================================

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
            cleanText(result.data.text);

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

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = reject;

        img.src =
            URL.createObjectURL(file);
    });
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

    ctx.drawImage(img, 0, 0);

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
            gray > 190
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

        // spasi berlebihan
        .replace(/[ ]{2,}/g, " ")

        // enter berlebihan
        .replace(/\n{3,}/g, "\n\n")

        // artefak OCR umum
        .replace(/PURPORT/g, "")
        .replace(/Goyang/g, "")
        .replace(/Jest/g, "")
        .replace(/£\d+/g, "")

        .trim();
}