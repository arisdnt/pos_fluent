# POS Kasir Suite - Desktop Application

Aplikasi desktop Point of Sale (POS) untuk kasir Indonesia yang dibangun dengan Tauri dan Next.js.

## 🚀 Fitur Utama

- **Native Desktop App**: Dibangun dengan Tauri untuk performa optimal
- **Sidecar Next.js**: Menjalankan aplikasi web Next.js sebagai sidecar process
- **Watchdog System**: Monitoring otomatis dan restart server jika diperlukan
- **System Tray**: Berjalan di background dengan akses melalui system tray
- **Auto-start**: Otomatis memulai server saat aplikasi dibuka
- **Cross-platform**: Mendukung Windows, macOS, dan Linux

## 📋 Persyaratan Sistem

### Minimum Requirements
- **RAM**: 2 GB
- **Storage**: 1 GB ruang kosong
- **OS**: Windows 10+, macOS 10.15+, atau Linux (Ubuntu 18.04+)

### Development Requirements
- **Node.js**: 18.0.0 atau lebih baru
- **Rust**: 1.70 atau lebih baru
- **npm**: 8.0.0 atau lebih baru

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Install Rust (jika belum ada)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Install Node.js dependencies
npm install
```

### 2. Setup Project

```bash
# Install semua dependencies (desktop + web)
npm run setup
```

## 🚀 Development

### Menjalankan Development Server

```bash
# Jalankan aplikasi desktop dalam mode development
npm run dev

# Atau menggunakan Tauri CLI langsung
npm run tauri:dev
```

### Build untuk Production

```bash
# Build aplikasi untuk production
npm run build

# Build dengan debug symbols
npm run build:debug
```

### Testing dan Quality Assurance

```bash
# Jalankan tests
npm test

# Linting dengan Clippy
npm run lint

# Format code
npm run format

# Check compilation
npm run check
```

## 📁 Struktur Project

```
apps/desktop/
├── src-tauri/              # Kode Rust Tauri
│   ├── src/
│   │   ├── main.rs         # Entry point aplikasi
│   │   ├── commands.rs     # Tauri command handlers
│   │   ├── sidecar.rs      # Sidecar manager untuk Next.js
│   │   ├── watchdog.rs     # Watchdog untuk monitoring
│   │   ├── system.rs       # System information
│   │   └── utils.rs        # Utility functions
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Konfigurasi Tauri
│   └── build.rs           # Build script
├── icons/                  # App icons
├── package.json           # Node.js dependencies
└── README.md              # Dokumentasi ini
```

## ⚙️ Konfigurasi

### Tauri Configuration

Konfigurasi utama aplikasi ada di `src-tauri/tauri.conf.json`:

- **Bundle settings**: Identifier, ikon, metadata
- **Window settings**: Ukuran, title, resizable
- **Security**: CSP, permissions
- **Updater**: Auto-update configuration

### Sidecar Configuration

Sidecar Next.js dikonfigurasi di `src/sidecar.rs`:

- **Port range**: 3000-4000 (default)
- **Startup timeout**: 30 detik
- **Health check**: Setiap 5 detik
- **Max restart attempts**: 3 kali

## 🔧 Commands Available

Aplikasi menyediakan berbagai Tauri commands:

### Sidecar Commands
- `start_sidecar`: Memulai server Next.js
- `stop_sidecar`: Menghentikan server
- `restart_sidecar`: Restart server
- `get_sidecar_status`: Status server

### System Commands
- `get_system_info`: Informasi sistem
- `check_port_availability`: Cek ketersediaan port
- `get_available_port`: Cari port yang tersedia

### Watchdog Commands
- `start_watchdog`: Mulai monitoring
- `stop_watchdog`: Hentikan monitoring
- `get_watchdog_status`: Status watchdog

### Utility Commands
- `show_notification`: Tampilkan notifikasi
- `open_external_url`: Buka URL eksternal
- `get_app_version`: Versi aplikasi
- `minimize_to_tray`: Minimize ke system tray

## 🎯 System Tray

Aplikasi berjalan di system tray dengan menu:

- **Tampilkan POS Kasir**: Buka jendela utama
- **Restart Server**: Restart sidecar server
- **Sembunyikan**: Hide jendela
- **Keluar**: Tutup aplikasi

## 🔍 Monitoring & Logging

### Log Levels
- **Development**: Debug level
- **Production**: Info level

### Health Checks
- **Endpoint**: `/api/health`
- **Interval**: 10 detik
- **Timeout**: 5 detik
- **Max failures**: 3 consecutive

## 🚨 Troubleshooting

### Server Tidak Bisa Start
1. Periksa apakah port 3000-4000 tersedia
2. Pastikan Node.js dan npm terinstall
3. Cek log di console untuk error details

### Aplikasi Crash
1. Periksa system requirements
2. Restart aplikasi
3. Cek log file untuk error details

### Performance Issues
1. Tutup aplikasi lain yang tidak perlu
2. Periksa penggunaan RAM dan CPU
3. Restart sistem jika diperlukan

## 📝 Development Notes

### Hot Reload
Dalam development mode, perubahan pada kode Rust akan memicu rebuild otomatis.

### Debugging
- Gunakan `console.log` di frontend
- Gunakan `log::debug!` di Rust backend
- Enable debug mode dengan `npm run build:debug`

### Cross-platform Considerations
- Path handling menggunakan `std::path::Path`
- Process management berbeda per OS
- Icon format berbeda per platform

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 🆘 Support

Jika mengalami masalah:
1. Cek dokumentasi ini
2. Buka issue di GitHub
3. Hubungi tim development

---

**POS Kasir Suite** - Solusi Point of Sale Modern untuk Indonesia 🇮🇩