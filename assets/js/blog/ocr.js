document.addEventListener("change", async (e) => {

    if (e.target.id !== "ocrFile") return;

    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById("ocrStatus");
    const textarea = document.getElementById("postContent");

    // Cegah auto reload saat file picker / OCR aktif
    OCR_ACTIVE = true;

    status.innerText = "Memproses...";

    try {

        // =====================
        // PDF OCR
        // =====================
        if (file.type === "application/pdf") {

            status.innerText = "Membaca PDF...";

            const arrayBuffer = await file.arrayBuffer();

            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer
            }).promise;

            let finalText = "";

            for (
                let pageNum = 1;
                pageNum <= pdf.numPages;
                pageNum++
            ) {

                status.innerText =
                    `OCR PDF ${pageNum}/${pdf.numPages}`;

                const page =
                    await pdf.getPage(pageNum);

                const viewport =
                    page.getViewport({
                        scale: 2
                    });

                const canvas =
                    document.createElement("canvas");

                const ctx =
                    canvas.getContext("2d");

                canvas.width =
                    viewport.width;

                canvas.height =
                    viewport.height;

                await page.render({
                    canvasContext: ctx,
                    viewport
                }).promise;

                const result =
                    await Tesseract.recognize(
                        canvas,
                        "ind+eng+ara"
                    );

                finalText +=
                    "\n\n" +
                    result.data.text;
            }

            textarea.value +=
                (textarea.value ? "\n\n" : "") +
                finalText;

            status.innerText =
                "✓ PDF selesai";
        }

        // =====================
        // IMAGE OCR
        // =====================
        else {

            const result =
                await Tesseract.recognize(
                    file,
                    "ind+eng+ara",
                    {
                        logger: m => {

                            if (
                                m.status ===
                                "recognizing text"
                            ) {

                                status.innerText =
                                    "Scanning " +
                                    Math.round(
                                        m.progress * 100
                                    ) +
                                    "%";
                            }
                        }
                    }
                );

            const text =
                result.data.text.trim();

            textarea.value +=
                (textarea.value
                    ? "\n\n"
                    : "") +
                text;

            status.innerText =
                "✓ Scan selesai";
        }

    } catch (err) {

        console.error(err);

        status.innerText =
            "✗ OCR gagal";
    }

    finally {

        // Aktifkan lagi auto refresh normal
        OCR_ACTIVE = false;

        // reset input supaya bisa scan file sama lagi
        e.target.value = "";
    }
});