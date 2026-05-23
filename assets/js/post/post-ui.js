console.log("post-ui.js loaded");
    // table wrapper  
    container.querySelectorAll("table").forEach(table => {  
        const wrapper = document.createElement("div");  
        wrapper.className = "table-wrapper";  
        table.parentNode.insertBefore(wrapper, table);  
        wrapper.appendChild(table);  
    });  

    // TOC  
    if (typeof generateTOC === "function") {  
      generateTOC();  
        
    }  

    fab.classList.remove("hidden");  

    // TOC button  
    document.getElementById('btnToc').onclick = (e) => {  
        e.stopPropagation();  
        toggleFabPopup('tocPopup');  
    };  
      
    //SEARCH button  
    document.getElementById('btnSearch').onclick = (e) => {  
      e.stopPropagation();  
      toggleFabPopup('searchPopup');  
        
    };  
    const searchInput = document.getElementById("searchInPost");  
    if (searchInput) {  
      searchInput.addEventListener("input", function () {  
        highlightText(this.value);  
          
      });  
        
    }  

    // SHARE native android  
    document.getElementById('btnShare').onclick = async (e) => {  
        e.stopPropagation();  

        try {  
            if (navigator.share) {  
                await navigator.share({  
                    title: post.title || document.title,  
                    text: `Baca artikel: ${post.title}`,  
                    url: window.location.href  
                });  
            } else {  
                await navigator.clipboard.writeText(window.location.href);  
                alert("Link disalin!");  
            }  
        } catch (err) {  
            console.log("Share dibatalkan");  
        }  
    };  
window.wrapTables = function(){

    document
        .querySelectorAll("#viewContent table")
        .forEach(table => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "table-wrapper";

            table.parentNode.insertBefore(
                wrapper,
                table
            );

            wrapper.appendChild(table);
        });
};

// popup toggle
function toggleFabPopup(id) {
const target = document.getElementById(id);
const isHidden = target.classList.contains('hidden');

document.querySelectorAll('.fab-popup')  
    .forEach(p => p.classList.add('hidden'));  

if (isHidden) target.classList.remove('hidden');

}

window.initPostUI = function(){

    btnToc.onclick = e=>{
        e.stopPropagation();
        toggleFabPopup('tocPopup');
    };

    btnSearch.onclick = e=>{
        e.stopPropagation();
        toggleFabPopup('searchPopup');
    };

    btnDownload.onclick = e=>{
        e.stopPropagation();
        toggleFabPopup('downloadPopup');
    };

    const searchInput =
        document.getElementById(
            "searchInPost"
        );

    if(searchInput){

        searchInput.addEventListener(
            "input",
            function(){
                highlightText(this.value);
            }
        );
    }
};
