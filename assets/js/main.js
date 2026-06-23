const CURRENT_USER = "admin";
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
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

let FILE_PICKER_ACTIVE = false;

document.addEventListener("visibilitychange", () => {

    // Jangan reload saat pilih file / OCR
    if (FILE_PICKER_ACTIVE) return;

    if (!document.hidden) {
        location.reload();
    }
});

window.onload = () => {
    switchTab('blog');

};