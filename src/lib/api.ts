const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('vibria_admin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /** Upload a file (multipart) */
  upload: async (file: File, folder: string): Promise<{ path: string; url: string }> => {
    const token = localStorage.getItem('vibria_admin_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Upload failed');
    }
    return res.json();
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VEvent {
  id: number;
  title: string;
  subtitle: string | null;
  date: string;
  end_date: string | null;
  time: string;
  type: string | null;
  description: string | null;
  admission: string;
  total_seats: number;
  reserved_seats?: number;
  reserved_by_date?: Record<string, number>;
  image_path: string | null;
  gallery_count?: number;
  is_published: number;
  created_at: string;
}

export interface Artist {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
}

export interface BoardMember {
  id: number;
  name: string;
  nickname: string | null;
  bio: string;
  image_path: string | null;
  sort_order: number;
}

export interface GalleryImage {
  id: number;
  title: string | null;
  description: string | null;
  image_path: string;
  category: string;
  sort_order: number;
}

export interface Reservation {
  id: number;
  event_id: number;
  reservation_date: string;
  event_title?: string;
  event_date?: string;
  name: string;
  email: string;
  phone: string | null;
  seating_zone: string | null;
  seats: number;
  status: string;
  checked_in_at: string | null;
  checkin_token: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: number;
  created_at: string;
}

export type EmailLogType =
  | "reservation_confirmation"
  | "reservation_admin"
  | "contact_admin";

export interface EmailLogListItem {
  id: number;
  recipient: string;
  subject: string;
  type: EmailLogType;
  status: "sent" | "failed";
  error_message: string | null;
  related_id: number | null;
  created_at: string;
}

export interface EventImage {
  id: number;
  image_path: string;
  sort_order: number;
}

export interface AdminStats {
  upcoming_events: number;
  total_reservations: number;
  /** Reservations awaiting confirmation */
  pending_reservations: number;
  unread_messages: number;
  /** Count of failed outbound emails in the last 24 hours */
  failed_emails_24h: number;
}
