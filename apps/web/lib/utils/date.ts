// ======================================================================
// DATE UTILITIES
// Utilitas untuk handling tanggal dalam format Indonesia
// ======================================================================

import { format, parse, isValid, differenceInDays, differenceInHours, differenceInMinutes, addDays, addMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { id } from 'date-fns/locale';

// ======================================================================
// CONSTANTS
// ======================================================================

export const INDONESIAN_LOCALE = id;

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  MEDIUM: 'dd MMM yyyy',
  LONG: 'dd MMMM yyyy',
  FULL: 'EEEE, dd MMMM yyyy',
  TIME: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',
  DATETIME_SHORT: 'dd/MM/yyyy HH:mm',
  DATETIME_MEDIUM: 'dd MMM yyyy HH:mm',
  DATETIME_LONG: 'dd MMMM yyyy HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DATABASE: 'yyyy-MM-dd HH:mm:ss',
  FILENAME: 'yyyyMMdd_HHmmss'
} as const;

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export const DAY_NAMES_SHORT = [
  'Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'
];

// ======================================================================
// FORMATTING FUNCTIONS
// ======================================================================

/**
 * Format date using Indonesian locale
 * @param date - Date to format
 * @param formatString - Format string (default: dd/MM/yyyy)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, formatString = DATE_FORMATS.SHORT): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Tanggal tidak valid';
    }
    
    return format(dateObj, formatString, { locale: INDONESIAN_LOCALE });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tanggal tidak valid';
  }
}

/**
 * Format date for display in Indonesian format
 * @param date - Date to format
 * @param style - Display style
 * @returns Formatted date string
 */
export function formatDateIndonesian(
  date: Date | string | number,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const formatMap = {
    short: DATE_FORMATS.SHORT,
    medium: DATE_FORMATS.MEDIUM,
    long: DATE_FORMATS.LONG,
    full: DATE_FORMATS.FULL
  };
  
  return formatDate(date, formatMap[style]);
}

/**
 * Format time in Indonesian format
 * @param date - Date to format
 * @param includeSeconds - Include seconds in format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number, includeSeconds = false): string {
  const formatString = includeSeconds ? DATE_FORMATS.TIME_WITH_SECONDS : DATE_FORMATS.TIME;
  return formatDate(date, formatString);
}

/**
 * Format datetime in Indonesian format
 * @param date - Date to format
 * @param style - Display style
 * @returns Formatted datetime string
 */
export function formatDateTime(
  date: Date | string | number,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const formatMap = {
    short: DATE_FORMATS.DATETIME_SHORT,
    medium: DATE_FORMATS.DATETIME_MEDIUM,
    long: DATE_FORMATS.DATETIME_LONG
  };
  
  return formatDate(date, formatMap[style]);
}

/**
 * Format date for database storage
 * @param date - Date to format
 * @returns Database formatted date string
 */
export function formatDateForDatabase(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATABASE);
}

/**
 * Format date for filename
 * @param date - Date to format
 * @returns Filename safe date string
 */
export function formatDateForFilename(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.FILENAME);
}

// ======================================================================
// PARSING FUNCTIONS
// ======================================================================

/**
 * Parse Indonesian date string
 * @param dateString - Date string to parse
 * @param formatString - Expected format
 * @returns Parsed Date object or null
 */
export function parseIndonesianDate(dateString: string, formatString = DATE_FORMATS.SHORT): Date | null {
  try {
    if (!dateString) return null;
    
    const parsedDate = parse(dateString, formatString, new Date(), { locale: INDONESIAN_LOCALE });
    
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Parse date from various formats
 * @param dateString - Date string to parse
 * @returns Parsed Date object or null
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try common Indonesian formats
  const formats = [
    DATE_FORMATS.SHORT,
    DATE_FORMATS.MEDIUM,
    DATE_FORMATS.LONG,
    DATE_FORMATS.DATETIME_SHORT,
    DATE_FORMATS.DATETIME_MEDIUM,
    DATE_FORMATS.DATABASE,
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'MM/dd/yyyy'
  ];
  
  for (const format of formats) {
    const parsed = parseIndonesianDate(dateString, format);
    if (parsed) return parsed;
  }
  
  // Try native Date parsing as fallback
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
}

// ======================================================================
// VALIDATION FUNCTIONS
// ======================================================================

/**
 * Check if date string is valid
 * @param dateString - Date string to validate
 * @param formatString - Expected format
 * @returns True if valid
 */
export function isValidDateString(dateString: string, formatString?: string): boolean {
  if (!dateString) return false;
  
  if (formatString) {
    return parseIndonesianDate(dateString, formatString) !== null;
  }
  
  return parseDate(dateString) !== null;
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if today
 */
export function isToday(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

/**
 * Check if date is yesterday
 * @param date - Date to check
 * @returns True if yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return dateObj.toDateString() === yesterday.toDateString();
  } catch {
    return false;
  }
}

/**
 * Check if date is in current week
 * @param date - Date to check
 * @returns True if in current week
 */
export function isThisWeek(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = new Date();
    const daysDiff = Math.abs(differenceInDays(dateObj, today));
    
    return daysDiff <= 7;
  } catch {
    return false;
  }
}

/**
 * Check if date is in current month
 * @param date - Date to check
 * @returns True if in current month
 */
export function isThisMonth(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
  } catch {
    return false;
  }
}

/**
 * Check if date is in current year
 * @param date - Date to check
 * @returns True if in current year
 */
export function isThisYear(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.getFullYear() === today.getFullYear();
  } catch {
    return false;
  }
}

// ======================================================================
// RELATIVE TIME FUNCTIONS
// ======================================================================

/**
 * Get relative time in Indonesian
 * @param date - Date to compare
 * @param baseDate - Base date for comparison (default: now)
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | number, baseDate?: Date): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const base = baseDate || new Date();
    
    if (!isValid(dateObj)) return 'Tanggal tidak valid';
    
    const diffMinutes = differenceInMinutes(base, dateObj);
    const diffHours = differenceInHours(base, dateObj);
    const diffDays = differenceInDays(base, dateObj);
    
    if (Math.abs(diffMinutes) < 1) {
      return 'Baru saja';
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `${diffMinutes} menit yang lalu` : `${Math.abs(diffMinutes)} menit lagi`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `${diffHours} jam yang lalu` : `${Math.abs(diffHours)} jam lagi`;
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `${diffDays} hari yang lalu` : `${Math.abs(diffDays)} hari lagi`;
    } else {
      return formatDateIndonesian(dateObj, 'medium');
    }
  } catch {
    return 'Tanggal tidak valid';
  }
}

/**
 * Get time ago in Indonesian
 * @param date - Date to compare
 * @returns Time ago string
 */
export function getTimeAgo(date: Date | string | number): string {
  return getRelativeTime(date);
}

// ======================================================================
// DATE RANGE FUNCTIONS
// ======================================================================

/**
 * Get date range for today
 * @returns Start and end of today
 */
export function getTodayRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today)
  };
}

/**
 * Get date range for yesterday
 * @returns Start and end of yesterday
 */
export function getYesterdayRange(): { start: Date; end: Date } {
  const yesterday = addDays(new Date(), -1);
  return {
    start: startOfDay(yesterday),
    end: endOfDay(yesterday)
  };
}

/**
 * Get date range for current week
 * @returns Start and end of current week
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = addDays(today, -dayOfWeek);
  const end = addDays(start, 6);
  
  return {
    start: startOfDay(start),
    end: endOfDay(end)
  };
}

/**
 * Get date range for current month
 * @returns Start and end of current month
 */
export function getThisMonthRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today)
  };
}

/**
 * Get date range for current year
 * @returns Start and end of current year
 */
export function getThisYearRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfYear(today),
    end: endOfYear(today)
  };
}

/**
 * Get date range for last N days
 * @param days - Number of days
 * @returns Start and end date
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const today = new Date();
  const start = addDays(today, -days + 1);
  
  return {
    start: startOfDay(start),
    end: endOfDay(today)
  };
}

/**
 * Get date range for last N months
 * @param months - Number of months
 * @returns Start and end date
 */
export function getLastNMonthsRange(months: number): { start: Date; end: Date } {
  const today = new Date();
  const start = addMonths(today, -months + 1);
  
  return {
    start: startOfMonth(start),
    end: endOfMonth(today)
  };
}

// ======================================================================
// BUSINESS DATE FUNCTIONS
// ======================================================================

/**
 * Check if date is weekend (Saturday or Sunday)
 * @param date - Date to check
 * @returns True if weekend
 */
export function isWeekend(date: Date | string | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  } catch {
    return false;
  }
}

/**
 * Check if date is weekday (Monday to Friday)
 * @param date - Date to check
 * @returns True if weekday
 */
export function isWeekday(date: Date | string | number): boolean {
  return !isWeekend(date);
}

/**
 * Get business days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of business days
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWeekday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

/**
 * Get current timestamp in milliseconds
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get current date as ISO string
 * @returns ISO date string
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Convert date to Indonesian timezone
 * @param date - Date to convert
 * @returns Date in Indonesian timezone
 */
export function toIndonesianTimezone(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Indonesia is UTC+7
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 3600000));
}

/**
 * Get age from birth date
 * @param birthDate - Birth date
 * @returns Age in years
 */
export function getAge(birthDate: Date | string | number): number {
  try {
    const birth = typeof birthDate === 'string' || typeof birthDate === 'number' ? new Date(birthDate) : birthDate;
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

/**
 * Get quarter from date
 * @param date - Date to get quarter from
 * @returns Quarter number (1-4)
 */
export function getQuarter(date: Date | string | number): number {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return Math.floor(dateObj.getMonth() / 3) + 1;
  } catch {
    return 1;
  }
}

/**
 * Get Indonesian month name
 * @param monthIndex - Month index (0-11)
 * @param short - Use short name
 * @returns Month name
 */
export function getIndonesianMonthName(monthIndex: number, short = false): string {
  const names = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return names[monthIndex] || '';
}

/**
 * Get Indonesian day name
 * @param dayIndex - Day index (0-6, Sunday = 0)
 * @param short - Use short name
 * @returns Day name
 */
export function getIndonesianDayName(dayIndex: number, short = false): string {
  const names = short ? DAY_NAMES_SHORT : DAY_NAMES;
  return names[dayIndex] || '';
}

/**
 * Create date from Indonesian date string
 * @param day - Day
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Date object
 */
export function createIndonesianDate(day: number, month: number, year: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Get date parts in Indonesian format
 * @param date - Date to get parts from
 * @returns Date parts object
 */
export function getIndonesianDateParts(date: Date | string | number): {
  day: number;
  month: number;
  year: number;
  dayName: string;
  monthName: string;
  dayNameShort: string;
  monthNameShort: string;
} {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    return {
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      dayName: getIndonesianDayName(dateObj.getDay()),
      monthName: getIndonesianMonthName(dateObj.getMonth()),
      dayNameShort: getIndonesianDayName(dateObj.getDay(), true),
      monthNameShort: getIndonesianMonthName(dateObj.getMonth(), true)
    };
  } catch {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      dayName: getIndonesianDayName(now.getDay()),
      monthName: getIndonesianMonthName(now.getMonth()),
      dayNameShort: getIndonesianDayName(now.getDay(), true),
      monthNameShort: getIndonesianMonthName(now.getMonth(), true)
    };
  }
}

export default {
  formatDate,
  formatDateIndonesian,
  formatTime,
  formatDateTime,
  formatDateForDatabase,
  formatDateForFilename,
  parseIndonesianDate,
  parseDate,
  isValidDateString,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getRelativeTime,
  getTimeAgo,
  getTodayRange,
  getYesterdayRange,
  getThisWeekRange,
  getThisMonthRange,
  getThisYearRange,
  getLastNDaysRange,
  getLastNMonthsRange,
  isWeekend,
  isWeekday,
  getBusinessDaysBetween,
  getCurrentTimestamp,
  getCurrentISOString,
  toIndonesianTimezone,
  getAge,
  getQuarter,
  getIndonesianMonthName,
  getIndonesianDayName,
  createIndonesianDate,
  getIndonesianDateParts,
  DATE_FORMATS,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  DAY_NAMES,
  DAY_NAMES_SHORT
};