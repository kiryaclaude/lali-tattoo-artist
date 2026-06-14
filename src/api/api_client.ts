/**
 * api/client.ts
 * HTTP клиент для коммуникации с backend
 * TODO Backend: Заменить mock реализацию на реальные API вызовы
 */

import type { ApiResponse } from '../types';
import { API_TIMEOUT } from '../constants';

// ============================================================================
// API CLIENT CONFIG
// ============================================================================

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * GET запрос
   * TODO Backend: Использовать реальный baseUrl и обработку ошибок
   */
  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>(endpoint, {
        ...options,
        method: 'GET',
      });
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * POST запрос
   * TODO Backend: Использовать реальный baseUrl и обработку ошибок
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * PUT запрос
   * TODO Backend: Использовать реальный baseUrl и обработку ошибок
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * DELETE запрос
   * TODO Backend: Использовать реальный baseUrl и обработку ошибок
   */
  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>(endpoint, {
        ...options,
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Внутренний метод для выполнения запроса
   * TODO Backend: Реальная реализация с fetch или axios
   */
  private async request<T>(
    endpoint: string,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...this.headers,
          ...(init?.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP Error ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Обработка ошибок
   */
  private handleError<T>(error: unknown): ApiResponse<T> {
    console.error('[ApiClient] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Установить токен авторизации
   * TODO Backend: Использовать для авторизованных запросов
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Удалить токен авторизации
   */
  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// TODO Backend: Установить реальный baseUrl (например, process.env.REACT_APP_API_URL)
const apiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: API_TIMEOUT,
});

export default apiClient;
