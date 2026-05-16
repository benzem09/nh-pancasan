const CURRENT_USER = "admin";
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleSearch() {
    const container = document.getElementById('search-container');
    const input = document.getElementById('searchInput');
    
    if (container.classList.contains('w-10')) {
        // Buka
        container.classList.replace('w-10', 'w-40');
        input.classList.replace('w-0', 'w-full');
        input.classList.add('ml-2');
        input.focus();
    } else {
        // Tutup jika input kosong
        if (input.value === "") {
            container.classList.replace('w-40', 'w-10');
            input.classList.replace('w-full', 'w-0');
            input.classList.remove('ml-2');
        }
    }
}

async function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('section-' + tabName).classList.remove('hidden');
    
    const tabs = ['blog', 'categories', 'archive', 'about', 'about-me'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
            if (t === tabName) {
                el.classList.add('border-blue-500', 'text-blue-400', 'font-bold');
            } else {
                el.classList.remove('border-blue-500', 'text-blue-400', 'font-bold');
            }
        }
    });

    if (tabName === 'blog') await refreshBlog();
    if (tabName === 'categories') await refreshCategories(); // Memanggil fungsi kategori baru
    if (tabName === 'archive') await refreshArchive();
    if (tabName === 'about') await refreshAbout();
    if (tabName === 'about-me') if (typeof refreshAboutMe === 'function') await refreshAboutMe();
}

function toggleWideMode() {
    const app = document.getElementById("appContainer");
    const btn = document.getElementById("screenModeBtn");

    app.classList.toggle("wide-mode");

    const enabled = app.classList.contains("wide-mode");

    localStorage.setItem("wide_mode", enabled);

    if (btn) btn.classList.toggle("wide-active", enabled);
}

document.getElementById("btnNotif")?.addEventListener("click", async () => {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        alert("Notifikasi berhasil diaktifkan 🔔");
    } else {
        alert("Notifikasi ditolak");
    }
});

document.getElementById("btnRefresh")?.addEventListener("click", async () => {
    if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
    }

    location.reload();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        location.reload();
    }
});

window.onload = () => {
    switchTab('blog');

    const wide = localStorage.getItem("wide_mode") === "true";

    if (wide) {
        document.getElementById("appContainer").classList.add("wide-mode");

        const btn = document.getElementById("screenModeBtn");
        if (btn) btn.classList.add("wide-active");
    }
};