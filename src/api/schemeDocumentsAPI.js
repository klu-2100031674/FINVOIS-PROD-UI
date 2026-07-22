import { apiClient } from './api';

export async function listSchemeDocuments(schemeKey) {
  const response = await apiClient.get(`/admin/schemes/${encodeURIComponent(schemeKey)}/documents`);
  return response.data;
}

export async function uploadSchemeDocument(schemeKey, file, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `/admin/schemes/${encodeURIComponent(schemeKey)}/documents`,
    formData,
    {
      timeout: 120000,
      onUploadProgress,
    }
  );
  return response.data;
}

export async function deleteSchemeDocument(schemeKey, filename) {
  const response = await apiClient.delete(
    `/admin/schemes/${encodeURIComponent(schemeKey)}/documents/${encodeURIComponent(filename)}`
  );
  return response.data;
}
