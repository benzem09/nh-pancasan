async function loadFullPost(postId) {
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");

    // Reset UI & Loading state
    container.innerHTML = "<div class='skeleton h-32 w-full'></div>";
    titleElem.innerText = "Memuat...";
    fab?.classList.add("hidden");

    try {
        // Memanggil fungsi pencari yang sudah diperbaiki
        const post = await findPostById(postId);

        if (!post) throw new Error("Data postingan kosong");

        // Render Judul & SEO
        renderPost(post, postId);

        // table wrapper
        wrapTables();

        // TOC
        generateTOC();

        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
          
        };

        fab.classList.remove("hidden");

        //SEARCH button
        // SHARE native android
        // DOWNLOAD popup
        initPostActions(post);

        // LOAD COMMENT COMPONENT
        const commentWrap = document.createElement("div");
        commentWrap.className = "mt-6";
        container.appendChild(commentWrap);

        const res = await fetch("components/comment-section.html");
        if (!res.ok) throw new Error("comment-section gagal dimuat");

        commentWrap.innerHTML = await res.text();

        // isi nama dari localStorage
        const commentName = document.getElementById("commentName");
        if (commentName) {
            commentName.value =
                localStorage.getItem("commentName") || "";
        }

        // pasang tombol submit
        const commentBtn = document.getElementById("commentBtn");
        if (commentBtn) {
            commentBtn.onclick = () => submitComment(postId);
        }

        // load comments aman
        if (typeof loadComments === "function") {
            try {
                await loadComments(postId);
            } catch (err) {
                console.error("Comment error:", err);
            }
        }
        if (typeof loadLikes === "function") {
            try {
                await loadLikes(postId);
            } catch (err) {
                console.error("Like error:", err);
            }
        }
        if (typeof addView === "function") {
          await addView(postId);
          
        }
        if (typeof updateBookmarkButton === "function") {
          updateBookmarkButton(postId);
          
        }

        // init fab
        setTimeout(() => {
            initFabAutoHide();
            showFab();
        }, 500);

    } catch (err) {
        console.error("Detail Error:", err);

        titleElem.innerText = "Gagal Memuat";
        container.innerHTML = `
            <div class="text-center p-8">
                <p class="text-red-400 mb-2">
                    ⚠️ File tidak ditemukan atau path salah.
                </p>
                <p class="text-xs opacity-50">ID: ${postId}</p>
                <button
                    onclick="closeModal('viewModal')"
                    class="mt-4 text-xs bg-white/10 px-4 py-2 rounded"
                >
                    Kembali
                </button>
            </div>
        `;
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

            <!-- META -->
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
            highlightText(this.value);
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
                await navigator.clipboard.writeText(
                    window.location.href
                );
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

    const fileName =
        post.slug || generateSlug(post.title);

    // MD
    document.getElementById('dlMd').onclick = () => {
        executeDownload(
            post.content,
            `${fileName}.md`
        );
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

        executeDownload(
            htmlContent,
            `${fileName}.html`
        );
    };

    // PDF
    document.getElementById('dlPdf').onclick = () => {
    downloadPDF(post.title);
      
    };
}

// pdf
function downloadPDF(postTitle) {
    const element = document.querySelector(".post-body");
    if (!element) return;

    // clone DOM
    const clone = element.cloneNode(true);

    // temp wrapper
    const temp = document.createElement("div");
    temp.style.position = "fixed";
    temp.style.left = "-99999px";
    temp.style.top = "0";
    temp.style.width = "800px";
    temp.style.background = "#ffffff";
    temp.appendChild(clone);
    document.body.appendChild(temp);

    // Sembunyikan bagian tombol meta/dropdown agar tidak ikut ter-download
    const metaDropdown = clone.querySelector(".relative.shrink-0");
    if (metaDropdown) metaDropdown.remove();

    // Style overrides khusus untuk mode cetak/PDF (Memperbaiki teks hilang)
    clone.style.background = "#ffffff";
    clone.style.color = "#000000";
    clone.style.padding = "40px"; // Beri padding agak luas agar rapi
    clone.style.fontFamily = "Arial, sans-serif"; // Gunakan font standar global

    // FIX UTAMA: Paksa semua elemen anak berwarna hitam dan background transparan
    clone.querySelectorAll("*").forEach(el => {
        // Paksa warna teks menjadi hitam pekat agar tidak putih/transparan
        el.style.setProperty("color", "#000000", "important");
        // Paksa background menjadi transparan agar tidak tabrakan dengan background putih utama
        el.style.setProperty("background", "transparent", "important");
        el.style.setProperty("background-color", "transparent", "important");

        // Hapus efek-efek CSS modern yang tidak didukung html2pdf / html2canvas
        el.style.boxShadow = "none";
        el.style.backdropFilter = "none";
        el.style.textShadow = "none";
        el.style.filter = "none";
        el.style.opacity = "1";

        // Memastikan list (nomor/bullet) dan alignment teks arab/indonesia tetap rapi
        if (el.tagName === "LI" || el.tagName === "OL" || el.tagName === "UL") {
            el.style.listStylePosition = "inside";
        }
    });

    // Jalankan html2pdf dengan konfigurasi yang dioptimalkan
    html2pdf()
        .set({
            margin: [0.5, 0.5, 0.5, 0.5], // Atur margin dokumen (top, left, bottom, right) dalam inch
            filename: `${generateSlug(postTitle)}.pdf`,
            image: {
                type: "jpeg",
                quality: 0.98
            },
            html2canvas: {
                scale: 2, // Naikkan ke 2 agar teks lebih tajam dan tidak blur
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                letterRendering: true // Membantu merender teks per huruf dengan lebih akurat
            },
            jsPDF: {
                unit: "in",
                format: "a4",
                orientation: "portrait"
            },
            pagebreak: {
                mode: ["css", "legacy"] // Mencegah teks terpotong di tengah baris kalimat
            }
        })
        .from(clone)
        .save()
        .finally(() => {
            // Hapus element temporary dari DOM setelah selesai
            temp.remove();
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
