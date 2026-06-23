async function handleImageUpload(e) {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("File harus image");
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

        const textarea =
            document.getElementById(
                "postContent"
            );

        if (!textarea) {
            throw new Error(
                "Textarea tidak ditemukan"
            );
        }

        textarea.value +=
            `\n\n![image](${path})\n\n`;

        textarea.focus();

        alert(
            "Image berhasil diupload"
        );

    } catch (err) {

        console.error(err);
        alert(
            "Upload gagal"
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

