const REPO_PATH = "benzem09/nh-pancasan";
const BRANCH = "main";

let GITHUB_TOKEN = localStorage.getItem("github_token") || "";

function setGithubToken() {
    const token = prompt("Masukkan GitHub Token:");
    if (!token) return;

    GITHUB_TOKEN = token;
    localStorage.setItem("github_token", token);
    alert("Token tersimpan");
}

function requireToken() {
    if (!GITHUB_TOKEN) setGithubToken();
    if (!GITHUB_TOKEN) throw new Error("Token diperlukan");
}

const utoa = (str) => btoa(unescape(encodeURIComponent(str)));
const atou = (str) => decodeURIComponent(escape(atob(str)));


// READ PUBLIC FILE DARI GITHUB RAW

async function getPublicFile(fileName) {
    const res = await fetch(fileName + "?t=" + Date.now());

    if (!res.ok) {
        throw new Error(`Gagal load ${fileName}`);
    }

    return await res.json();
}


// READ FILE DENGAN TOKEN (untuk edit/update)
async function getGithubFile(fileName) {
    requireToken();

    const res = await fetch(
        `https://api.github.com/repos/${REPO_PATH}/contents/${fileName}`,
        {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`
            }
        }
    );

    if (!res.ok) {
        throw new Error(`Gagal ambil ${fileName}`);
    }

    const data = await res.json();

    return {
        content: JSON.parse(atou(data.content)),
        sha: data.sha
    };
}


// CREATE / UPDATE FILE
async function updateGithubFile(fileName, newObj, sha = null, message = "Update file") {
    requireToken();

    const content = utoa(
        typeof newObj === "string"
            ? newObj
            : JSON.stringify(newObj, null, 4)
    );

    const res = await fetch(
        `https://api.github.com/repos/${REPO_PATH}/contents/${fileName}`,
        {
            method: "PUT",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                content,
                sha,
                branch: BRANCH
            })
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error(err);
        throw new Error("Gagal update GitHub file");
    }

    return await res.json();
}

async function uploadGithubImage(file) {

    requireToken();

    if (!file)
        throw new Error("No file");

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = async () => {

            try {

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                let w = img.width;
                let h = img.height;

                const MAX_WIDTH = 1200;

                if (w > MAX_WIDTH) {
                    h =
                        h *
                        (
                            MAX_WIDTH /
                            w
                        );

                    w = MAX_WIDTH;
                }

                canvas.width = w;
                canvas.height = h;

                const ctx =
                    canvas.getContext(
                        "2d"
                    );

                ctx.drawImage(
                    img,
                    0,
                    0,
                    w,
                    h
                );

                const compressed =
                    canvas.toDataURL(
                        "image/webp",
                        0.80
                    );

                const base64 =
                    compressed
                    .split(',')[1];

                const now =
                    new Date();

                const year =
                    now.getFullYear();

                const month =
                    String(
                        now.getMonth() + 1
                    ).padStart(
                        2,
                        '0'
                    );

                const fileName =
                    `img_${Date.now()}_${Math.random().toString(36).slice(2,7)}.webp`;

                const path =
                    `uploads/${year}/${month}/${fileName}`;

                const res =
                    await fetch(
                        `https://api.github.com/repos/${REPO_PATH}/contents/${path}`,
                        {
                            method:
                                "PUT",

                            headers:
                            {
                                Authorization:
                                    `token ${GITHUB_TOKEN}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                            JSON.stringify(
                            {
                                message:
                                    `Upload ${fileName}`,

                                content:
                                    base64
                            })
                        }
                    );

                if (!res.ok) {
                    throw new Error(
                        "Upload gagal"
                    );
                }

                resolve(path);

            } catch (e) {
                reject(e);
            }
        };

        img.onerror =
            () =>
            reject(
                new Error(
                    "Image load gagal"
                )
            );

        img.src =
            URL.createObjectURL(
                file
            );
    });
}