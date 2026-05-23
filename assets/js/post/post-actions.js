console.log("post-actions.js loaded");

window.initShareButton =
function(post){

    btnShare.onclick =
    async e=>{
        e.stopPropagation();

        try{

            if(navigator.share){

                await navigator.share({
                    title: post.title,
                    text:
                        `Baca artikel: ${post.title}`,
                    url:
                        location.href
                });

            }else{

                await navigator
                    .clipboard
                    .writeText(location.href);

                alert("Link disalin");
            }

        }catch(err){
            console.log(err);
        }
    };
};