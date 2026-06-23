console.log("views.js loaded");

window.loadViews = async function(postId) {
    const viewCount = document.getElementById("viewCount");
    if (!viewCount) return;

    try {
        const docRef = db.collection("views").doc(String(postId));
        const snap = await docRef.get();

        if (snap.exists) {
            viewCount.innerText = snap.data().count || 0;
        } else {
            viewCount.innerText = 0;
        }

    } catch (err) {
        console.error("loadViews:", err);
    }
};


window.addView = async function(postId) {
    const key = `viewed_${postId}`;

    // hitung 1x per session
    if (sessionStorage.getItem(key)) {
        await loadViews(postId);
        return;
    }

    try {
        const docRef = db.collection("views").doc(String(postId));
        const snap = await docRef.get();

        if (snap.exists) {

            const current =
                snap.data().count || 0;

            await docRef.update({
                count: current + 1
            });

        } else {

            await docRef.set({
                count: 1
            });
        }

        sessionStorage.setItem(key, "true");

        await loadViews(postId);

        const viewCount =
            document.getElementById("viewCount");

        if (viewCount) {
            showViewPopup(viewCount.innerText);
        }

    } catch (err) {
        console.error("addView:", err);
    }
};

