console.log("post-download.js loaded");

window.initDownloadActions = function (post) {
    if (!post) return; // Validasi agar tidak error jika data kosong

    document.getElementById('btnDownload').onclick = (e) => {
        e.stopPropagation();
        toggleFabPopup('downloadPopup');
    };

    const fileName = post.slug || generateSlug(post.title);

    // MD
    document.getElementById('dlMd').onclick = () => {
        executeDownload(post.content, `${fileName}.md`);
    };

    // HTML
    document.getElementById('dlHtml').onclick = () => {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${post.title}</title>
</head>
<body>
${marked.parse(post.content)}
</body>
</html>`;
        executeDownload(htmlContent, `${fileName}.html`);
    };

    // PDF
    document.getElementById('dlPdf').onclick = () => {
        downloadPDF(post.title);
    };
}

window.downloadPDF = function (postTitle) {
    const element = document.querySelector(".post-body");
    if (!element) return;

    // 1. Buat clone elemen
    const clone = element.cloneNode(true);
    const temp = document.createElement("div");
    temp.style.position = "fixed";
    temp.style.left = "-99999px";
    temp.style.top = "0";
    temp.style.width = "750px"; 
    temp.style.background = "#ffffff";
    temp.appendChild(clone);
    document.body.appendChild(temp);

    // Hapus dropdown meta
    const metaDropdown = clone.querySelector(".relative.shrink-0");
    if (metaDropdown) metaDropdown.remove();

    // Hapus spacer kosong di akhir post
    const emptySpacer = clone.querySelector("#main-post-content > div[style*='height:100px']");
    if (emptySpacer) emptySpacer.remove();

    // 2. Styling Cetak
    clone.style.background = "#ffffff";
    clone.style.color = "#000000";
    clone.style.padding = "30px";
    clone.style.fontFamily = "Arial, sans-serif";

    clone.querySelectorAll("*").forEach(el => {
        el.style.setProperty("color", "#000000", "important");
        el.style.setProperty("background", "transparent", "important");
        el.style.setProperty("background-color", "transparent", "important");
        el.style.boxShadow = "none";
        el.style.backdropFilter = "none";
        el.style.textShadow = "none";
        el.style.filter = "none";
        el.style.opacity = "1";

        if (el.tagName === "P" || el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3" || el.tagName === "TR") {
            el.style.pageBreakInside = "avoid";
            el.style.breakInside = "avoid";
        }

        if (el.tagName === "LI" || el.tagName === "OL" || el.tagName === "UL") {
            el.style.listStylePosition = "inside";
        }
    });

    // 3. Konfigurasi html2pdf
    const opt = {
        margin: [0.75, 0.5, 0.75, 0.5], // Atur margin atas & bawah sedikit longgar untuk ruang nomor halaman
        filename: `${generateSlug(postTitle)}.pdf`,
        image: { type: "jpeg", quality: 0.90 },
        html2canvas: {
            scale: 1, 
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            removeContainer: true 
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // 4. Jalankan Worker + Suntik Nomor Halaman via jsPDF
    html2pdf().set(opt).from(clone).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100); // Warna abu-abu halus

            // Format teks nomor halaman (Contoh: "Halaman 1 dari 58")
            const pageText = `Halaman ${i} dari ${totalPages}`;
            
            // Mengambil ukuran lebar dan tinggi halaman PDF aktif (satuan inci)
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Cetak teks di kanan bawah (dikurangi margin sekitar 0.5 inci)
            pdf.text(pageText, pageWidth - 0.5, pageHeight - 0.4, { align: "right" });
            
            // OPSIONAL: Jika ingin menambah garis horizontal tipis di atas nomor halaman
            // pdf.setDrawColor(200, 200, 200);
            // pdf.line(0.5, pageHeight - 0.5, pageWidth - 0.5, pageHeight - 0.5);
        }
    }).save()
    .then(() => {
        console.log("PDF dengan nomor halaman berhasil diunduh.");
    })
    .catch(err => {
        console.error("Gagal cetak PDF:", err);
    })
    .finally(() => {
        temp.remove();
    });
}