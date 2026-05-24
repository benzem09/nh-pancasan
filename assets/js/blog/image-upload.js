async function handleImageUpload(e) {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("File harus gambar.");
        return;
    }

    try {

        const btn =
            document.getElementById(
                "btnUploadImage"
            );

        if (btn) {
            btn.innerText =
                "Uploading...";
            btn.disabled = true;
        }

        const path =
            await uploadGithubImage(file);

        const markdown =
            `\n\n![image](${path})\n\n`;

        const textarea =
            document.getElementById(
                "postContent"
            );

        textarea.value += markdown;

        alert(
            "Image berhasil diupload."
        );

    } catch (e) {

        console.error(e);
        alert(
            "Upload gagal."
        );

    } finally {

        const btn =
            document.getElementById(
                "btnUploadImage"
            );

        if (btn) {
            btn.innerText =
                "📷 Upload";
            btn.disabled = false;
        }

        e.target.value = "";
    }
}

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            document.getElementById(
                "imageUpload"
            );

        if (input) {
            input.addEventListener(
                "change",
                handleImageUpload
            );
        }
    }
);

