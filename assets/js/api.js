const REPO_PATH = "onkbaonk/john";
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
    const url = `https://api.github.com/repos/${REPO_PATH}/contents/${fileName}?ref=${BRANCH}&t=${Date.now()}`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Gagal load ${fileName}`);
    }

    const data = await res.json();

    return JSON.parse(atou(data.content));
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

    const content = utoa(JSON.stringify(newObj, null, 4));

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