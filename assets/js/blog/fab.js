// DRAG FAB LOGIC
let isDraggingFab = false;
let fabStartY = 0;
let fabStartTop = 0;
let fabTimeout = null;

const fabContainer = document.getElementById("floatingAction");

if (fabContainer) {
    fabContainer.addEventListener('mousedown', startFabDrag);
    fabContainer.addEventListener('touchstart', startFabDrag, { passive: false });
}

function startFabDrag(e) {
    isDraggingFab = true;
    const touch = e.touches ? e.touches[0] : e;
    fabStartY = touch.clientY;
    fabStartTop = fabContainer.offsetTop;
    showFab(); // Pastikan tidak hilang saat di-drag
}

document.addEventListener('mousemove', doFabDrag);
document.addEventListener('touchmove', doFabDrag, { passive: false });

function doFabDrag(e) {
    if (!isDraggingFab) return;
    const touch = e.touches ? e.touches[0] : e;
    let newTop = fabStartTop + (touch.clientY - fabStartY);

    if (newTop < 50) newTop = 50;
    if (newTop > window.innerHeight - 180) newTop = window.innerHeight - 180;

    fabContainer.style.top = newTop + "px";
    fabContainer.style.bottom = "auto";

    document.querySelectorAll('.fab-popup').forEach(p => {
        p.style.top = newTop + "px";
        p.style.bottom = "auto";
    });
}

document.addEventListener('mouseup', () => isDraggingFab = false);
document.addEventListener('touchend', () => isDraggingFab = false);

// --- LOGIKA SHOW/HIDE KHUSUS ---

function showFab() {
    if (!fabContainer) return;
    
    // Munculkan FAB
    fabContainer.classList.remove("fab-hidden");
    
    // Reset timer: FAB akan otomatis sembunyi dalam 2 detik jika tidak ada interaksi
    clearTimeout(fabTimeout);
    fabTimeout = setTimeout(() => {
        if (!isDraggingFab) hideFab();
    }, 2000); 
}

function hideFab() {
    if (!fabContainer || isDraggingFab) return;
    fabContainer.classList.add("fab-hidden");
    
    // Tutup popup juga saat FAB sembunyi agar tidak melayang sendirian
    document.querySelectorAll(".fab-popup").forEach(popup => {
        popup.classList.add("hidden");
    });
}

function initFabAutoHide() {
    // Elemen tempat konten dibaca
    const modalWrapper = document.querySelector("#viewModal .glass") || document.getElementById("viewModal");

    if (!modalWrapper) return;

    // 1. Jika layar diketuk/diklik -> Tampilkan FAB
    modalWrapper.addEventListener("click", (e) => {
        // Jangan sembunyikan jika yang diklik adalah tombol FAB itu sendiri
        if (e.target.closest('.fab-btn')) return;
        showFab();
    });

    // 2. Jika layar disentuh (Mobile) -> Tampilkan FAB
    modalWrapper.addEventListener("touchstart", showFab, { passive: true });

    // 3. Jika sedang scroll -> LANGSUNG SEMBUNYIKAN (Hide)
    // Ini menjawab permintaan Anda: selain diklik, FAB harus sembunyi
    modalWrapper.addEventListener("scroll", () => {
        hideFab(); 
    }, { passive: true });
}
