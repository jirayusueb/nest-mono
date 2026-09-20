export interface PaginatedRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function offsetOf(request: PaginatedRequest): number {
  return (request.page - 1) * request.limit;
}

export function toPaginatedResponse<T>(
  items: T[],
  total: number,
  request: PaginatedRequest,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page: request.page,
    limit: request.limit,
    hasNext: request.page * request.limit < total,
    hasPrev: request.page > 1,
  };
}
