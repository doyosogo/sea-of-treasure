import { LOGO } from "../data/assets.js";

function PageHeader({ title, subtitle }) {
  return (
    <header className="page-header pixel-panel">
      <img alt="Sea of Treasure logo" className="page-header-logo" src={LOGO} />
      <div className="page-header-copy">
        <p className="eyebrow">Sea of Treasure</p>
        <h1>{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}

export default PageHeader;
