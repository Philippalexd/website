export async function loadPartials() {
  // head include
  const headMarker = document.querySelector("meta[data-include]");
  if (headMarker) {
    const path = headMarker.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    headMarker.insertAdjacentHTML("beforebegin", await res.text());
    headMarker.remove();
  }

  // body includes
  const hosts = document.querySelectorAll("div[data-include]");
  for (const host of hosts) {
    const path = host.getAttribute("data-include");
    const res = await fetch(path, { cache: "no-store" });
    host.outerHTML = await res.text();
  }
}
