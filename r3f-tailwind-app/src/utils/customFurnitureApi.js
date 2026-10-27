import {
  API_BASE_URL,
  request,
  getSession,
  clearSession,
} from '../lib/apiClient.js';

function endpoint(workspaceId) {
  if (workspaceId == null || String(workspaceId).trim() === '') {
    throw new Error('Open a workspace before using custom furniture.');
  }

  return `/api/workspaces/${encodeURIComponent(workspaceId)}/custom-furniture`;
}

export async function listCustomFurniture(workspaceId) {
  if (workspaceId == null || workspaceId === '') return [];

  const payload = await request(endpoint(workspaceId));
  return Array.isArray(payload) ? payload : [];
}

export async function uploadCustomFurniture(workspaceId, {
  name,
  category,
  description,
  model,
  thumbnail,
}) {
  const form = new FormData();
  form.append('name', name);
  form.append('category', category);

  if (description) form.append('description', description);

  form.append('model', model);
  form.append('thumbnail', thumbnail);

  const session = getSession();
  const headers = {};

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint(workspaceId)}`,
    {
      method: 'POST',
      headers,
      body: form,
    },
  );

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (response.ok === false) {
    if (response.status === 401) clearSession();

    const message =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      `Custom furniture request failed (${response.status}).`;

    throw new Error(message);
  }

  return payload;
}
