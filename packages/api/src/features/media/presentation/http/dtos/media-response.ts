export interface UploadTargetResponse {
  key: string;
  uploadUrl: string;
  url: string;
}

export interface ConfirmMediaResponse {
  url: string;
}

export interface MediaItemResponse {
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  createdAt: string;
}

export interface MediaListResponse {
  media: MediaItemResponse[];
}
