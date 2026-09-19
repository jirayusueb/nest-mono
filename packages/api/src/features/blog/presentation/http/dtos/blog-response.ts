import type { PostDto } from "../../../application/dtos/blog-dtos";

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

/** Date → ISO at the wire. */
export function toPostResponse(dto: PostDto): PostResponse {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    content: dto.content,
    category: dto.category,
    tags: dto.tags,
    thumbnailUrl: dto.thumbnailUrl,
    createdAt: dto.createdAt.toISOString(),
    updatedAt: dto.updatedAt.toISOString(),
  };
}
