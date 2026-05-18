// Single source of truth for environment-specific URL bases.
// External tools resolve to `<subdomain>.<devBase>` in dev,
// `<subdomain>.<prodHost>` in prod. Built-ins always live at host paths.
export const urlConfig = {
  devBase: "web-tools.localhost",
  prodHost: "example.com", // TODO: replace when real prod domain is decided
};
