export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:8000";
