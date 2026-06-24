import { useId } from "react";

function Tooltip({ label, text, position = "top", children }) {
  const tooltipId = useId();

  return (
    <span className={`tooltip tooltip-${position}`}>
      <span className="tooltip-trigger" tabIndex={0} aria-describedby={tooltipId} aria-label={label}>
        {children ?? label}
      </span>
      <span className="tooltip-bubble" id={tooltipId} role="tooltip">
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
