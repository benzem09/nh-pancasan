console.log("comments.js loaded");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAwRLJ11sfU3X0CPC5c_JyvoGjf13vTYzk",
  authDomain: "nh-pancasan.firebaseapp.com",
  projectId: "nh-pancasan",
  storageBucket: "nh-pancasan.firebasestorage.app",
  messagingSenderId: "979480864440",
  appId: "1:979480864440:web:e5c3a9fc16a9d0a236b64d",
  measurementId: "G-NMSD3751S"
};

// init firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// LOAD COMMENT COMPONENT
window.loadCommentSection = async function(postId) {

    const container =
        document.getElementById(
            "viewContent"
        );

    if (!container) return;

    const commentWrap =
        document.createElement("div");

    commentWrap.className = "mt-6";

    container.appendChild(
        commentWrap
    );

    try {

        const res =
            await fetch(
                "components/comment-section.html"
            );

        if (!res.ok) {
            throw new Error(
                "comment component gagal"
            );
        }

        commentWrap.innerHTML =
            await res.text();

        // isi nama tersimpan
        const commentName =
            document.getElementById(
                "commentName"
            );

        if (commentName) {
            commentName.value =
                localStorage.getItem(
                    "commentName"
                ) || "";
        }

        // tombol submit
        const commentBtn =
            document.getElementById(
                "commentBtn"
            );

        if (commentBtn) {
            commentBtn.onclick =
                () => submitComment(
                    postId
                );
        }

        // load komentar
        await loadComments(
            postId
        );

    } catch (err) {

        console.error(
            "Comment component error:",
            err
        );

        commentWrap.innerHTML = `
            <div class="text-xs opacity-60 mt-4">
                Gagal memuat komentar
            </div>
        `;
    }
};


// LOAD COMMENTS
window.loadComments = async function(postId) {

    const container =
        document.getElementById(
            "commentList"
        );

    if (!container) return;

    container.innerHTML =
        "Memuat komentar...";

    try {

        const snap =
            await db
                .collection("posts")
                .doc(String(postId))
                .collection("comments")
                .orderBy(
                    "createdAt",
                    "desc"
                )
                .get();

        if (snap.empty) {

            container.innerHTML = `
                <p class='opacity-50 text-xs'>
                    Belum ada komentar
                </p>
            `;

            return;
        }

        let html = "";

        snap.forEach(doc => {

            const c =
                doc.data();

            const date =
                new Date(
                    c.createdAt
                );

            const dateString =
                date.toLocaleDateString(
                    "id-ID",
                    {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }
                );

            html += `
                <div class="mb-3 border-b border-[var(--border)] pb-2">
                    <div class="flex justify-between text-[10px] text-[var(--primary)] font-bold mb-0.5">
                        <span>👤 ${c.name}</span>
                        <span class="text-[var(--text-soft)] font-medium">${c.date || ''}</span>
                    </div>
                    <p class="text-xs text-[var(--text-main)] leading-relaxed font-medium">${c.text}</p>
                </div>
            `;
        });

        container.innerHTML =
            html;

    } catch (err) {

        console.error(err);

        container.innerHTML =
            "Gagal load komentar";
    }
};


// SUBMIT COMMENT
window.submitComment = async function(postId) {

    const input =
        document.getElementById(
            "commentInput"
        );

    const nameInput =
        document.getElementById(
            "commentName"
        );

    const btn =
        document.getElementById(
            "commentBtn"
        );

    if (!input || !btn) return;

    const text =
        input.value.trim();

    const name =
        nameInput?.value.trim()
        || "guest";

    if (!text) {
        alert(
            "Komentar kosong"
        );
        return;
    }

    localStorage.setItem(
        "commentName",
        name
    );

    try {

        btn.disabled = true;
        btn.innerText =
            "Mengirim...";

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

        await loadComments(
            postId
        );

    } catch (err) {

        console.error(err);

        alert(
            "Gagal kirim komentar: "
            + err.message
        );

    } finally {

        btn.disabled = false;
        btn.innerText =
            "Kirim";
    }
};


// LOAD LIKES
window.loadLikes = async function(postId) {

    const likeCount =
        document.getElementById(
            "likeCount"
        );

    if (!likeCount) return;

    try {

        const docRef =
            db.collection(
                "likes"
            ).doc(
                String(postId)
            );

        const snap =
            await docRef.get();

        if (snap.exists) {
            likeCount.innerText =
                snap.data().count || 0;
        } else {
            likeCount.innerText = 0;
        }

    } catch (err) {

        console.error(
            "loadLikes:",
            err
        );
    }
};


// TOGGLE LIKE
window.toggleLike = async function(postId) {

    const key =
        `liked_${postId}`;

    if (
        localStorage.getItem(
            key
        )
    ) {

        alert(
            "Kamu sudah like"
        );

        return;
    }

    try {

        const docRef =
            db.collection(
                "likes"
            ).doc(
                String(postId)
            );

        const snap =
            await docRef.get();

        if (snap.exists) {

            const current =
                snap.data().count || 0;

            await docRef.update({
                count:
                    current + 1
            });

        } else {

            await docRef.set({
                count: 1
            });
        }

        localStorage.setItem(
            key,
            "true"
        );

        await loadLikes(
            postId
        );

    } catch (err) {

        console.error(
            "toggleLike:",
            err
        );

        alert(
            "Gagal like: "
            + err.message
        );
    }
};