console.log("post-download.js loaded");

window.initDownloadButtons =
function(post){

    const fileName =
        post.slug ||
        generateSlug(post.title);

    dlMd.onclick = ()=>{

        executeDownload(
            post.content,
            `${fileName}.md`
        );
    };

    dlHtml.onclick = ()=>{

        const html =
`
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

        executeDownload(
            html,
            `${fileName}.html`
        );
    };

    dlPdf.onclick =
    ()=>downloadPDF(post.title);
};


window.downloadPDF =
function(postTitle){

    const element =
        document.querySelector(
            ".post-body"
        );

    html2pdf()
        .from(element)
        .save(
            `${generateSlug(postTitle)}.pdf`
        );
};