import apiClient from './api';

export type DataFile = {
  id: string;
  name: string;
  originalName: string;
  fileType: 'CSV' | 'JSON';
  size: number;
  columns: string[];
  rowCount: number;
  preview: any[];
  createdAt: Date;
  updatedAt: Date;
};

class DataFileService {
  /**
   * Upload a data file
   */
  async uploadDataFile(
    file: File,
    workspaceId: string
  ): Promise<DataFile> {
    // Read file content
    const fileContent = await this.readFileAsText(file);

    const response = await apiClient.post(
      '/data-files/upload',
      {
        originalName: file.name,
        fileContent,
        size: file.size,
        workspaceId,
      }
    );

    return response.data.data;
  }

  /**
   * Get all data files for workspace
   */
  async getDataFiles(workspaceId: string): Promise<DataFile[]> {
    const response = await apiClient.get(
      `/data-files/workspace/${workspaceId}`
    );
    return response.data.data;
  }

  /**
   * Get data file by ID
   */
  async getDataFile(id: string): Promise<DataFile> {
    const response = await apiClient.get(`/data-files/${id}`);
    return response.data.data;
  }

  /**
   * Get full parsed data
   */
  async getParsedData(id: string): Promise<any[]> {
    const response = await apiClient.get(`/data-files/${id}/data`);
    return response.data.data;
  }

  /**
   * Delete data file
   */
  async deleteDataFile(id: string): Promise<void> {
    await apiClient.delete(`/data-files/${id}`);
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export default new DataFileService();
