# Onkbaonk Hub

Static Git-Powered Blog CMS built with GitHub API, Markdown rendering, token-based publishing, and zero backend cost.

---

## Overview

Onkbaonk Hub adalah platform blogging minimalis berbasis static architecture.

Project ini dibuat untuk:

- membaca artikel secara publik tanpa login
- create/edit/delete post hanya menggunakan GitHub Token
- menggunakan GitHub repository sebagai storage database gratis
- tanpa backend tradisional
- ringan, fleksibel, dan cocok untuk project hobby/personal

---

## Features

### Public Access
- Semua visitor dapat membaca artikel tanpa login
- Blog list tampil publik
- Full post modal popup reader

### Author Access
- Create post
- Edit post
- Delete post
- Token-based access (tanpa register/login)

### Storage Architecture
- GitHub repository sebagai database
- JSON-based content
- Sharding per post

### Content Rendering
- Markdown support via Marked.js
- HTML fallback support
- Responsive table
- Heading, list, blockquote, code block

### UI
- Responsive modal popup
- Mobile optimized
- Category filter
- Search post
- About page

### SEO
- Slug article URL
- Canonical URL
- Meta description
- Search engine friendly

---

# Tech Stack

- HTML
- TailwindCSS
- Vanilla JavaScript
- GitHub API
- Marked.js

---

# Project Structure update 2.2

```bash
project/
├── OneSignalSDKUpdaterWorker.js
├── OneSignalSDKWorker.js
├── README.md
├── assets
│   ├── css
│   │   └── style.css
│   │
│   ├── icons
│   │   ├── article.svg
│   │   ├── bell.svg
│   │   ├── close.svg
│   │   ├── download.svg
│   │   ├── github.svg
│   │   ├── home.svg
│   │   ├── menu.svg
│   │   ├── refresh.svg
│   │   ├── search.svg
│   │   └── share.svg
│   │
│   ├── img
│   │   ├── articel.jpg
│   │   ├── file1.jpg
│   │   ├── file2.jpg
│   │   ├── file3.jpg
│   │   ├── hompage.jpg
│   │   ├── logo.png
│   │   ├── logo1.png
│   │   ├── preview.png
│   │   └── toc.jpg
│   │
│   └── js
│       ├── api.js
│       ├── auth.js
│       ├── blog
│       │   ├── archive.js
│       │   ├── blog-feed.js
│       │   ├── categories.js
│       │   ├── config.js
│       │   ├── fab.js
│       │   ├── helpers.js
│       │   ├── init.js
│       │   ├── post-crud.js
│       │   ├── post-viewer.js
│       │   ├── router.js
│       │   └── search.js
│       │
│       └── main.js
│
├── components
│   ├── about-me.html
│   ├── header.html
│   ├── modals.html
│   ├── navigation.html
│   ├── section-about.html
│   ├── section-archive.html
│   ├── section-blog.html
│   └── section-categories.html
│
├── google6dd966dc7e3abdd5.html
├── index.html
├── indices
│   │
│   ├── 2026
│   │   ├── 05
│   │   │   └── index_05.json
│   │   └── months.json
│   │
│   └── years.json
│
├── manifest.json
├── posts
│   └── 2026
│       └── 05
│           ├── post.json
│
├── robots.txt
├── sitemap.xml
├── sw.js
└── users.json

5 => 14 directories, 18 => 58 files
```

---

# Architecture

## Blog Index

File ringan untuk list artikel:

```json
[
  {
    "id": 1711111111,
    "title": "Belajar Nahwu",
    "author": "admin",
    "category": "Tutorial",
    "date": "2026-05-03"
  }
]
```

Digunakan untuk:
- homepage
- category
- search

---

## Post Sharding

Setiap artikel disimpan terpisah:

```bash
posts/post_1711111111.json
```

Isi:

```json
{
  "id": 1711111111,
  "title": "Belajar Nahwu",
  "content": "# Judul\nIsi artikel...",
  "category": "Tutorial",
  "author": "admin",
  "date": "2026-05-03"
}
```

Keuntungan:
- ringan
- scalable
- tidak load semua post sekaligus

---

# Authentication System

Tidak menggunakan login/register.

Menggunakan GitHub Personal Access Token.

Flow:

1. User biasa baca publik
2. Owner klik create/edit/delete
3. Sistem meminta token
4. Token disimpan di localStorage

```js
localStorage.setItem("github_token", token)
```

---

# Security

## Aman untuk public repo?

Ya, selama:

- token tidak hardcoded
- token tidak di-commit ke repository

Contoh salah:

```js
const GITHUB_TOKEN = "ghp_xxx"
```

JANGAN.

Contoh benar:

```js
let GITHUB_TOKEN = localStorage.getItem("github_token") || "";
```

---

## Recommended GitHub Token Permission

Gunakan permission minimum:

- Contents: Read and Write

Tidak perlu:
- Admin
- Workflow
- Secrets
- Packages

---

## New Updates (v2.2)

### Archive System
Blog kini menggunakan sistem archive bertingkat:

- Year archive (`indices/years.json`)
- Month archive (`indices/YYYY/months.json`)
- Monthly post index (`indices/YYYY/MM/index_MM.json`)

Contoh struktur:

```bash
indices/
└── 2026
    ├── months.json
    └── 05
        └── index_05.json
```

Benefit:
- scalable untuk banyak post
- loading lebih ringan
- archive navigation seperti blog besar

---

### Archive Tab
Menambahkan tab khusus Archive.

Features:
- list tahun aktif
- list bulan per tahun
- jumlah post per bulan
- klik archive → tampil semua post bulan tersebut

Flow:

Archive → Year → Month → Posts → Full Post

---

### New Post Storage Structure
Post kini tersimpan berdasarkan tahun & bulan:

```bash
posts/
└── 2026
    └── 05
        └── post_1778832824490.json
```

Benefit:
- file lebih terorganisir
- mudah maintenance
- scalable archive

---

### Floating Action System
Full post reader memiliki floating tools:

- Close
- Search in Post
- Native Share
- Download (.md / .html / .pdf)
- Table of Contents

Features:
- auto hide FAB
- draggable feel
- mobile optimized

---

### Full Post Viewer
Modal reader upgrade:

- popup full article
- markdown rendering
- responsive content
- sticky floating tools
- PDF export
- HTML export
- Markdown export

---

### Layout Mode Toggle
Menambahkan mode tampilan:

- Normal width
- Wide layout mode

Features:
- toggle layout
- saved in localStorage
- responsive desktop/mobile

---

### Instant UI Update
CRUD kini update UI tanpa reload penuh.

Supported:
- create post instant render
- edit instant update
- delete instant remove

Benefit:
- UX lebih cepat
- tidak menunggu full refresh GitHub

---

### Cache Busting System
Semua JSON fetch menggunakan auto timestamp:

```js
fileName + "?t=" + Date.now()
```

Benefit:
- browser tidak cache JSON lama
- update post langsung muncul

---

### Component Architecture
Project kini fully modular:

```bash
components/
├── header.html
├── navigation.html
├── modals.html
├── section-blog.html
├── section-categories.html
├── section-archive.html
└── section-about.html
```

Benefit:
- maintainable
- reusable
- cleaner architecture


# Setup From Zero

---

## 1. Clone Repository

```bash
git clone https://github.com/onkbaonk/onkhub.git
cd repo
```
## Sebelum Menjalankan Aplikasi
 Update package & Install Python/Git:
   ```bash
   pkg update && pkg upgrade
   pkg install python git
   ```
Terus Buka Polder .git Cari File Config, Ganti Repository Oonk Dengan Repository Anda,
Dan Polder assets/api.js Masukan USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA
Terus Git Push Dulu, Setelah Selesai Push

## Publish Repo

Repo ganti menjadi public.

Karena:
- read public
- write token only


## 2. Jalankan Local Server

Python:

```bash
python -m http.server 8080
```

Buka:

```bash
http://localhost:8080
```

---

## 3. Buat GitHub Token

GitHub:

Settings  
→ Developer Settings  
→ Personal Access Tokens

Permission:

- Contents: Read and Write

Copy token.

---

## 4. Set Token

Saat create/edit/delete:

system prompt:

```txt
Masukkan GitHub Token
```

Token disimpan otomatis.

 
# Markdown Support

Menulis artikel:

```md
# Judul

Isi artikel.

## Table

| Nama | Arti |
|---|---|
| Isim | Kata benda |
| Fi'il | Kata kerja |

> Quote
```

---

## HTML Fallback

Bisa pakai HTML:

```html
<table>
<tr>
<th>Nama</th>
<th>Arti</th>
</tr>
<tr>
<td>Isim</td>
<td>Kata benda</td>
</tr>
</table>
```

---

# Responsive Table

Table otomatis scroll horizontal di mobile.

Hanya table yang scroll, bukan seluruh artikel.

---

# Available Tabs

- Blog
- Categories
- About

---

# About Project

Onkbaonk Hub is a lightweight static CMS powered by GitHub API.

Built for:
- hobby blogging
- notes
- documentation
- lightweight publishing

---

# Future Roadmap

- Syntax highlight
- Analytics
- Image upload external CDN
- Pagination
- Sitemap.xml generator
- RSS feed
- Open Graph preview

---

# Why This Project?

Traditional stack:

- Hosting
- Database
- Backend
- Maintenance cost

This project avoids all of that.

Benefits:

- $0 hosting cost
- zero backend
- public content
- secure owner publishing

---

# Philosophy

> Built on static architecture.  
> Powered by Git.  
> Secured by token access.

---

# License

MIT License

---

Version: v2.2
Status: Stable
Architecture: Static Git CMS + Archive Sharding

### 📸 Screenshot Aplikasi
<p align="center">
<img src="assets/img/hompage.jpg" width="45%" />
<img src="assets/img/articel.jpg" width="45%" />
</p>
<p align="center">
<img src="assets/img/toc.jpg" width="45%" />
<img src="assets/img/file1.jpg" width="45%" />
</p>
<p align="center">
<img src="assets/img/file2.jpg" width="45%" />
<img src="assets/img/file3.jpg" width="45%" />
</p>

# Author

Onkbaonk Hub  
Built for learning, experimentation, and minimalist publishing.
