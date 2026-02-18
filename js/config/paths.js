// Needed to run on live server and github page
// Depending on host the paths are adapted
export function getBasePath() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (location.hostname.endsWith("github.io") && parts.length > 0) {
    return `/${parts[0]}/`;
  }
  return "/";
}

export function toBaseUrl(relPath) {
  return new URL(relPath, location.origin + getBasePath()).toString();
}

export function rewriteNavLinksToBase() {
  const base = getBasePath();
  document.querySelectorAll("a[data-nav]").forEach((a) => {
    const raw = a.getAttribute("href") || "";
    if (/^(https?:)?\/\//.test(raw) || raw.startsWith("#")) return;
    a.setAttribute("href", base + raw.replace(/^\/+/, ""));
  });
}
