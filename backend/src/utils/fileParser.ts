import Papa from 'papaparse';
import { FileType } from '@prisma/client';

export interface ParsedDataRow {
  [key: string]: any;
}

export interface ParseResult {
  data: ParsedDataRow[];
  columns: string[];
  rowCount: number;
  errors?: string[];
}

/**
 * Parse CSV file content
 */
export function parseCSV(fileContent: string): ParseResult {
  const errors: string[] = [];
  
  const result = Papa.parse<ParsedDataRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  if (result.errors && result.errors.length > 0) {
    result.errors.forEach((err: any) => {
      errors.push(`Row ${err.row}: ${err.message}`);
    });
  }

  const columns = result.meta?.fields || [];
  const data = result.data as ParsedDataRow[];

  // Validate that we have data and columns
  if (columns.length === 0) {
    throw new Error('CSV file must have header row with column names');
  }

  if (data.length === 0) {
    throw new Error('CSV file must have at least one data row');
  }

  return {
    data,
    columns,
    rowCount: data.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Parse JSON file content
 */
export function parseJSON(fileContent: string): ParseResult {
  try {
    const parsed = JSON.parse(fileContent);

    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('JSON file must contain an array of objects');
    }

    if (parsed.length === 0) {
      throw new Error('JSON array must have at least one item');
    }

    // Extract columns from first object
    const firstItem = parsed[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      throw new Error('JSON array must contain objects');
    }

    const columns = Object.keys(firstItem);
    
    if (columns.length === 0) {
      throw new Error('JSON objects must have at least one property');
    }

    // Validate all items have the same structure
    const errors: string[] = [];
    parsed.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Row ${index + 1}: Item must be an object`);
        return;
      }

      const itemKeys = Object.keys(item);
      const missingKeys = columns.filter(key => !itemKeys.includes(key));
      const extraKeys = itemKeys.filter(key => !columns.includes(key));

      if (missingKeys.length > 0) {
        errors.push(`Row ${index + 1}: Missing keys: ${missingKeys.join(', ')}`);
      }
      if (extraKeys.length > 0) {
        errors.push(`Row ${index + 1}: Extra keys: ${extraKeys.join(', ')}`);
      }
    });

    return {
      data: parsed,
      columns,
      rowCount: parsed.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    if (error.message.includes('JSON')) {
      throw error;
    }
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

/**
 * Parse file based on type
 */
export function parseFile(fileContent: string, fileType: FileType): ParseResult {
  switch (fileType) {
    case FileType.CSV:
      return parseCSV(fileContent);
    case FileType.JSON:
      return parseJSON(fileContent);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number): void {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (size > MAX_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of 10MB`);
  }
}

/**
 * Detect file type from extension
 */
export function detectFileType(filename: string): FileType {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return FileType.CSV;
    case 'json':
      return FileType.JSON;
    default:
      throw new Error(`Unsupported file extension: ${extension}. Only CSV and JSON files are supported.`);
  }
}

/**
 * Get preview of data (first 10 rows)
 */
export function getDataPreview(data: ParsedDataRow[], limit: number = 10): ParsedDataRow[] {
  return data.slice(0, limit);
}
