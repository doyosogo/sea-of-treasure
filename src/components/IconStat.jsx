function IconStat({ icon, value, label, alt = "" }) {
  return (
    <div className="icon-stat">
      {icon ? <img alt={alt || label} className="icon-stat-image" src={icon} /> : <span className="icon-stat-image placeholder" aria-hidden="true" />}
      <div className="icon-stat-copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default IconStat;
