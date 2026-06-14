/**
 * api/mock/upload.ts
 * Mock реализация API для загрузки файлов
 * TODO Backend: Заменить на реальную загрузку на S3/storage сервис
 */

import type { ApiResponse } from '../../types';
import { simulateNetworkDelay } from './mock_api_storage';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../constants';

// ============================================================================
// UPLOAD FILE
// ============================================================================

export async function mockUploadFile(
  file: File
): Promise<ApiResponse<{ url: string }>> {
  await simulateNetworkDelay();

  // Валидация
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds 20 MB limit',
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only JPG, PNG, WEBP formats are supported',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Для demo: создаём Data URL
  const fileUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });

  return {
    success: true,
    data: { url: fileUrl },
    timestamp: new Date().toISOString(),
  };
}
