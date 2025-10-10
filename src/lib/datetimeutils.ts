export interface DateRange {
  startDate: string | undefined | null;
  endDate: string | undefined | null;
}

/**
 * Helper function to parse DD.MM.YYYY or YYYY-MM dates
 * @param dateString - Date string in DD.MM.YYYY or YYYY-MM format
 * @returns Date object or null if parsing fails
 */
export const parseDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  
  // Try DD.MM.YYYY format first
  if (dateString.includes('.')) {
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Try YYYY-MM format
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const date = new Date(year, month, 1);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Fallback to standard Date parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Helper function to calculate duration from an array of date ranges
 * Finds the minimum start date and maximum end date across all ranges
 * @param dateRanges - Array of date ranges
 * @returns Formatted duration string (e.g., "2 yrs 3 mos") or empty string
 */
export const calculateDuration = (dateRanges: DateRange[]): string => {
  if (!dateRanges || dateRanges.length === 0) return '';
  
  try {
    let minStartDate: Date | null = null;
    let maxEndDate: Date | null = null;

    // Find the minimum start date and maximum end date across all ranges
    dateRanges.forEach(range => {
      if (range.startDate) {
        const start = parseDate(range.startDate);
        if (start && !isNaN(start.getTime())) {
          if (!minStartDate || start < minStartDate) {
            minStartDate = start;
          }
        }
      }

      const end = range.endDate ? parseDate(range.endDate) : new Date();
      if (end && !isNaN(end.getTime())) {
        if (!maxEndDate || end > maxEndDate) {
          maxEndDate = end;
        }
      }
    });

    if (!minStartDate || !maxEndDate) return '';
    
    const months = (maxEndDate.getFullYear() - minStartDate.getFullYear()) * 12 + (maxEndDate.getMonth() - minStartDate.getMonth());
    
    if (months <= 0) return '';
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else if (remainingMonths > 0) {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
    return '';
  } catch (error) {
    return '';
  }
};
