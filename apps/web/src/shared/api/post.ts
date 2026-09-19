export interface CategoryRef {
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: CategoryRef | null;
  tags: CategoryRef[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
