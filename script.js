const assetForm = document.getElementById('assetForm');
const assetTable = document.getElementById('assetTable');
const inventoryList = document.getElementById('inventoryList');
const historyTable = document.getElementById('historyTable');

// 1. Database Stok Awal (Hanya dibuat jika belum ada di LocalStorage)
const initialInventory = [
    { nama: "Laptop", stok: 5 },
    { nama: "Proyektor", stok: 2 },
    { nama: "Kabel HDMI", stok: 10 }
];

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('inventory')) {
        localStorage.setItem('inventory', JSON.stringify(initialInventory));
    }
    displayInventory();
    displayAssets();
    displayHistory();
});

// 2. Fungsi Menampilkan Stok
function displayInventory() {
    let inventory = JSON.parse(localStorage.getItem('inventory'));
    inventoryList.innerHTML = '';
    inventory.forEach((item, index) => {
        inventoryList.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${item.nama}
                <div>
                    <span class="badge ${item.stok > 0 ? 'bg-success' : 'bg-danger'} rounded-pill me-2">
                        Stok: ${item.stok}
                    </span>
                    <button class="btn btn-outline-danger btn-sm border-0" onclick="removeInventoryItem(${index})">&times;</button>
                </div>
            </li>
        `;
    });
}

// Fungsi menghapus item dari inventory secara permanen
function removeInventoryItem(index) {
    if(confirm("Hapus barang ini dari daftar stok?")) {
        let inventory = JSON.parse(localStorage.getItem('inventory'));
        inventory.splice(index, 1);
        localStorage.setItem('inventory', JSON.stringify(inventory));
        displayInventory();
    }
}
    const addInventoryForm = document.getElementById('addInventoryForm');

    // Event saat form tambah stok dikirim
    addInventoryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nama = document.getElementById('newBarang').value;
        const jumlah = parseInt(document.getElementById('newStok').value);

        let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

        // Cek apakah barang sudah ada
        const existingIndex = inventory.findIndex(item => item.nama.toLowerCase() === nama.toLowerCase());

        if (existingIndex !== -1) {
           // Jika sudah ada, tambahkan stoknya
            inventory[existingIndex].stok += jumlah;
        } else {
            // Jika belum ada, tambah item baru
           inventory.push({ nama: nama, stok: jumlah });
        }

        // Simpan ke LocalStorage
        localStorage.setItem('inventory', JSON.stringify(inventory));
    
        // Reset form dan refresh tampilan
        addInventoryForm.reset();
        displayInventory();
    });


// 3. Event saat form dikirim (Peminjaman)
assetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const namaBarang = document.getElementById('namaBarang').value;
    let inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Cari barang di inventory
    const itemIndex = inventory.findIndex(i => i.nama.toLowerCase() === namaBarang.toLowerCase());

    if (itemIndex === -1) {
        alert("Barang tidak terdaftar di sistem stok!");
        return;
    }

    if (inventory[itemIndex].stok <= 0) {
        alert("Maaf, stok barang sedang habis!");
        return;
    }

    // Kurangi stok
    inventory[itemIndex].stok -= 1;
    localStorage.setItem('inventory', JSON.stringify(inventory));

    const asset = {
        id: Date.now(),
        nama: namaBarang,
        user: document.getElementById('peminjam').value,
        lokasi: document.getElementById('lokasi').value,
        waktu: new Date().toLocaleString('id-ID')
    };

    saveAsset(asset);
    assetForm.reset();
    displayInventory();
    displayAssets();
});

function saveAsset(asset) {
    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assets.push(asset);
    localStorage.setItem('assets', JSON.stringify(assets));
    
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
    displayHistory();
}

function displayAssets() {
    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assetTable.innerHTML = '';

    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.nama}</td>
            <td>${asset.user}</td>
            <td><span class="badge bg-info text-dark">${asset.lokasi}</span></td>
            <td><small>${asset.waktu}</small></td>
            <td><button class="btn btn-success btn-sm" onclick="returnAsset(${asset.id}, '${asset.nama}')">Kembalikan</button></td>
        `;
        assetTable.appendChild(row);
    });
}

// 4. Fungsi Pengembalian (Tambah stok kembali)
function returnAsset(id, namaBarang) {
    // 1. Update Stok di Inventory
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    const itemIndex = inventory.findIndex(i => i.nama.toLowerCase() === namaBarang.toLowerCase());
    
    if (itemIndex !== -1) {
        inventory[itemIndex].stok += 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    // 2. Update Histori (Bagian yang sering bermasalah)
    let history = JSON.parse(localStorage.getItem('history')) || [];
    // Pastikan membandingkan ID dengan benar (menggunakan == jika ragu tipe datanya String/Number)
    const historyIndex = history.findIndex(h => h.idPinjam == id && h.status === 'Dipinjam');
    
    if (historyIndex !== -1) {
        history[historyIndex].waktuKembali = new Date().toLocaleString('id-ID');
        history[historyIndex].status = 'Dikembalikan';
        localStorage.setItem('history', JSON.stringify(history));
    }

    // 3. Hapus dari daftar barang yang sedang dipinjam
    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assets = assets.filter(asset => asset.id != id);
    localStorage.setItem('assets', JSON.stringify(assets));

    // 4. Refresh semua tampilan
    displayInventory();
    displayAssets();
    displayHistory();
}

function displayHistory() {
    const historyTable = document.getElementById('historyTable');
    if (!historyTable) return; // Mencegah error jika elemen tidak ada

    let history = JSON.parse(localStorage.getItem('history')) || [];
    
    if (!historyTable) {
        console.warn("Elemen 'historyTable' tidak ditemukan di HTML!");
        return; 
    }

    // Kosongkan tabel sebelum diisi
    historyTable.innerHTML = '';

    // Render dari yang paling baru
    [...history].reverse().forEach(h => {
        const row = document.createElement('tr');
        const badgeClass = h.status === 'Dipinjam' ? 'bg-warning text-dark' : 'bg-success text-white';
        
        row.innerHTML = `
            <td>${h.nama}</td>
            <td>${h.user}</td>
            <td><span class="badge bg-light text-dark border">${h.lokasi || '-'}</span></td> <td><small>${h.waktuPinjam}</small></td>
            <td><small>${h.waktuKembali}</small></td>
            <td><span class="badge ${badgeClass}">${h.status}</span></td>
        `;
        historyTable.appendChild(row);
    });
}

function clearHistory() {
    if(confirm("Apakah Anda yakin ingin menghapus semua catatan histori?")) {
        localStorage.removeItem('history');
        displayHistory();
    }
}

// 5. Logika Perubahan Panah (Pindahkan ke luar fungsi manapun)
document.addEventListener('DOMContentLoaded', function() {
    const collapsibleElement = document.getElementById('inventoryCollapse');
    const iconPanah = document.getElementById('iconPanah');

    // Listener 1: Saat proses membuka dimulai
    collapsibleElement.addEventListener('show.bs.collapse', function () {
        iconPanah.innerText = '▲';
    });

    // Listener 2: Saat proses menutup dimulai
    collapsibleElement.addEventListener('hide.bs.collapse', function () {
        iconPanah.innerText = '▼';
    });

    // Listener 3: Pengaman tambahan jika user klik sangat cepat
    collapsibleElement.addEventListener('shown.bs.collapse', function () {
        iconPanah.innerText = '▲';
    });
    
    collapsibleElement.addEventListener('hidden.bs.collapse', function () {
        iconPanah.innerText = '▼';
    });
});
