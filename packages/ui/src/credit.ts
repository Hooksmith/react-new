/** Text colour for a credit score, paired with the number itself (never colour alone). */
export function creditScoreTone(score: number): string {
  if (score >= 670) return "text-success";
  if (score >= 580) return "text-warning";
  return "text-danger";
}
