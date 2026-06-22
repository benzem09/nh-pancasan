// auth.js
let CURRENT_USER = localStorage.getItem("active_user") || "guest";

function updateAuthUI() {
    const userBadge = document.getElementById('user-badge');
    const authBtn = document.getElementById('authActionBtn');
    
    if (!authBtn || !userBadge) return;

    userBadge.innerText = `User: ${CURRENT_USER}`;
    
    if (CURRENT_USER !== "guest") {
        authBtn.innerText = "Logout";
        authBtn.onclick = logout;
        authBtn.className = "bg-red-600/20 text-red-400 border border-red-600 px-4 py-1 rounded-full text-[10px] font-bold";
    } else {
        authBtn.innerText = "Login / Register";
        authBtn.onclick = () => openModal('authModal');
        authBtn.className = "bg-green-600/20 text-green-400 border border-green-600 px-4 py-1 rounded-full text-[10px] font-bold";
    }
}

async function handleLoginRegister() {
    const userInput = document.getElementById('authUser');
    const passInput = document.getElementById('authPass');
    const user = userInput.value.trim().toLowerCase();
    const pass = passInput.value.trim();

    if (!user || !pass) return alert("Isi username dan password!");

    try {
        const file = await getGithubFile('users.json');
        
        if (!file.content[user]) {
            file.content[user] = { 
                password: pass,
                role: "member", 
                bio: "User baru dari index",
                joined: new Date().toISOString() 
            };
            await updateGithubFile('users.json', file.content, file.sha, `Auto-Register: ${user}`);
            alert("Akun baru berhasil dibuat!");
        } else {
            if (file.content[user].password !== pass) {
                return alert("Password salah! Silakan coba lagi.");
            }
        }

        // SIMPAN SESI & ROLE
        localStorage.setItem("active_user", user);
        localStorage.setItem("user_role", file.content[user].role); // Menyimpan role untuk pengecekan fitur
        
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Gagal Login. Cek Token GitHub Anda.");
    }
}

function logout() {
    localStorage.removeItem("active_user");
    localStorage.removeItem("user_role");
    location.reload();
}