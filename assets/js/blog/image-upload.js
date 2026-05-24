async function uploadImage(e) {
    requireToken();

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("File harus image.");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function () {
        try {
            const base64 = reader.result.split(',')[1];

            const ext = file.name.split('.').pop();
            const fileName =
                `assets/uploads/${Date.now()}.${ext}`;

            const res = await fetch(
                `https://api.github.com/repos/${REPO_PATH}/contents/${fileName}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Upload image ${file.name}`,
                        content: base64
                    })
                }
            );

            if (!res.ok) {
                throw new Error();
            }

            const imageUrl =
                `${location.origin}/john/${fileName}`;

            const textarea =
                document.getElementById('postContent');

            textarea.value +=
                `\n\n![image](${imageUrl})\n\n`;

            alert("Image berhasil diupload.");
        } catch (err) {
            console.error(err);
            alert("Upload gagal.");
        }
    };

    reader.readAsDataURL(file);
}

window.addEventListener("DOMContentLoaded", () => {
    const input =
        document.getElementById("imageUpload");

    if (input) {
        input.addEventListener(
            "change",
            uploadImage
        );
    }
});
