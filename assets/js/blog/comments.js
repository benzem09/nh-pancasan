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
            const dateString = date.toLocaleDateString("id-ID", { 
                day: 'numeric', month: 'short', year: 'numeric' 
            });

            html += `
                <div class="group bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 p-1 rounded-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-1">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-[10px] text-blue-400 border border-blue-600/30">
                                ${(c.author || "G")[0].toUpperCase()}
                            </div>
                            <span class="text-[11px] text-blue-400 font-semibold">@${c.author || "guest"}</span>
                        </div>
                        <span class="text-[9px] opacity-30 font-medium">${dateString}</span>
                    </div>
                    <div class="text-[13.5px] text-white font-normal leading-relaxed pl-1 contrast-125">
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

window.loadLikes = async function(postId) {
    const likeCount = document.getElementById("likeCount");
    if (!likeCount) return;

    try {
        const docRef = db.collection("likes").doc(String(postId));
        const snap = await docRef.get();

        if (snap.exists) {
            likeCount.innerText = snap.data().count || 0;
        } else {
            likeCount.innerText = 0;
        }

    } catch (err) {
        console.error("loadLikes:", err);
    }
};


window.toggleLike = async function(postId) {
    const key = `liked_${postId}`;

    if (localStorage.getItem(key)) {
        alert("Kamu sudah like");
        return;
    }

    try {
        const docRef = db.collection("likes").doc(String(postId));
        const snap = await docRef.get();

        if (snap.exists) {
            const current = snap.data().count || 0;

            await docRef.update({
                count: current + 1
            });
        } else {
            await docRef.set({
                count: 1
            });
        }

        localStorage.setItem(key, "true");

        await loadLikes(postId);

    } catch (err) {
        console.error("toggleLike:", err);
        alert("Gagal like: " + err.message);
    }
};