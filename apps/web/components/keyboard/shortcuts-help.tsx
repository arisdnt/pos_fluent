// ======================================================================
// SHORTCUTS HELP COMPONENT
// Komponen untuk menampilkan daftar keyboard shortcuts
// ======================================================================

'use client';

import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Button,
  Text,
  Badge,
  Divider,
  SearchBox,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Keyboard24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { useKeyboard } from '../../lib/keyboard/keyboard-provider';
import {
  KeyboardShortcutDefinition,
  formatShortcutKey,
  getShortcutsByCategory,
  ShortcutCategory,
} from '../../lib/keyboard/shortcuts-database';

const useStyles = makeStyles({
  dialog: {
    maxWidth: '800px',
    width: '90vw',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  searchContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  categorySection: {
    marginBottom: tokens.spacingVerticalL,
  },
  categoryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  shortcutsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  shortcutItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  shortcutKey: {
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  shortcutDescription: {
    flex: 1,
    marginRight: tokens.spacingHorizontalM,
  },
  categoryBadge: {
    textTransform: 'capitalize',
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3,
  },
});

interface ShortcutsHelpProps {
  open?: boolean;
  onClose?: () => void;
}

const categoryLabels: Record<ShortcutCategory, string> = {
  navigation: 'Navigasi',
  pos: 'Point of Sale',
  products: 'Produk',
  inventory: 'Inventori',
  reports: 'Laporan',
  customers: 'Pelanggan',
  settings: 'Pengaturan',
  general: 'Umum',
};

const categoryColors: Record<ShortcutCategory, 'brand' | 'success' | 'warning' | 'danger' | 'important' | 'informative' | 'subtle'> = {
  navigation: 'brand',
  pos: 'success',
  products: 'warning',
  inventory: 'informative',
  reports: 'important',
  customers: 'subtle',
  settings: 'danger',
  general: 'brand',
};

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const styles = useStyles();
  const { activeShortcuts, hideHelp, isHelpVisible } = useKeyboard();
  const [searchQuery, setSearchQuery] = React.useState('');

  const isOpen = open !== undefined ? open : isHelpVisible;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      hideHelp();
    }
  };

  // Filter shortcuts based on search query
  const filteredShortcuts = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return activeShortcuts;
    }

    const query = searchQuery.toLowerCase();
    return activeShortcuts.filter(
      shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        formatShortcutKey(shortcut).toLowerCase().includes(query) ||
        shortcut.category.toLowerCase().includes(query)
    );
  }, [activeShortcuts, searchQuery]);

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<ShortcutCategory, KeyboardShortcutDefinition[]> = {
      navigation: [],
      pos: [],
      products: [],
      inventory: [],
      reports: [],
      customers: [],
      settings: [],
      general: [],
    };

    filteredShortcuts.forEach(shortcut => {
      groups[shortcut.category].push(shortcut);
    });

    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key as ShortcutCategory].length === 0) {
        delete groups[key as ShortcutCategory];
      }
    });

    return groups;
  }, [filteredShortcuts]);

  const renderShortcutItem = (shortcut: KeyboardShortcutDefinition) => (
    <div key={shortcut.id} className={styles.shortcutItem}>
      <div className={styles.shortcutDescription}>
        <Text>{shortcut.description}</Text>
      </div>
      <div className={styles.shortcutKey}>
        {formatShortcutKey(shortcut)}
      </div>
    </div>
  );

  const renderCategory = (category: ShortcutCategory, shortcuts: KeyboardShortcutDefinition[]) => (
    <div key={category} className={styles.categorySection}>
      <div className={styles.categoryTitle}>
        <Badge 
          appearance="filled" 
          color={categoryColors[category]}
          className={styles.categoryBadge}
        >
          {categoryLabels[category]}
        </Badge>
        <Text size={200} weight="medium">
          {shortcuts.length} shortcut{shortcuts.length !== 1 ? 's' : ''}
        </Text>
      </div>
      <div className={styles.shortcutsList}>
        {shortcuts.map(renderShortcutItem)}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <div className={styles.header}>
              <Keyboard24Regular />
              <Text size={500} weight="semibold">
                Keyboard Shortcuts
              </Text>
            </div>
          </DialogTitle>
          
          <DialogContent>
            <div className={styles.searchContainer}>
              <SearchBox
                placeholder="Cari shortcuts..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                contentBefore={<Search24Regular />}
              />
            </div>

            {Object.keys(groupedShortcuts).length === 0 ? (
              <div className={styles.emptyState}>
                <Text>Tidak ada shortcuts yang ditemukan</Text>
              </div>
            ) : (
              Object.entries(groupedShortcuts).map(([category, shortcuts]) =>
                renderCategory(category as ShortcutCategory, shortcuts)
              )
            )}
          </DialogContent>

          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={handleClose}
              icon={<Dismiss24Regular />}
            >
              Tutup
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// Hook untuk menggunakan shortcuts help dengan mudah
export function useShortcutsHelp() {
  const { showHelp, hideHelp, isHelpVisible } = useKeyboard();
  
  return {
    showHelp,
    hideHelp,
    isVisible: isHelpVisible,
  };
}