// Frontmatter dates are written as 2021-10-17 and parse as UTC midnight, so
// format in UTC to show the same day everywhere.
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
