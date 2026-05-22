console.log("toc.js loaded");

window.generateTOC = function () {
    const tocContainer = document.getElementById("tocContainer");
    const content = document.getElementById("main-post-content");

    if (!tocContainer || !content) return;

    const headings = content.querySelectorAll("h1, h2, h3");

    if (headings.length < 2) {
        tocContainer.innerHTML = "";
        return;
    }

    // 1. Buat Wrapper Utama
    let html = `
        <div class="popup-title">📑 Daftar Isi
            <div>(${headings.length} Bagian)</div>
        </div>
        <ul id="tocList" class="max-h-[90vh] overflow-y-auto p-2"></ul>
    `;
    tocContainer.innerHTML = html;
    const tocList = document.getElementById("tocList");

    // 2. Loop headings dan buat element secara dinamis
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;

        const li = document.createElement("li");
        const indent = heading.tagName === "H2" ? "ml-3" : heading.tagName === "H3" ? "ml-6" : "ml-0";
        
        li.className = `${indent} mb-2 toc-item cursor-pointer p-1 rounded transition-all`;
        li.innerHTML = `
            <a href="#${id}" class="text-slate-400 text-[11px] hover:text-blue-400 flex items-center">
                <span class="toc-dot mr-2">•</span> ${heading.innerText}
            </a>
        `;

        // Fitur Smooth Scroll & Active State
        li.onclick = (e) => {
            e.preventDefault();
            heading.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            window.setActiveTOC(li);
        };

        tocList.appendChild(li);
    });

    // Menampilkan FAB jika ada
    const fab = document.getElementById("fab"); // Pastikan ID ini sesuai di HTML Anda
    if(fab) fab.classList.remove("hidden");
};

// Fungsi untuk menandai item yang aktif
window.setActiveTOC = function(activeItem) {
    document.querySelectorAll(".toc-item").forEach(el => {
        el.classList.remove("bg-blue-600/20", "border", "border-blue-500/30", "text-blue-300", "shadow-lg");
        const dot = el.querySelector(".toc-dot");
        if (dot) dot.innerHTML = "•";
    });

    activeItem.classList.add("bg-blue-600/20", "border", "border-blue-500/30", "text-blue-300", "shadow-lg");
    const dot = activeItem.querySelector(".toc-dot");
    if (dot) dot.innerHTML = "▶";
};

window.closeTOC = function() {
    const popup = document.getElementById("tocPopup");
    if(popup) popup.classList.add("hidden");
};

// Inisialisasi event listener tombol
document.addEventListener("DOMContentLoaded", () => {
    const btnToc = document.getElementById('btnToc');
    if(btnToc) {
        btnToc.onclick = (e) => {
            e.stopPropagation();
            if (typeof toggleFabPopup === "function") {
                toggleFabPopup('tocPopup');
            }
        };
    }
});
