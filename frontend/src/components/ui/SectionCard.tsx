export function SectionCard({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return <section className={`panel-card ${className}`}>{title ? <div className="panel-heading"><h2>{title}</h2>{action}</div> : null}{children}</section>;
}
