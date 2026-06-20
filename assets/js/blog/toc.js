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
            <a
                href="#"
                onclick="event.preventDefault(); jumpToHeading('${id}', this);"
                class="text-[var(--text-soft)] text-[12px] hover:text-[var(--primary)] block transition-all"
            >
                <span class="toc-dot mr-1">•</span> ${heading.innerText}
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
    const fab = document.getElementById("floatingAction"); // Pastikan ID ini sesuai di HTML Anda
    if(fab) fab.classList.remove("hidden");
};

// Fungsi untuk menandai item yang aktif
window.setActiveTOC = function(activeItem) {
    document.querySelectorAll(".toc-item").forEach(el => {
        // Bersihkan kelas kustom lama
        el.classList.remove("border", "shadow-sm");
        el.style.backgroundColor = "";
        
        const link = el.querySelector("a");
        if (link) {
            link.style.color = "var(--text-soft)";
        }
        
        const dot = el.querySelector(".toc-dot");
        if (dot) dot.innerHTML = "•";
    });

    // Tambahkan style aktif menggunakan variabel warna CSS dinamis
    activeItem.classList.add("border", "shadow-sm");
    activeItem.style.borderColor = "rgba(37, 99, 235, 0.25)";
    activeItem.style.backgroundColor = "rgba(37, 99, 235, 0.08)";
    
    const link = activeItem.querySelector("a");
    if (link) {
        link.style.color = "var(--primary)";
    }
    
    const dot = activeItem.querySelector(".toc-dot");
    if (dot) dot.innerHTML = "▶";
};


window.closeTOC = function() {
    const popup = document.getElementById("tocPopup");
    if(popup) popup.classList.add("hidden");
};

// Inisialisasi event listener tombol


window.jumpToHeading = function(id){

    const el = document.getElementById(id);
    if(!el) return;

    // hide popup TOC
    toggleFabPopup('tocPopup');

    // scroll smooth
    setTimeout(() => {
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 120);

};