export const PREVIEW_KEY = "liminal-isolated-preview-v1";
export function readPreview(storage = localStorage) {
  return JSON.parse(storage.getItem(PREVIEW_KEY) || '{"inquiries":[],"feedback":[],"subscribers":[],"marks":[],"uploads":[]}');
}
export async function previewRequest(path, { method = "GET", data = {} } = {}, storage = localStorage) {
  const url = new URL(path, "https://preview.invalid");
  const state = readPreview(storage);
  if (method === "GET") {
    if (url.pathname === "/api/community") return { settings: {}, answers: [] };
    if (url.pathname === "/api/marks") return { marks: state.marks, total: state.marks.length, page: 0, pages: 1 };
    for (const key of ["projects", "people", "partners", "testimonials"]) {
      if (url.pathname === `/api/${key}`) return { [key]: [] };
    }
  }
  const collection = { "/api/inquiries": "inquiries", "/api/feedback": "feedback", "/api/subscribe": "subscribers", "/api/marks": "marks" }[url.pathname];
  if (method === "POST" && collection) {
    const existing = data.requestId && state[collection].find(item => item.requestId === data.requestId);
    const item = existing || { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (!existing) state[collection].push(item);
    try { storage.setItem(PREVIEW_KEY, JSON.stringify(state)); }
    catch { throw new Error("Preview storage unavailable or full. No data was sent."); }
    return { ok: true, preview: true, mark: item, status: "pending", subscription: "unavailable" };
  }
  throw new Error("Preview only: this action requires the connected backend. No email or file was sent.");
}
