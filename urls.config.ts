// Single source of truth for environment-specific URL bases.
//
// - The dashboard lives at `devBase` / `prodHost` (apex).
// - Built-ins live at host paths (`/<slug>`).
// - Externals live at `<subdomain>.<envExternalBase>`:
//     dev  → `<subdomain>.<devBase>`
//     prod → `<subdomain>.<prodExternalBase>`
//
// Why dashboard and externals diverge in prod: Cloudflare Free Universal SSL
// only covers 1-level wildcards (`*.donjor.net`). To get free TLS on the
// external subdomains they must live 1 level deep under the apex, not under
// `web-tools.donjor.net`.
export const urlConfig = {
  devBase: "web-tools.localhost",
  prodHost: "tools.donjor.net",
  prodExternalBase: "donjor.net",
  /** Old prod hosts that should 301 → prodHost. Source of truth for the
   *  redirect set the edge (Cloudflare) maintains. */
  prodHostRedirects: ["web-tools.donjor.net", "donjor.net"],
};
