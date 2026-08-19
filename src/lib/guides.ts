import type { Guide } from '../data/guides';

export function validateGuideCatalog(guides: Guide[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const guide of guides) {
    if (!guide.slug.trim()) errors.push('slug is required');
    if (seen.has(guide.slug)) errors.push(`duplicate slug: ${guide.slug}`);
    seen.add(guide.slug);
    if (guide.title.trim().length < 12) errors.push(`${guide.slug}: title is too short`);
    if (guide.description.trim().length < 30) errors.push(`${guide.slug}: description is too short`);
    if (guide.conclusion.trim().length < 30) errors.push(`${guide.slug}: conclusion is too short`);
    if (guide.sections.length < 3) errors.push(`${guide.slug}: requires at least 3 sections`);
    if (!guide.source?.url.startsWith('https://')) errors.push(`${guide.slug}: source URL is required`);
    for (const section of guide.sections) {
      if (!section.heading.trim()) errors.push(`${guide.slug}: section heading is required`);
      if (!section.paragraphs.length || section.paragraphs.some((paragraph) => paragraph.trim().length < 20)) {
        errors.push(`${guide.slug}: section paragraphs are insufficient`);
      }
    }
  }

  return errors;
}

export function getGuideBySlug(guides: Guide[], slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
