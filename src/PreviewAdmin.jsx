import { useState } from "react";
import { PREVIEW_KEY, readPreview } from "./preview-store";
export default function PreviewAdmin() {
  const [state, setState] = useState(() => readPreview());
  const [error, setError] = useState("");
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 500000) { setError("Choose a PNG, JPEG or WebP under 500 KB for this local demo."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = readPreview();
        next.uploads.push({ id: crypto.randomUUID(), name: file.name, url: reader.result });
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(next)); setState(next);
      } catch { setError("Browser storage is full or unavailable."); }
    };
    reader.onerror = () => setError("Unable to read this file.");
    reader.readAsDataURL(file);
  }
  return <main style={{ padding: "100px 6vw", maxWidth: 1000, margin: "auto" }}>
    <h1>Local preview dashboard</h1>
    <p>No production login or database is connected. These demo records exist only in this browser. No emails are sent.</p>
    <p>This page is not owner authentication. Use Vercel deployment protection if access must be restricted.</p>
    <button onClick={() => setState(readPreview())}>Refresh local records</button>{" "}
    <button onClick={() => { if (confirm("Delete this browser’s preview records?")) { localStorage.removeItem(PREVIEW_KEY); setState(readPreview()); } }}>Reset demo data</button>
    {["inquiries", "feedback", "subscribers", "marks"].map(key => <section key={key} style={{ marginTop: 32 }}><h2>{key} ({state[key].length})</h2>{state[key].map(item => <pre key={item.id} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(item, null, 2)}</pre>)}</section>)}
    <h2>Local image upload demo</h2><input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
    {error && <p role="alert">{error}</p>}
    {state.uploads.map(item => <figure key={item.id}><img src={item.url} alt={item.name} style={{ maxWidth: "100%", maxHeight: 220 }} /><figcaption>{item.name}</figcaption></figure>)}
  </main>;
}
