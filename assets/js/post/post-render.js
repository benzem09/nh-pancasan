console.log("post-render.js loaded");

window.renderPostBody = function(post, postId){
    return `
        <div class="post-body leading-relaxed">

            <!-- META -->
            <div
                class="
                    flex items-center justify-between
                    bg-slate-600/20
                    border border-white/10
                    rounded-xl
                    px-2 py-1.5
                    mb-3
                    backdrop-blur-md
                    shadow-lg shadow-black/20
                    text-xs font-medium
                "
            >

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
                        class="
                            flex items-center
                            justify-center
                            text-xl
                            active:scale-95
                            transition
                        "
                    >
                        ⋯
                    </button>

                    <div
                        id="metaDropdown"
                        class="
                            hidden
                            absolute right-0 top-12
                            w-48
                            bg-slate-900/95
                            backdrop-blur-xl
                            border border-white/10
                            rounded-2xl
                            p-4
                            text-xs
                            shadow-2xl
                            z-50
                        "
                    >

                        <div class="space-y-3 text-slate-300">

                            <div class="flex justify-between border-b border-white/5 pb-2">
                                <span>📅</span>
                                <span>${post.date || "-"}</span>
                            </div>

                            <div class="flex justify-between border-b border-white/5 pb-2">
                                <span>👁</span>
                                <span id="viewCount">0</span>
                            </div>

                            <div
                                onclick="toggleLike(${postId})"
                                class="
                                    flex justify-between
                                    border-b border-white/5
                                    pb-2
                                    cursor-pointer
                                    hover:text-red-400
                                    transition
                                "
                            >
                                <span>❤️</span>
                                <span id="likeCount">0</span>
                            </div>

                            <div
                                id="bookmarkBtn"
                                onclick="toggleBookmark(${postId})"
                                class="
                                    flex justify-between
                                    cursor-pointer
                                    hover:text-blue-400
                                    transition
                                "
                            >
                                <span>🔖</span>
                                <span>Simpan</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div class="h-px bg-white/5 mb-6"></div>

            <div id="main-post-content">
                ${marked.parse(post.content || "")}
                <div style="height:100px"></div>
            </div>

        </div>
    `;
};
