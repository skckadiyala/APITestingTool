import { PrismaClient } from '@prisma/client';
import { RequestBody } from '../models/RequestBody';
import { ResponseBody } from '../models/ResponseBody';
import { type ExecutionResult } from '../types/request.types';

const prisma = new PrismaClient();

export class HistoryService {
  /**
   * Save execution result to history
   */
  async saveToHistory(
    result: ExecutionResult,
    userId?: string,
    requestId?: string
  ): Promise<{ historyId: string; requestBodyId: string; responseBodyId?: string }> {
    try {
      // Save request body to MongoDB
      // Determine body type and content
      let bodyType = 'none';
      let bodyContent = '';
      
      if (result.request.body) {
        // If body exists, check the type from the config
        const bodyConfig = result.request.body as any;
        if (typeof bodyConfig === 'object' && bodyConfig.type) {
          bodyType = bodyConfig.type;
          bodyContent = bodyConfig.content || JSON.stringify(bodyConfig);
        } else {
          bodyType = 'json';
          bodyContent = JSON.stringify(bodyConfig);
        }
      }
      
      const requestBody = await RequestBody.create({
        requestId: requestId || 'adhoc',
        headers: Object.entries(result.request.headers).map(([key, value]) => ({
          key,
          value,
        })),
        body: {
          type: bodyType,
          content: bodyContent,
        },
        auth: { type: 'noauth' },
      });

      let responseBody = null;
      if (result.response) {
        // Save response body to MongoDB
        responseBody = await ResponseBody.create({
          historyId: 'pending', // Will be updated after history creation
          headers: Object.entries(result.response.headers).map(([key, value]) => ({
            key,
            value: String(value),
          })),
          body: result.response.body,
          cookies: result.response.cookies,
          size: result.response.size.total,
        });
      }

      // Save history entry to PostgreSQL
      const history = await prisma.requestHistory.create({
        data: {
          requestId: requestId || undefined,
          userId,
          method: result.request.method,
          url: result.request.url,
          requestBodyId: requestBody._id.toString(),
          responseBodyId: responseBody ? responseBody._id.toString() : undefined,
          statusCode: result.response?.status ?? undefined,
          responseTime: result.response?.timing.total ?? undefined,
          executedAt: result.executedAt,
        },
      });

      // Update response body with actual history ID
      if (responseBody) {
        await ResponseBody.findByIdAndUpdate(responseBody._id, {
          historyId: history.id,
        });
      }

      return {
        historyId: history.id,
        requestBodyId: requestBody._id.toString(),
        responseBodyId: responseBody ? responseBody._id.toString() : undefined,
      };
    } catch (error) {
      console.error('Failed to save to history:', error);
      throw error;
    }
  }

  /**
   * Get history entries for a user
   */
  async getHistory(
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      requestId?: string;
      method?: string;
      statusCodeMin?: number;
      statusCodeMax?: number;
      urlPattern?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { 
      limit = 50, 
      offset = 0, 
      requestId, 
      method,
      statusCodeMin,
      statusCodeMax,
      urlPattern,
      startDate,
      endDate
    } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (requestId) where.requestId = requestId;
    if (method) where.method = method;
    
    // Status code range filtering
    if (statusCodeMin !== undefined || statusCodeMax !== undefined) {
      where.statusCode = {};
      if (statusCodeMin !== undefined) where.statusCode.gte = statusCodeMin;
      if (statusCodeMax !== undefined) where.statusCode.lte = statusCodeMax;
    }
    
    // URL pattern filtering (case-insensitive contains)
    if (urlPattern) {
      where.url = {
        contains: urlPattern,
        mode: 'insensitive',
      };
    }
    
    // Date range filtering
    if (startDate || endDate) {
      where.executedAt = {};
      if (startDate) where.executedAt.gte = startDate;
      if (endDate) where.executedAt.lte = endDate;
    }

    const [history, total] = await Promise.all([
      prisma.requestHistory.findMany({
        where,
        include: {
          request: {
            select: {
              id: true,
              name: true,
              method: true,
              url: true,
            },
          },
        },
        orderBy: { executedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.requestHistory.count({ where }),
    ]);

    return {
      history,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a specific history entry with full details
   */
  async getHistoryDetail(historyId: string, userId?: string) {
    const where: any = { id: historyId };
    if (userId) where.userId = userId;
    
    const history = await prisma.requestHistory.findFirst({
      where,
      include: {
        request: true,
      },
    });

    if (!history) {
      return null;
    }

    // Fetch request and response bodies from MongoDB
    const [requestBody, responseBody] = await Promise.all([
      RequestBody.findById(history.requestBodyId),
      history.responseBodyId ? ResponseBody.findById(history.responseBodyId) : null,
    ]);

    return {
      ...history,
      requestBody,
      responseBody,
    };
  }

  /**
   * Delete history entry
   */
  async deleteHistory(historyId: string, userId?: string) {
    const where: any = { id: historyId };
    if (userId) where.userId = userId;
    
    const history = await prisma.requestHistory.findFirst({
      where,
    });

    if (!history) {
      throw new Error('History entry not found');
    }

    // Delete from MongoDB
    await Promise.all([
      RequestBody.findByIdAndDelete(history.requestBodyId),
      history.responseBodyId
        ? ResponseBody.findByIdAndDelete(history.responseBodyId)
        : Promise.resolve(),
    ]);

    // Delete from PostgreSQL
    await prisma.requestHistory.delete({
      where: { id: historyId },
    });
  }

  /**
   * Clear all history for a user
   */
  async clearHistory(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    
    const history = await prisma.requestHistory.findMany({
      where,
    });

    // Delete all MongoDB documents
    await Promise.all([
      ...history.map(h => RequestBody.findByIdAndDelete(h.requestBodyId)),
      ...history
        .filter(h => h.responseBodyId)
        .map(h => ResponseBody.findByIdAndDelete(h.responseBodyId!)),
    ]);

    // Delete all PostgreSQL records
    await prisma.requestHistory.deleteMany({
      where,
    });
  }
}
