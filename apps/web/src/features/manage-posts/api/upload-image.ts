import { apiFetch } from "~/shared/api";

interface UploadTarget {
  key: string;
  uploadUrl: string;
  url: string;
}

export async function uploadImage(file: File): Promise<string> {
  const target = await apiFetch<UploadTarget>("/v1/media/target", {
    method: "POST",
    body: JSON.stringify({ contentType: file.type, bytes: file.size }),
  });

  const put = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!put.ok) {
    throw new Error(`Upload failed: ${put.status}`);
  }

  const confirmed = await apiFetch<{ url: string }>("/v1/media/confirm", {
    method: "POST",
    body: JSON.stringify({ key: target.key }),
  });

  return confirmed.url;
}
