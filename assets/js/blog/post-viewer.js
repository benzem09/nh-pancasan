async function loadFullPost(postId) {
    console.log("loadFullPost start");
    console.log(window.loadCommentSection);
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");

    // reset loader
    container.innerHTML = "<div class='skeleton h-32 w-full'></div>";
    titleElem.innerText = "Memuat...";
    fab?.classList.add("hidden");

    try {
        const post = await findPostById(postId);

        if (!post) throw new Error("Data kosong");

        renderPost(post, postId);
        wrapTables();
        generateTOC();

        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
        };

        if (fab) fab.classList.remove("hidden");

        initPostActions(post);

        // Memanggil fungsi dari comments.js secara aman
        if (typeof window.loadCommentSection === "function") {
            await window.loadCommentSection(postId);
        } else {
            console.error("Fungsi loadCommentSection tidak ditemukan. Pastikan comments.js dimuat sebelum post-viewer.js");
        }

        if (typeof window.loadLikes === "function") {
            await window.loadLikes(postId);
        }

        if (typeof addView === "function") {
            await addView(postId);
        }

        if (typeof updateBookmarkButton === "function") {
            updateBookmarkButton(postId);
        }

        setTimeout(() => {
            if (typeof initFabAutoHide === "function") initFabAutoHide();
            if (typeof showFab === "function") showFab();
        }, 500);

    } catch (err) {
        console.error("Detail Error:", err);
        titleElem.innerText = "Gagal Memuat";
        container.innerHTML = errorHTML(postId);
    }
}

// render post
function renderPost(post, postId) {
    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');

    // title + SEO
    titleElem.innerText = post.title || "Tanpa Judul";
    document.title = `${post.title} - Blog`;

    // render html
    container.innerHTML = `
        <div class="post-body leading-relaxed">
            <div class="
                flex items-center justify-between
                bg-slate-600/20
                border border-white/10
                rounded-xl
                px-2 py-1.5
                mb-3
                backdrop-blur-md
                shadow-lg shadow-black/20
                text-xs font-medium
            ">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="shrink-0">
                        🏷 ${post.category || 'Umum'}
                    </span>
                    <span class="truncate">
                        👤 @${post.author || "admin"}
                    </span>
                </div>

                <div class="relative shrink-0">
                    <button
                        onclick="toggleMetaInfo()"
                        class="flex items-center justify-center text-xl shadow-md active:scale-95 transition">
                        ⋯
                    </button>

                    <div id="metaDropdown"
                        class="hidden absolute right-0 top-12 w-48
                        bg-slate-900/95 backdrop-blur-xl
                        border border-white/10 rounded-2xl
                        p-4 text-xs shadow-2xl z-50">

                        <div class="space-y-3 text-slate-300">
                            <div class="flex items-center justify-between border-b border-white/5 pb-2">
                                <span>📅 Tanggal</span>
                                <span>${post.date || "-"}</span>
                            </div>

                            <div class="flex items-center justify-between border-b border-white/5 pb-2">
                                <span>👁 Views</span>
                                <span id="viewCount">0</span>
                            </div>

                            <div
                                onclick="toggleLike(${postId})"
                                class="flex items-center justify-between border-b border-white/5 pb-2 cursor-pointer hover:text-red-400 transition">
                                <span>❤️ Likes</span>
                                <span id="likeCount">0</span>
                            </div>

                            <div
                                id="bookmarkBtn"
                                onclick="toggleBookmark(${postId})"
                                class="flex items-center justify-between cursor-pointer hover:text-blue-400 transition">
                                <span>🔖 Bookmark</span>
                                <span>Simpan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="h-px bg-white/5 mb-6"></div>

            <div id="main-post-content">
                ${marked.parse(post.content || "")}
                <div style="height:100px;"></div>
            </div>
        </div>
    `;
    // image viewer
    container.querySelectorAll('.post-body img').forEach(img => {
        img.style.cursor = 'zoom-in';

        img.onclick = () => {
            openImageViewer(img.src);
        };
    });
}

// table wrapper + TOC
function wrapTables() {
    const container = document.getElementById('viewContent');
    container.querySelectorAll("table").forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

// actions
function initPostActions(post) {
    // TOC
    document.getElementById('btnToc').onclick = (e) => {
        e.stopPropagation();
        toggleFabPopup('tocPopup');
    };

    // SEARCH
    document.getElementById('btnSearch').onclick = (e) => {
        e.stopPropagation();
        toggleFabPopup('searchPopup');
    };

    const searchInput = document.getElementById("searchInPost");
    if (searchInput) {
        searchInput.oninput = function () {
            if (typeof highlightText === "function") highlightText(this.value);
        };
    }

    // SHARE
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

    // DOWNLOAD POPUP
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

// pdf download function (Ultimate Fix untuk 20+ Halaman)
function downloadPDF(postTitle) {
    const element = document.querySelector(".post-body");
    if (!element) return;

    // 1. Buat clone elemen
    const clone = element.cloneNode(true);
    const temp = document.createElement("div");
    temp.style.position = "fixed";
    temp.style.left = "-99999px";
    temp.style.top = "0";
    temp.style.width = "750px"; // Sedikit diperkecil agar pas di A4 tanpa kepotong
    temp.style.background = "#ffffff";
    temp.appendChild(clone);
    document.body.appendChild(temp);

    // Hapus dropdown meta
    const metaDropdown = clone.querySelector(".relative.shrink-0");
    if (metaDropdown) metaDropdown.remove();

    // Hapus spacer kosong di akhir post
    const emptySpacer = clone.querySelector("#main-post-content > div[style*='height:100px']");
    if (emptySpacer) emptySpacer.remove();

    // 2. Styling Khusus Cetak & Cegah Canvas Crash
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

        // Trik Krusial: Cegah elemen terpotong aneh di tengah halaman
        if (el.tagName === "P" || el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3" || el.tagName === "TR") {
            el.style.pageBreakInside = "avoid";
            el.style.breakInside = "avoid";
        }

        if (el.tagName === "LI" || el.tagName === "OL" || el.tagName === "UL") {
            el.style.listStylePosition = "inside";
        }
    });

    // 3. Konfigurasi yang bersahabat dengan dokumen panjang
    const opt = {
        margin: 0.5,
        filename: `${generateSlug(postTitle)}.pdf`,
        image: { type: "jpeg", quality: 0.90 }, // Kompresi sedikit ditingkatkan demi memori
        html2canvas: {
            scale: 1, // Turunkan ke 1 (Normal). Ini penyelamat utama agar canvas tidak kepenuhan memori!
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            removeContainer: true // Hapus container sampah setelah render selesai
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Paduan mode terbaik untuk dokumen panjang
    };

    // 4. Jalankan dengan Worker agar lebih stabil
    const worker = html2pdf().set(opt).from(clone);
    
    worker.save()
        .then(() => {
            console.log("PDF Berhasil diunduh.");
        })
        .catch(err => {
            console.error("Gagal cetak PDF:", err);
        })
        .finally(() => {
            // Hapus elemen temporary setelah selesai
            temp.remove();
        });
}


// popup toggle 
function toggleFabPopup(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const isHidden = target.classList.contains('hidden');

    document.querySelectorAll('.fab-popup').forEach(p => p.classList.add('hidden'));

    if (isHidden) target.classList.remove('hidden');
}

function openImageViewer(src) {
    const viewer = document.createElement('div');

    viewer.className = `
        fixed inset-0 z-[9999]
        bg-black/90 backdrop-blur-sm
        flex items-center justify-center
        p-4
    `;

    viewer.innerHTML = `
        <img src="${src}"
             class="max-w-full max-h-full rounded-xl shadow-2xl object-contain">

        <button
            class="absolute top-5 right-5 text-white text-3xl">
            ✕
        </button>
    `;

    viewer.onclick = () => viewer.remove();

    document.body.appendChild(viewer);
}

// slug open
function openPost(slug, id) {
    history.pushState({}, '', `?post=${slug}`);
    loadFullPost(id);
}

