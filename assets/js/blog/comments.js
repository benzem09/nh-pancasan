console.log("comments.js loaded");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDwuHPRnTtYe4oA5DuVVrQRarMMHwWZwac",
  authDomain: "nh-pancasan-comments.firebaseapp.com",
  projectId: "nh-pancasan-comments",
  storageBucket: "nh-pancasan-comments.firebasestorage.app",
  messagingSenderId: "206326783949",
  appId: "1:206326783949:web:1a349b0ce5173acd3dae84"
};

// init firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// LOAD COMMENTS
window.loadComments = async function(postId) {
    const container = document.getElementById("commentList");

    if (!container) return;

    container.innerHTML = "Memuat komentar...";

    try {
        const snap = await db
            .collection("posts")
            .doc(String(postId))
            .collection("comments")
            .orderBy("createdAt", "desc")
            .get();

        if (snap.empty) {
            container.innerHTML =
                "<p class='opacity-50 text-xs'>Belum ada komentar</p>";
            return;
        }

        let html = "";

        snap.forEach(doc => {
            const c = doc.data();
            const date = new Date(c.createdAt);
            const dateString = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;

            html += `
                <div class="bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[11px] text-blue-400 font-bold">@${c.author || "admin"}</span>
                        <span class="text-[10px] opacity-40">${dateString}</span>
                    </div>
                    <div class="text-sm text-slate-100">
                        ${c.text}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = "Gagal load komentar";
    }
};


// SUBMIT COMMENT
window.submitComment = async function(postId) {
    const input = document.getElementById("commentInput");
    const nameInput = document.getElementById("commentName");
    const btn = document.getElementById("commentBtn");

    if (!input || !btn) return;

    const text = input.value.trim();
    const name = nameInput?.value.trim() || "guest";

    if (!text) {
        alert("Komentar kosong");
        return;
    }

    localStorage.setItem("commentName", name);

    try {
        btn.disabled = true;
        btn.innerText = "Mengirim...";

        await db
            .collection("posts")
            .doc(String(postId))
            .collection("comments")
            .add({
                author: name,
                text: text,
                createdAt: Date.now()
            });

        input.value = "";

        await loadComments(postId);

    } catch (err) {
        console.error(err);
        alert("Gagal kirim komentar: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Kirim";
    }
};