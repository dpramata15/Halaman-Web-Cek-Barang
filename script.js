// 1. Database Stok Awal
const initialInventory = [
    { nama: "Laptop", stok: 5 },
    { nama: "Proyektor", stok: 2 },
    { nama: "Kabel HDMI", stok: 10 }
];

// Fungsi untuk mengisi datalist barang dari stok
function updateAutocompleteBarang() {
    const dataList = document.getElementById('listBarangStok');
    if (!dataList) return;

    // Ambil data stok dari localStorage
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    
    // Kosongkan isi datalist sebelumnya
    dataList.innerHTML = '';

    inventory.forEach(item => {
        // Hanya masukkan ke daftar jika stok masih ada
        if (item.stok > 0) {
            const option = document.createElement('option');
            option.value = item.nama; // Nilai yang akan masuk ke input saat diklik
            // Kita bisa tambah keterangan stok di label agar terlihat saat mengetik
            option.label = `Tersedia: ${item.stok}`; 
            dataList.appendChild(option);
        }
    });
}

// 2. Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('inventory')) {
        localStorage.setItem('inventory', JSON.stringify(initialInventory));
    }

    // Cek elemen secara kondisional (Hanya jalan jika elemen ada di halaman)
    if (document.getElementById('inventoryList')) displayInventory();
    if (document.getElementById('assetTable')) displayAssets();
    if (document.getElementById('historyTable')) displayHistory();
    if (document.getElementById('listBarangStok')) {
        updateAutocompleteBarang();
    }
});

// --- FUNGSI MANAJEMEN STOK (Halaman index.html) ---

function displayInventory() {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    inventoryList.innerHTML = '';

    if (inventory.length === 0) {
        inventoryList.innerHTML = `<li class="list-group-item text-center text-muted py-4">Barang tidak tersedia</li>`;
        return;
    }

    inventory.forEach((item, index) => {
        const isOutOfStock = item.stok <= 0;
        inventoryList.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span class="${isOutOfStock ? 'text-danger fw-bold' : ''}">
                    ${isOutOfStock ? '⚠️ ' : ''}${item.nama}
                </span>
                <div>
                    <span class="badge ${isOutOfStock ? 'bg-danger' : 'bg-success'} rounded-pill me-2">
                        Stok: ${item.stok}
                    </span>
                    <button class="btn btn-outline-danger btn-sm border-0" onclick="removeInventoryItem(${index})">&times;</button>
                </div>
            </li>`;
    });
}

// Event Listener Tambah Stok (Hanya jika form ada)
const addInventoryForm = document.getElementById('addInventoryForm');
if (addInventoryForm) {
    addInventoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('newBarang').value;
        const jumlah = parseInt(document.getElementById('newStok').value);
        let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

        const existingIndex = inventory.findIndex(item => item.nama.toLowerCase() === nama.toLowerCase());
        if (existingIndex !== -1) {
            inventory[existingIndex].stok += jumlah;
        } else {
            inventory.push({ nama: nama, stok: jumlah });
        }

        localStorage.setItem('inventory', JSON.stringify(inventory));
        addInventoryForm.reset();
        displayInventory();
    });
}

function removeInventoryItem(index) {
    if(confirm("Hapus barang ini dari daftar stok?")) {
        let inventory = JSON.parse(localStorage.getItem('inventory'));
        inventory.splice(index, 1);
        localStorage.setItem('inventory', JSON.stringify(inventory));
        displayInventory();
    }
}


// --- FUNGSI PEMINJAMAN (Halaman pinjam.html) ---

const assetForm = document.getElementById('assetForm');
if (assetForm) {
    assetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const namaBarang = document.getElementById('namaBarang').value;
        let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        
        const itemIndex = inventory.findIndex(i => i.nama.toLowerCase() === namaBarang.toLowerCase());

        if (itemIndex === -1) {
            alert("Barang tidak terdaftar di sistem stok!");
            return;
        }
        if (inventory[itemIndex].stok <= 0) {
            alert("Maaf, stok barang sedang habis!");
            return;
        }

        inventory[itemIndex].stok -= 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        
        if (typeof displayInventory === "function") displayInventory();
        updateAutocompleteBarang();
        
        const asset = {
            id: Date.now(),
            nama: inventory[itemIndex].nama, // Pakai nama resmi dari stok
            user: document.getElementById('peminjam').value,
            lokasi: document.getElementById('lokasi').value,
            waktu: new Date().toLocaleString('id-ID')
        };

        let assets = JSON.parse(localStorage.getItem('assets')) || [];
        assets.push(asset);
        localStorage.setItem('assets', JSON.stringify(assets));
        
        // Simpan ke Histori
        let history = JSON.parse(localStorage.getItem('history')) || [];
        history.push({
            idPinjam: asset.id,
            nama: asset.nama,
            user: asset.user,
            lokasi: asset.lokasi,
            waktuPinjam: asset.waktu,
            waktuKembali: '-',
            status: 'Dipinjam'
        });
        localStorage.setItem('history', JSON.stringify(history));

        assetForm.reset();
        displayAssets();
    });
}

function displayAssets() {
    const assetTable = document.getElementById('assetTable');
    if (!assetTable) return;

    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assetTable.innerHTML = assets.length === 0 ? 
        '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada barang yang sedang dipinjam</td></tr>' : '';

    assets.forEach(asset => {
        const row = `<tr>
            <td>${asset.nama}</td>
            <td>${asset.user}</td>
            <td><span class="badge bg-info text-dark">${asset.lokasi}</span></td>
            <td><small>${asset.waktu}</small></td>
            <td><button class="btn btn-success btn-sm" onclick="returnAsset(${asset.id}, '${asset.nama}')">Kembalikan</button></td>
        </tr>`;
        assetTable.innerHTML += row;
    });
}

function returnAsset(id, namaBarang) {
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    const itemIndex = inventory.findIndex(i => i.nama.toLowerCase() === namaBarang.toLowerCase());
    if (itemIndex !== -1) {
        inventory[itemIndex].stok += 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    let history = JSON.parse(localStorage.getItem('history')) || [];
    const historyIndex = history.findIndex(h => h.idPinjam == id && h.status === 'Dipinjam');
    if (historyIndex !== -1) {
        history[historyIndex].waktuKembali = new Date().toLocaleString('id-ID');
        history[historyIndex].status = 'Dikembalikan';
        localStorage.setItem('history', JSON.stringify(history));
    }

    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assets = assets.filter(asset => asset.id != id);
    localStorage.setItem('assets', JSON.stringify(assets));

    displayAssets();
}


// --- FUNGSI HISTORI (Halaman histori.html) ---

function displayHistory() {
    const historyTable = document.getElementById('historyTable');
    if (!historyTable) return;

    let history = JSON.parse(localStorage.getItem('history')) || [];
    historyTable.innerHTML = history.length === 0 ? 
        '<tr><td colspan="6" class="text-center text-muted py-3">Histori kosong</td></tr>' : '';

    [...history].reverse().forEach(h => {
        const badgeClass = h.status === 'Dipinjam' ? 'bg-warning text-dark' : 'bg-success text-white';
        historyTable.innerHTML += `<tr>
            <td>${h.nama}</td>
            <td>${h.user}</td>
            <td><span class="badge bg-light text-dark border">${h.lokasi || '-'}</span></td>
            <td><small>${h.waktuPinjam}</small></td>
            <td><small>${h.waktuKembali}</small></td>
            <td><span class="badge ${badgeClass}">${h.status}</span></td>
        </tr>`;
    });
}

function clearHistory() {
    if(confirm("Hapus semua histori?")) {
        localStorage.removeItem('history');
        displayHistory();
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const btnToggle = document.querySelector('#sidebarCollapse');
    const sidebar = document.querySelector('#sidebar');
    const content = document.querySelector('#main-content');
    const overlay = document.getElementById('overlay');
    const btnIcon = document.querySelector('#btnIcon');

    // 1. Fungsi Toggle Utama
    function toggleSidebar(shouldOpen) {
        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('main-content');
        const overlay = document.getElementById('overlay');

        if (shouldOpen) {
            sidebar.classList.add('active');
            if (content) content.classList.add('active');
            if (overlay) overlay.classList.add('active');
            if (btnIcon) btnIcon.innerText = '✕';
            localStorage.setItem('sidebarState', 'open');
        } else {
            sidebar.classList.remove('active');
            if (content) content.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            if (btnIcon) btnIcon.innerText = '☰';
            localStorage.setItem('sidebarState', 'closed');
        }
    }

    // 2. Inisialisasi Status (Saat Pindah Halaman)
    const sidebarStatus = localStorage.getItem('sidebarState');
    if (sidebarStatus === 'open') {
        // Matikan transisi sementara agar tidak "kedip"
        document.body.classList.add('no-transition');
        toggleSidebar(true);
        // Hidupkan kembali transisi
        setTimeout(() => document.body.classList.remove('no-transition'), 50);
    }

    // 3. Event Listener Klik Tombol Menu
    if (btnToggle) {
        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = sidebar.classList.contains('active');
            toggleSidebar(!isOpen);
        });
    }

    // 4. Event Listener Klik Overlay (Tutup jika klik di luar)
    if (overlay) {
        overlay.addEventListener('click', () => toggleSidebar(false));
    }
    
    // 5. Klik di luar sidebar (untuk mobile)
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !btnToggle.contains(e.target)) {
            toggleSidebar(false);
        }
    });
});