async function refreshArchive() {
    const container = document.getElementById("archive-container");

    container.innerHTML = `<p class="text-xs opacity-50">Memuat...</p>`;

    try {
        const yearsData = await getPublicFile("indices/years.json");
        const years = yearsData.years || [];

        let html = "";

        for (const year of years.sort((a, b) => b - a)) {
            const monthsData = await getPublicFile(
                `indices/${year}/months.json?t=${Date.now()}`
            );

            html += `
                <div class="mb-4">
                    <h3 class="text-blue-400 font-bold text-sm mb-2">📅 ${year}</h3>
                    <div class="space-y-2">
            `;

            for (const month of monthsData.months.sort().reverse()) {
                const posts = await getPublicFile(
                    `indices/${year}/${month}/index_${month}.json?t=${Date.now()}`
                );

                html += `
                    <div onclick="openArchiveMonth('${year}','${month}')"
                        class="glass p-3 rounded-xl cursor-pointer hover:border-blue-500/30">
                        <span class="text-sm">${month}/${year}</span>
                        <span class="text-xs opacity-50 ml-2">(${posts.length} posts)</span>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html || `<p class="text-xs opacity-50">Belum ada archive</p>`;
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p class="text-red-400 text-xs">Gagal memuat archive</p>`;
    }
}

async function openArchiveMonth(year, month) {
    const container = document.getElementById("archive-container");

    container.innerHTML = `<p class="text-xs opacity-50">Memuat ${month}/${year}...</p>`;

    try {
        const posts = await getPublicFile(
            `indices/${year}/${month}/index_${month}.json?t=${Date.now()}`
        );

        container.innerHTML = `
            <button onclick="refreshArchive()"
                class="mb-4 text-xs text-blue-400">← Kembali</button>
        ` + posts.reverse().map(post => `
            <div onclick="openPost('${post.slug}', ${post.id})"
                class="glass p-3 rounded-xl mb-2 cursor-pointer">
                <h4 class="font-bold text-sm text-blue-400">
                    ${sanitizeHTML(post.title)}
                </h4>
                <p class="text-[10px] opacity-50 mt-1">
                    👤 ${post.author} | 📅 ${post.date}
                </p>
            </div>
        `).join("");
    } catch (e) {
        container.innerHTML = `<p class="text-red-400 text-xs">Gagal membuka archive</p>`;
    }
}