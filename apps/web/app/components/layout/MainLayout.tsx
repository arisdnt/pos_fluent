'use client';

import React, { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens,
  Button,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Badge,
  Tooltip,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner
} from '@fluentui/react-components';
import {
  NavigationRegular,
  HomeRegular,
  CartRegular,
  BoxRegular,
  PeopleRegular,
  DocumentTableRegular,
  SettingsRegular,
  SignOutRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  PersonRegular,
  ClockRegular,
  MoneyRegular,
  AlertRegular
} from '@fluentui/react-icons';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    fontFamily: tokens.fontFamilyBase
  },
  navbar: {
    height: '48px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    gap: '12px'
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusCircular,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundOnBrand
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  menuButton: {
    padding: '6px 12px',
    borderRadius: tokens.borderRadiusMedium,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  menuButtonActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  content: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1
  },
  statusBar: {
    height: '32px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  shiftInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
});

// ======================================================================
// TYPES
// ======================================================================

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Shift {
  id: string;
  number: string;
  startTime: Date;
  cashier: string;
  status: 'active' | 'closed';
}

interface MainLayoutProps {
  children: React.ReactNode;
  user?: User;
  shift?: Shift;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

// ======================================================================
// NAVIGATION ITEMS
// ======================================================================

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactElement;
  items: NavigationItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'transaksi',
    label: 'Transaksi',
    icon: <CartRegular />,
    items: [
      {
        id: 'pos',
        label: 'Point of Sale',
        icon: <CartRegular />,
        path: '/pos'
      },
      {
        id: 'orders',
        label: 'Pesanan',
        icon: <MoneyRegular />,
        path: '/orders'
      }
    ]
  },
  {
    id: 'manajemen',
    label: 'Manajemen',
    icon: <BoxRegular />,
    items: [
      {
        id: 'products',
        label: 'Produk',
        icon: <BoxRegular />,
        path: '/products'
      },
      {
        id: 'customers',
        label: 'Pelanggan',
        icon: <PeopleRegular />,
        path: '/customers'
      },
      {
        id: 'inventory',
        label: 'Inventori',
        icon: <BoxRegular />,
        path: '/inventory'
      }
    ]
  },
  {
    id: 'laporan',
    label: 'Laporan',
    icon: <DocumentTableRegular />,
    items: [
      {
        id: 'reports',
        label: 'Laporan Penjualan',
        icon: <DocumentTableRegular />,
        path: '/reports'
      }
    ]
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: <SettingsRegular />,
    items: [
      {
        id: 'settings',
        label: 'Pengaturan Sistem',
        icon: <SettingsRegular />,
        path: '/settings'
      }
    ]
  }
];

// Dashboard sebagai item terpisah
const dashboardItem: NavigationItem = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: <HomeRegular />,
  path: '/dashboard'
};

// ======================================================================
// MAIN LAYOUT COMPONENT
// ======================================================================

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user = {
    id: 'user1',
    name: 'Admin Kasir',
    email: 'admin@kasir.com',
    role: 'Administrator'
  },
  shift = {
    id: 'shift1',
    number: 'SH-001',
    startTime: new Date(),
    cashier: 'Admin Kasir',
    status: 'active'
  },
  onNavigate,
  onLogout,
  onThemeToggle,
  isDarkMode = false
}) => {
  const styles = useStyles();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const theme = isDarkMode ? webDarkTheme : webLightTheme;

  const handleNavigation = (item: NavigationItem) => {
    setActiveItem(item.id);
    onNavigate?.(item.path);
  };

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    onLogout?.();
  };

  const formatShiftTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };



  return (
    <FluentProvider theme={theme}>
      <div className={styles.root}>
        {/* Navbar */}
        <nav className={styles.navbar}>
          <div className={styles.navbarLeft}>
            {/* Logo */}
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <CartRegular />
              </div>
              <Text size={500} weight="semibold">
                POS Suite
              </Text>
            </div>

            {/* Navigation Menu */}
            <div className={styles.navMenu}>
              {/* Dashboard */}
              <Button
                appearance="subtle"
                className={`${styles.menuButton} ${
                  activeItem === dashboardItem.id ? styles.menuButtonActive : ''
                }`}
                icon={dashboardItem.icon}
                onClick={() => handleNavigation(dashboardItem)}
              >
                {dashboardItem.label}
              </Button>

              {/* Dropdown Menus */}
              {menuGroups.map((group) => (
                <Menu key={group.id}>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="subtle"
                      className={`${styles.menuButton} ${
                        group.items.some(item => item.id === activeItem) ? styles.menuButtonActive : ''
                      }`}
                      icon={group.icon}
                    >
                      {group.label}
                    </Button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {group.items.map((item) => (
                        <MenuItem
                          key={item.id}
                          icon={item.icon}
                          onClick={() => handleNavigation(item)}
                        >
                          {item.label}
                          {item.badge && (
                            <Badge
                              appearance="filled"
                              color="danger"
                              size="small"
                              style={{ marginLeft: 'auto' }}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              ))}
            </div>
          </div>

          <div className={styles.navbarRight}>
            {/* Shift Info */}
            {shift && (
              <div className={styles.shiftInfo}>
                <ClockRegular />
                <Text size={200}>
                  Shift {shift.number} - {formatShiftTime(shift.startTime)}
                </Text>
                <Badge
                  appearance="filled"
                  color={shift.status === 'active' ? 'success' : 'subtle'}
                  size="small"
                >
                  {shift.status === 'active' ? 'Aktif' : 'Tutup'}
                </Badge>
              </div>
            )}

            {/* Theme Toggle */}
            <Tooltip content={isDarkMode ? 'Mode Terang' : 'Mode Gelap'} relationship="label">
              <Button
                appearance="subtle"
                icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                onClick={onThemeToggle}
              />
            </Tooltip>

            {/* User Menu */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button appearance="subtle" style={{ padding: '4px' }}>
                  <div className={styles.userInfo}>
                    <Avatar
                      name={user.name}
                      image={{ src: user.avatar }}
                      size={32}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <Text size={300} weight="semibold">
                        {user.name}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                        {user.role}
                      </Text>
                    </div>
                  </div>
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem icon={<PersonRegular />}>
                    Profil Saya
                  </MenuItem>
                  <MenuItem icon={<SettingsRegular />}>
                    Pengaturan
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<SignOutRegular />}
                    onClick={() => setLogoutDialogOpen(true)}
                  >
                    Keluar
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </nav>

        {/* Main Content */}
        <div className={styles.main}>
          {/* Content */}
          <main className={styles.content}>
            {children}
          </main>

          {/* Status Bar */}
          <div className={styles.statusBar}>
            <div className={styles.statusItem}>
              <MoneyRegular />
              <Text>Koneksi Database: Aktif</Text>
            </div>
            <div className={styles.statusItem}>
              <Text>
                {new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date())}
              </Text>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={(_, data) => setLogoutDialogOpen(data.open)}>
          <DialogSurface>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogContent>
              <DialogBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertRegular style={{ color: tokens.colorPaletteRedForeground1 }} />
                  <Text>
                    Apakah Anda yakin ingin keluar dari aplikasi? 
                    Pastikan semua transaksi telah disimpan.
                  </Text>
                </div>
              </DialogBody>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setLogoutDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleLogout}
                >
                  Keluar
                </Button>
              </DialogActions>
            </DialogContent>
          </DialogSurface>
        </Dialog>
      </div>
    </FluentProvider>
  );
};

export default MainLayout;