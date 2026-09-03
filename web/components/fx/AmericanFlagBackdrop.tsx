export function AmericanFlagBackdrop() {
  return (
    <div aria-hidden="true" className="flag-film">
      <video
        className="flag-film__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source src="/media/american-flag-brand-film.mp4" type="video/mp4" />
      </video>
      <div className="flag-film__wash" />
      <div className="flag-film__edge" />
    </div>
  );
}
