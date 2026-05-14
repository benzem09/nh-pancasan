async function loadFullPost(postId) {
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");

    container.innerHTML = "<div class='skeleton h-32 w-full'></div>";
    titleElem.innerText = "Memuat...";

    fab.classList.add("hidden");
    document.querySelectorAll('.fab-popup').forEach(p => p.classList.add('hidden'));

    try {
        const post = await findPostById(postId);

        // title
        titleElem.innerText = post.title || "Tanpa Judul";

        // SEO
        document.title = `${post.title} - NH Pancasan`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute(
                "content",
                (post.content || "")
                .replace(/[#>*`]/g, "")
                .slice(0, 150)
            );
        }

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = window.location.href;

        // render content
        container.innerHTML = `
            <div class="post-body text-slate-300 leading-relaxed">
                <div class="flex items-center gap-2 mb-6 opacity-60">
                    <span class="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                        ${post.category || 'Umum'}
                    </span>
                    <span class="text-[10px]">👤 @${post.author || "admin"}</span>
                    <span class="text-[10px]">📅 ${post.date || "-"}</span>
                </div>

                <div id="main-post-content">
                    ${marked.parse(post.content || "")}
                    <div style="height: 100px; width: 100%;"></div> </div>
                </div>
            </div>
        `;

        // table wrapper
        container.querySelectorAll("table").forEach(table => {
            const wrapper = document.createElement("div");
            wrapper.className = "table-wrapper";
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        // TOC
        const headings = container.querySelectorAll("h1,h2,h3");

        if (headings.length > 1) {
            let tocHTML = `
                <div class="popup-title">📑 Daftar Isi</div>
                <ul class="max-h-[50vh] overflow-y-auto">
            `;

            headings.forEach((heading, index) => {
                const id = `heading-${index}`;
                heading.id = id;

                const indent =
                    heading.tagName === "H2" ? "ml-3" :
                    heading.tagName === "H3" ? "ml-6" : "";

                tocHTML += `
                    <li class="${indent} mb-2">
                        <a href="#${id}" class="text-slate-400 text-[11px] hover:text-blue-400">
                            • ${heading.innerText}
                        </a>
                    </li>
                `;
            });

            tocHTML += `</ul>`;
            document.getElementById("tocContainer").innerHTML = tocHTML;
        }

        fab.classList.remove("hidden");

        // TOC button
        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
        };
        
        //SEARCH button
        document.getElementById('btnSearch').onclick = (e) => {
          e.stopPropagation();
          toggleFabPopup('searchPopup');
          
        };
        const searchInput = document.getElementById("searchInPost");
        if (searchInput) {
          searchInput.addEventListener("input", function () {
            highlightText(this.value);
            
          });
          
        }

        // SHARE native android
        document.getElementById('btnShare').onclick = async (e) => {
            e.stopPropagation();

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: post.title || document.title,
                        text: `Baca artikel: ${post.title}`,
                        url: window.location.href
                    });
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    alert("Link disalin!");
                }
            } catch (err) {
                console.log("Share dibatalkan");
            }
        };

        // DOWNLOAD popup
        document.getElementById('btnDownload').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('downloadPopup');
        };

        const fileName = post.slug || generateSlug(post.title);

        document.getElementById('dlMd').onclick = () => {
            executeDownload(post.content, `${fileName}.md`);
        };

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
        
        document.getElementById('dlPdf').onclick = () => {
          downloadPDF(post.title);
          
        };
        
        // Inisialisasi sistem sembunyi
        setTimeout(() => {
            initFabAutoHide(); 
            showFab(); // Munculkan sekali saat awal buka post
        }, 500);

    } catch (err) {
        console.error(err);
        titleElem.innerText = "Error";
        container.innerHTML = "Gagal memuat detail postingan.";
    }
}

// pdf
function downloadPDF(postTitle) {
    const element = document.querySelector(".post-body");

    // simpan style asli
    const originalBg = element.style.background;
    const originalColor = element.style.color;
    const originalPadding = element.style.padding;

    // mode PDF
    element.style.background = "#ffffff";
    element.style.color = "#000000";
    element.style.padding = "20px";

    // paksa semua child ikut hitam
    element.querySelectorAll("*").forEach(el => {
        el.dataset.oldColor = el.style.color;
        el.dataset.oldBg = el.style.background;

        el.style.color = "#000000";
        el.style.background = "transparent";
        el.style.boxShadow = "none";
        el.style.backdropFilter = "none";
        el.style.textShadow = "none";
    });

    const options = {
        margin: 0.5,
        filename: `${generateSlug(postTitle)}.pdf`,
        image: {
            type: "jpeg",
            quality: 1
        },
        html2canvas: {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true
        },
        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        }
    };

    html2pdf()
        .set(options)
        .from(element)
        .save()
        .then(() => {
            // restore style asli
            element.style.background = originalBg;
            element.style.color = originalColor;
            element.style.padding = originalPadding;

            element.querySelectorAll("*").forEach(el => {
                el.style.color = el.dataset.oldColor || "";
                el.style.background = el.dataset.oldBg || "";
            });
        });
}

// popup toggle 
function toggleFabPopup(id) {
    const target = document.getElementById(id);
    const isHidden = target.classList.contains('hidden');

    document.querySelectorAll('.fab-popup')
        .forEach(p => p.classList.add('hidden'));

    if (isHidden) target.classList.remove('hidden');
}

// slug open
function openPost(slug, id) {
    history.pushState({}, '', `?post=${slug}`);
    loadFullPost(id);
}