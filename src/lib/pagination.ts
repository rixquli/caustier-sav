export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export function parsePaginationQuery(
  pageRaw: string | null,
  limitRaw: string | null,
): { page: number; limit: number; skip: number } | null {
  if (pageRaw === null && limitRaw === null) {
    return null;
  }

  const page = Math.max(1, Number(pageRaw) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(limitRaw) || DEFAULT_LIMIT),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
