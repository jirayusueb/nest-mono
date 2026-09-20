export interface PostResponse {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  name: string;
  slug: string;
}

export interface CategoryListResponse {
  categories: CategoryResponse[];
}
