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

// --- LOGIKA MANUAL TOGGLE (KETUK) ---

function showFab() {
    if (!fabContainer) return;
    fabContainer.classList.remove("fab-hidden");
}

function hideFab() {
    if (!fabContainer || isDraggingFab) return;
    fabContainer.classList.add("fab-hidden");
    
    // Tutup popup juga saat FAB disembunyikan
    document.querySelectorAll(".fab-popup").forEach(popup => {
        popup.classList.add("hidden");
    });
}

function initFabAutoHide() {
    // Ambil elemen pembungkus konten di modal
    const modalWrapper = document.querySelector("#viewModal .glass") || document.getElementById("viewModal");

    if (!modalWrapper) return;

    // Hapus event listener lama jika ada (mencegah double event)
    modalWrapper.removeEventListener("click", handleManualToggle);
    
    // Pasang event klik baru
    modalWrapper.addEventListener("click", handleManualToggle);
}

function handleManualToggle(e) {
    // JANGAN sembunyikan jika yang diketuk adalah tombol FAB itu sendiri
    if (e.target.closest('#floatingAction')) return;

    if (fabContainer.classList.contains("fab-hidden")) {
        showFab();
    } else {
        hideFab();
    }
}