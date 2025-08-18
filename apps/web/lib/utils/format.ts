// ======================================================================
// FORMAT UTILITIES
// Utilitas untuk formatting data dalam format Indonesia
// ======================================================================

// ======================================================================
// CURRENCY FORMATTING
// ======================================================================

/**
 * Format number as Indonesian Rupiah currency
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true
  } = options;

  if (isNaN(amount)) return showSymbol ? 'Rp 0' : '0';

  const formatter = new Intl.NumberFormat('id-ID', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits
  });

  return formatter.format(amount);
}

/**
 * Parse Indonesian currency string to number
 * @param currencyString - Currency string to parse
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString) return 0;
  
  // Remove currency symbols and separators
  const cleanValue = currencyString
    .replace(/[Rp\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Format number with thousand separators (Indonesian style)
 * @param number - Number to format
 * @returns Formatted number string
 */
export function formatNumber(number: number): string {
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('id-ID').format(number);
}

// ======================================================================
// DATE AND TIME FORMATTING
// ======================================================================

/**
 * Format date and time with Indonesian locale
 * @param date - Date to format
 * @param format - Format pattern (using date-fns format)
 * @returns Formatted date string
 */
export function formatDateTime(
  date: Date | string | number,
  format: string = 'dd/MM/yyyy HH:mm'
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Simple format mapping for common patterns
  const formatMap: { [key: string]: string } = {
    'dd': dateObj.getDate().toString().padStart(2, '0'),
    'MM': (dateObj.getMonth() + 1).toString().padStart(2, '0'),
    'yyyy': dateObj.getFullYear().toString(),
    'HH': dateObj.getHours().toString().padStart(2, '0'),
    'mm': dateObj.getMinutes().toString().padStart(2, '0'),
    'ss': dateObj.getSeconds().toString().padStart(2, '0'),
    'EEEE': getDayName(dateObj.getDay()),
    'MMMM': getMonthName(dateObj.getMonth())
  };
  
  let result = format;
  Object.entries(formatMap).forEach(([pattern, value]) => {
    result = result.replace(new RegExp(pattern, 'g'), value);
  });
  
  return result;
}

/**
 * Get Indonesian day name
 * @param dayIndex - Day index (0-6)
 * @returns Indonesian day name
 */
function getDayName(dayIndex: number): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayIndex] || '';
}

/**
 * Get Indonesian month name
 * @param monthIndex - Month index (0-11)
 * @returns Indonesian month name
 */
function getMonthName(monthIndex: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  return formatDateTime(date, 'dd/MM/yyyy');
}

/**
 * Format time for display
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number): string {
  return formatDateTime(date, 'HH:mm');
}

/**
 * Format date and time for display with Indonesian format
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTimeDisplay(date: Date | string | number): string {
  return formatDateTime(date, 'dd MMMM yyyy, HH:mm');
}

// ======================================================================
// PERCENTAGE FORMATTING
// ======================================================================

/**
 * Format number as percentage
 * @param value - Value to format (0.1 = 10%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value)) return '0%';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format number as percentage with custom multiplier
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentageFromNumber(value: number, decimals = 1): string {
  if (isNaN(value)) return '0%';
  
  return formatPercentage(value / 100, decimals);
}

// ======================================================================
// TEXT FORMATTING
// ======================================================================

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize first letter only
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert text to title case
 * @param text - Text to convert
 * @returns Title case text
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  
  const smallWords = ['dan', 'atau', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'oleh'];
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Remove extra whitespace and normalize text
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
}

// ======================================================================
// PHONE NUMBER FORMATTING
// ======================================================================

/**
 * Format Indonesian phone number
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('62')) {
    // International format: +62
    const number = digits.substring(2);
    if (number.length >= 9) {
      return `+62 ${number.substring(0, 3)}-${number.substring(3, 7)}-${number.substring(7)}`;
    }
  } else if (digits.startsWith('0')) {
    // Local format: 0
    if (digits.length >= 10) {
      return `${digits.substring(0, 4)}-${digits.substring(4, 8)}-${digits.substring(8)}`;
    }
  }
  
  return phoneNumber; // Return original if can't format
}

/**
 * Normalize Indonesian phone number to international format
 * @param phoneNumber - Phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.startsWith('62')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return `+62${digits.substring(1)}`;
  } else if (digits.length >= 9) {
    return `+62${digits}`;
  }
  
  return phoneNumber;
}

// ======================================================================
// ADDRESS FORMATTING
// ======================================================================

/**
 * Format Indonesian address
 * @param address - Address object
 * @returns Formatted address string
 */
export function formatAddress(address: {
  street?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}): string {
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.village) parts.push(address.village);
  if (address.district) parts.push(`Kec. ${address.district}`);
  if (address.city) parts.push(address.city);
  if (address.province) parts.push(address.province);
  if (address.postalCode) parts.push(address.postalCode);
  
  return parts.join(', ');
}

// ======================================================================
// FILE SIZE FORMATTING
// ======================================================================

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// ======================================================================
// ID FORMATTING
// ======================================================================

/**
 * Format Indonesian ID number (NIK)
 * @param nik - NIK to format
 * @returns Formatted NIK
 */
export function formatNIK(nik: string): string {
  if (!nik) return '';
  
  const digits = nik.replace(/\D/g, '');
  
  if (digits.length === 16) {
    return `${digits.substring(0, 6)}.${digits.substring(6, 12)}.${digits.substring(12)}`;
  }
  
  return nik;
}

/**
 * Format Indonesian postal code
 * @param postalCode - Postal code to format
 * @returns Formatted postal code
 */
export function formatPostalCode(postalCode: string): string {
  if (!postalCode) return '';
  
  const digits = postalCode.replace(/\D/g, '');
  
  if (digits.length === 5) {
    return digits;
  }
  
  return postalCode;
}

// ======================================================================
// BUSINESS FORMATTING
// ======================================================================

/**
 * Format SKU (Stock Keeping Unit)
 * @param sku - SKU to format
 * @returns Formatted SKU
 */
export function formatSKU(sku: string): string {
  if (!sku) return '';
  
  return sku.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
}

/**
 * Format barcode
 * @param barcode - Barcode to format
 * @returns Formatted barcode
 */
export function formatBarcode(barcode: string): string {
  if (!barcode) return '';
  
  // Remove any non-alphanumeric characters except hyphens
  return barcode.replace(/[^A-Za-z0-9\-]/g, '');
}

/**
 * Format transaction number
 * @param transactionNumber - Transaction number to format
 * @returns Formatted transaction number
 */
export function formatTransactionNumber(transactionNumber: string): string {
  if (!transactionNumber) return '';
  
  return transactionNumber.toUpperCase();
}

// ======================================================================
// VALIDATION HELPERS
// ======================================================================

/**
 * Check if string is valid Indonesian phone number
 * @param phoneNumber - Phone number to validate
 * @returns True if valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check Indonesian phone number patterns
  return /^(\+62|62|0)[0-9]{8,13}$/.test(digits);
}

/**
 * Check if string is valid Indonesian NIK
 * @param nik - NIK to validate
 * @returns True if valid
 */
export function isValidNIK(nik: string): boolean {
  if (!nik) return false;
  
  const digits = nik.replace(/\D/g, '');
  
  // NIK should be 16 digits
  if (digits.length !== 16) return false;
  
  // Basic validation for Indonesian NIK format
  const provinceCode = parseInt(digits.substring(0, 2));
  const cityCode = parseInt(digits.substring(2, 4));
  const districtCode = parseInt(digits.substring(4, 6));
  
  return provinceCode >= 11 && provinceCode <= 94 && 
         cityCode >= 1 && cityCode <= 99 && 
         districtCode >= 1 && districtCode <= 99;
}

/**
 * Check if string is valid Indonesian postal code
 * @param postalCode - Postal code to validate
 * @returns True if valid
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  
  const digits = postalCode.replace(/\D/g, '');
  
  return /^\d{5}$/.test(digits);
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

/**
 * Remove Indonesian currency formatting
 * @param formattedCurrency - Formatted currency string
 * @returns Clean number string
 */
export function cleanCurrencyString(formattedCurrency: string): string {
  if (!formattedCurrency) return '0';
  
  return formattedCurrency
    .replace(/[Rp\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
}

/**
 * Format number with custom separator
 * @param number - Number to format
 * @param thousandSeparator - Thousand separator
 * @param decimalSeparator - Decimal separator
 * @returns Formatted number string
 */
export function formatNumberCustom(
  number: number,
  thousandSeparator = '.',
  decimalSeparator = ','
): string {
  if (isNaN(number)) return '0';
  
  const parts = number.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return parts.join(decimalSeparator);
}

/**
 * Generate random ID with prefix
 * @param prefix - ID prefix
 * @param length - ID length (excluding prefix)
 * @returns Generated ID
 */
export function generateId(prefix = '', length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Mask sensitive information
 * @param text - Text to mask
 * @param visibleStart - Number of visible characters at start
 * @param visibleEnd - Number of visible characters at end
 * @param maskChar - Character to use for masking
 * @returns Masked text
 */
export function maskText(
  text: string,
  visibleStart = 2,
  visibleEnd = 2,
  maskChar = '*'
): string {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text;
  }
  
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const maskLength = text.length - visibleStart - visibleEnd;
  
  return start + maskChar.repeat(maskLength) + end;
}

/**
 * Convert string to slug (URL-friendly)
 * @param text - Text to convert
 * @returns Slug string
 */
export function toSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract initials from name
 * @param name - Full name
 * @param maxInitials - Maximum number of initials
 * @returns Initials string
 */
export function getInitials(name: string, maxInitials = 2): string {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials;
}

export default {
  formatCurrency,
  parseCurrency,
  formatNumber,
  formatDateTime,
  formatDate,
  formatTime,
  formatDateTimeDisplay,
  formatPercentage,
  formatPercentageFromNumber,
  capitalizeWords,
  capitalizeFirst,
  toTitleCase,
  truncateText,
  normalizeText,
  formatPhoneNumber,
  normalizePhoneNumber,
  formatAddress,
  formatFileSize,
  formatNIK,
  formatPostalCode,
  formatSKU,
  formatBarcode,
  formatTransactionNumber,
  isValidPhoneNumber,
  isValidNIK,
  isValidPostalCode,
  cleanCurrencyString,
  formatNumberCustom,
  generateId,
  maskText,
  toSlug,
  getInitials
};