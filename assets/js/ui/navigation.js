window.toggleSearch = function(){
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

window.switchTab = async function(tab){

    document
        .querySelectorAll('.tab-content')
        .forEach(el => el.classList.add('hidden'));

    document
        .getElementById('section-' + tab)
        ?.classList.remove('hidden');

    const tabs = [
        'blog',
        'categories',
        'archive',
        'about',
        'about-me'
    ];

    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);

        if (!el) return;

        if (t === tab) {
            el.classList.add(
                'border-blue-500',
                'text-blue-400',
                'font-bold'
            );
        } else {
            el.classList.remove(
                'border-blue-500',
                'text-blue-400',
                'font-bold'
            );
        }
    });

    if (tab === 'blog')
        await refreshBlog();

    if (tab === 'categories')
        await refreshCategories();

    if (tab === 'archive')
        await refreshArchive();

    if (tab === 'about')
        await refreshAbout();

    if (
        tab === 'about-me' &&
        typeof refreshAboutMe === 'function'
    ) {
        await refreshAboutMe();
    }
}

window.toggleFabPopup = function (id) {
    const target = document.getElementById(id);
    if (!target) return;
    const isHidden = target.classList.contains('hidden');

    document.querySelectorAll('.fab-popup').forEach(p => p.classList.add('hidden'));

    if (isHidden) target.classList.remove('hidden');
}