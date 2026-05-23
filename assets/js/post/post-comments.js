console.log("post-comments.js loaded");

window.initComments =
async function(postId,container){

    const wrap =
        document.createElement("div");

    wrap.className = "mt-6";

    container.appendChild(wrap);

    const res =
        await fetch(
            "components/comment-section.html"
        );

    wrap.innerHTML =
        await res.text();

    const name =
        document.getElementById(
            "commentName"
        );

    if(name){

        name.value =
            localStorage.getItem(
                "commentName"
            ) || "";
    }

    const btn =
        document.getElementById(
            "commentBtn"
        );

    if(btn){

        btn.onclick =
            ()=>submitComment(postId);
    }

    if(typeof loadComments==="function"){

        await loadComments(postId);
    }
};