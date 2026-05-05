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
    
    const tabs = ['blog', 'categories', 'about', 'about-me'];
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
    if (tabName === 'categories') await refreshCategories();
    if (tabName === 'about') await refreshAbout();
    if (tabName === 'about-me') await refreshAbout-me();
}
function toggleTOC() {
    const panel = document.getElementById("tocPanel");
    if (panel) {
        panel.classList.toggle("hidden");
    }
}
window.onload = () => {
    switchTab('blog');
};