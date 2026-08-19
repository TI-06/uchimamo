export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '');
}

export function absoluteUrl(siteUrl: string, pathname: string): string {
  const base = `${normalizeSiteUrl(siteUrl)}/`;
  const normalizedPath = pathname.replace(/^\/+/, '');
  return new URL(normalizedPath, base).toString();
}
