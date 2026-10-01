export async function request(
  path,
  { method = "GET", data, csrf, body, headers = {} } = {},
) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    signal: AbortSignal.timeout(
      path.endsWith("/upload")
        ? 120000
        : path.endsWith("/campaigns")
          ? 180000
          : 20000,
    ),
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : body,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Le service est indisponible. Réessayez.");
  }
  if (!response.ok)
    throw Object.assign(new Error(result.error || "Erreur de connexion."), {
      status: response.status,
    });
  return result;
}
