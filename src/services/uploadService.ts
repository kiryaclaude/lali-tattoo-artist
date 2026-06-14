/**
 * services/uploadService.ts
 * Service для загрузки файлов
 */

import type { ApiResponse } from '../types';
import { mockUploadFile } from '../api/mock';
// TODO Backend: import { apiClient } from '../api/client';
// TODO Backend: import { ENDPOINTS } from '../api/endpoints';

// ============================================================================
// UPLOAD SERVICE
// ============================================================================

class UploadService {
  /**
   * Загружает файл (эскиз, чек об оплате)
   * TODO Backend: Заменить на multipart form-data запрос к S3 или другому storage
   */
  async uploadFile(file: File): Promise<ApiResponse<{ url: string }>> {
    return mockUploadFile(file);
  }

  /**
   * Загружает несколько файлов
   */
  async uploadFiles(files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
    try {
      const results = await Promise.all(
        files.map((file) => this.uploadFile(file))
      );

      const urls = results
        .filter((result) => result.success && result.data)
        .map((result) => result.data!.url);

      if (urls.length !== files.length) {
        return {
          success: false,
          error: {
            code: 'PARTIAL_UPLOAD_FAILED',
            message: 'Some files failed to upload',
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: { urls },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const uploadService = new UploadService();
