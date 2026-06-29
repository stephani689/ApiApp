# Premium Catalog ✨ — Misi 11: Build Your Own API App

Aplikasi mobile berbasis React Native (Expo) yang mengonsumsi REST API untuk menampilkan katalog produk e-commerce secara interaktif. Aplikasi ini dirancang dengan arsitektur UI 3-state yang kokoh, dilengkapi optimasi list komponen, fitur pencarian, filter kategori dinamis, dan sistem pengurutan data (*sorting*).

---

## 🚀 Fitur Aplikasi

### 🟢 Level 1 — Fitur Wajib (Core)
- [x] **Data Fetching:** Mengambil data produk dari REST API menggunakan metode `async/await` bawaan `fetch`.
- [x] **3-State UI Handling:** Pemisahan kondisi antarmuka yang jelas saat **Loading** (menampilkan spinner), **Error** (menampilkan pesan kesalahan), dan **Success** (menampilkan data utama).
- [x] **Try / Catch / Finally:** Penanganan error yang aman di mana *loading indicator* dijamin selalu dimatikan pada blok `finally`.
- [x] **FlatList Optimization:** Menampilkan daftar produk menggunakan `<FlatList>` lengkap dengan penentuan properti `keyExtractor` dan komponen `renderItem`.
- [x] **Robust Retry Button:** Tombol "Coba Lagi" pada layar error yang berfungsi penuh untuk memicu ulang fungsi *fetching* data.

### 🟡 Level 2 — Pengembangan (Pilihan Fitur)
- [x] **🔄 Pull-to-Refresh:** Pengguna dapat menarik layar ke bawah untuk melakukan *refresh* atau memuat ulang data katalog terbaru.
- [x] **🔎 Search / Filter:** Kolom input pencarian teks (`TextInput`) untuk menyaring judul produk secara lokal (*client-side*).
- [x] **📄 Layar Detail (Modal):** Mengetuk kartu produk akan membuka layar detail dengan informasi lengkap (termasuk deskripsi dan rating bersarang) memanfaatkan komponen `<Modal>`.
- [x] **🗂️ Filter Kategori (Chips):** Tombol *chips* horizontal yang dibuat secara dinamis berdasarkan kategori unik langsung dari data JSON API.
- [x] **🎨 Empty State:** Tampilan informatif dan ramah ketika hasil pencarian atau filter kategori tidak ditemukan (mencegah layar blank).

### 🔴 Level 3 — Tantangan Bonus (Advanced)
- [x] **↕️ Smart Sorting System:** Memungkinkan pengguna mengurutkan produk secara instan berdasarkan **Harga Termurah**, **Harga Termahal**, atau **Abjad Nama (A-Z)**.

---

## 🌐 API yang Digunakan

Aplikasi ini menggunakan **FakeStore API** (`https://fakestoreapi.com/products`) tanpa menggunakan API Key. 

Berikut adalah contoh struktur data JSON asli yang berhasil dipetakan ke dalam UI:
```json
{
  "id": 1,
  "title": "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
  "price": 109.95,
  "description": "Your perfect pack for everyday use...",
  "category": "men's clothing",
  "image": "[https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg](https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg)",
  "rating": { "rate": 3.9, "count": 120 }
}
