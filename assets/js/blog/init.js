function initBlog() {
        // load feed awal
        refreshBlog();
        // render kategori
        refreshCategories();
        // cek URL apakah ada ?post=slug
        checkUrlPost();
        // init floating action behaviour
        initFabAutoHide();

}