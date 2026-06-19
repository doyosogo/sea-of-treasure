function PageScene({ scene, title, subtitle }) {
  if (!scene) {
    return null;
  }

  return (
    <section className="scene-banner pixel-panel" aria-label={title ? `${title} scene banner` : "Scene banner"}>
      <img alt="" className="scene-banner-image" src={scene} />
      <div className="scene-banner-copy">
        {title && <h2>{title}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}

export default PageScene;
