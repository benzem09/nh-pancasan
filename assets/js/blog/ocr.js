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
            "ara+ind+eng",  
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