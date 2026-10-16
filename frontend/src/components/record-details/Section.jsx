export default function Section({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rdv-section ${className}`.trim()}>
      <div className="rdv-section-heading">
        {Icon && <span className="rdv-section-icon"><Icon size={17} aria-hidden="true" /></span>}
        <h3>{title}</h3>
      </div>
      <div className="rdv-section-body">{children}</div>
    </section>
  );
}
