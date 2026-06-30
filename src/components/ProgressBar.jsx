function ProgressBar({
  value = 0,
  ariaLabel,
  trackClassName = "",
  fillClassName = ""
}) {
  const normalizedValue = Math.max(0, Math.min(100, Number(value ?? 0)));

  return (
    <div
      className={["progress-track", trackClassName].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <div
        className={["progress-fill", fillClassName].filter(Boolean).join(" ")}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

export default ProgressBar;
