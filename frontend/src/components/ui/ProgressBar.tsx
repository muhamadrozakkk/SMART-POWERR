export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "amber" | "green" }) {
  return <div className="progress-track"><div className={`progress-fill fill-${tone}`} style={{ width: `${Math.min(value, 100)}%` }} /></div>;
}
