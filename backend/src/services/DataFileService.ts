import { FileType } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import {
  parseFile,
  validateFileSize,
  detectFileType,
  getDataPreview,
  ParsedDataRow
} from '../utils/fileParser';

import { prisma } from '../config/prisma';

export interface CreateDataFileDTO {
  originalName: string;
  fileContent: string;
  size: number;
  workspaceId: string;
  userId: string;
}

export interface DataFileResponse {
  id: string;
  name: string;
  originalName: string;
  fileType: FileType;
  size: number;
  columns: string[];
  rowCount: number;
  preview: ParsedDataRow[];
  createdAt: Date;
  updatedAt: Date;
}

export class DataFileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'data-files');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Upload and parse data file
   */
  async uploadDataFile(dto: CreateDataFileDTO): Promise<DataFileResponse> {
    // Validate file size
    validateFileSize(dto.size);

    // Detect file type from filename
    const fileType = detectFileType(dto.originalName);

    // Parse file content
    const parseResult = parseFile(dto.fileContent, fileType);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = dto.originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, dto.fileContent, 'utf-8');

    // Create database record
    const dataFile = await prisma.dataFile.create({
      data: {
        name: sanitizedName,
        originalName: dto.originalName,
        fileType,
        size: dto.size,
        workspaceId: dto.workspaceId,
        userId: dto.userId,
        filePath,
        parsedData: parseResult.data,
        columns: parseResult.columns,
        rowCount: parseResult.rowCount
      }
    });

    return this.formatResponse(dataFile, parseResult.data);
  }

  /**
   * Get data file by ID
   */
  async getDataFile(id: string, userId: string): Promise<DataFileResponse> {
    const dataFile = await prisma.dataFile.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!dataFile) {
      throw new Error('Data file not found');
    }

    const parsedData = dataFile.parsedData as ParsedDataRow[];
    return this.formatResponse(dataFile, parsedData);
  }

  /**
   * Get all data files for workspace
   */
  async getDataFiles(workspaceId: string, userId: string): Promise<DataFileResponse[]> {
    const dataFiles = await prisma.dataFile.findMany({
      where: {
        workspaceId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return dataFiles.map(dataFile => {
      const parsedData = dataFile.parsedData as ParsedDataRow[];
      return this.formatResponse(dataFile, parsedData);
    });
  }

  /**
   * Get full parsed data for data file
   */
  async getParsedData(id: string, userId: string): Promise<ParsedDataRow[]> {
    const dataFile = await prisma.dataFile.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!dataFile) {
      throw new Error('Data file not found');
    }

    return dataFile.parsedData as ParsedDataRow[];
  }

  /**
   * Delete data file
   */
  async deleteDataFile(id: string, userId: string): Promise<void> {
    const dataFile = await prisma.dataFile.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!dataFile) {
      throw new Error('Data file not found');
    }

    // Delete file from disk
    try {
      await fs.unlink(dataFile.filePath);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.dataFile.delete({
      where: {
        id
      }
    });
  }

  /**
   * Format response with preview
   */
  private formatResponse(dataFile: any, parsedData: ParsedDataRow[]): DataFileResponse {
    return {
      id: dataFile.id,
      name: dataFile.name,
      originalName: dataFile.originalName,
      fileType: dataFile.fileType,
      size: dataFile.size,
      columns: dataFile.columns as string[],
      rowCount: dataFile.rowCount,
      preview: getDataPreview(parsedData, 10),
      createdAt: dataFile.createdAt,
      updatedAt: dataFile.updatedAt
    };
  }
}

export const dataFileService = new DataFileService();
