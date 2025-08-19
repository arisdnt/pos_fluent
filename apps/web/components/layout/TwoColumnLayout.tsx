// ======================================================================
// TWO COLUMN LAYOUT COMPONENT
// Layout 2 kolom reusable untuk halaman produk, pelanggan, dan inventori
// ======================================================================

'use client';

import { ReactNode, useState } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Title2,
  Input,
  Divider,
  Spinner
} from '@fluentui/react-components';
import {
  Search24Regular,
  Filter24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Dismiss24Regular
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils/cn';

interface TwoColumnLayoutProps {
  // Left column props
  title: string;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
  onAdd?: () => void;
  addButtonText?: string;
  leftContent: ReactNode;
  
  // Right column props
  selectedItem: any;
  onEdit?: () => void;
  onDelete?: () => void;
  rightContent: ReactNode;
  
  // Optional props
  isLoading?: boolean;
  className?: string;
}

export function TwoColumnLayout({
  title,
  searchPlaceholder,
  onSearch,
  onAdd,
  addButtonText = "Tambah",
  leftContent,
  selectedItem,
  onEdit,
  onDelete,
  rightContent,
  isLoading = false,
  className
}: TwoColumnLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className={cn('h-full flex gap-6', className)}>
      {/* Left Column - Table with Search */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Title2>{title}</Title2>
          {onAdd && (
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={onAdd}
            >
              {addButtonText}
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                contentBefore={<Search24Regular className="text-gray-500" />}
                className="w-full"
              />
            </div>
            <Button
              appearance="subtle"
              icon={<Filter24Regular />}
              title="Filter"
            />
          </div>
        </Card>

        {/* Table Content */}
        <Card className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="large" />
            </div>
          ) : (
            leftContent
          )}
        </Card>
      </div>

      {/* Right Column - Detail Panel */}
      <div className="w-96 flex flex-col space-y-4">
        {selectedItem ? (
          <>
            {/* Detail Header */}
            <Card>
              <CardHeader
                header={
                  <div className="flex items-center justify-between w-full">
                    <Text weight="semibold">Detail</Text>
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Edit24Regular />}
                          onClick={onEdit}
                          title="Edit"
                        />
                      )}
                      {onDelete && (
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Delete24Regular />}
                          onClick={onDelete}
                          title="Hapus"
                        />
                      )}
                    </div>
                  </div>
                }
              />
            </Card>

            {/* Detail Content */}
            <Card className="flex-1">
              {rightContent}
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search24Regular className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <Text weight="semibold" className="block">Pilih Item</Text>
                <Text size={200} className="text-gray-600">
                  Pilih item dari tabel untuk melihat detail
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TwoColumnLayout;