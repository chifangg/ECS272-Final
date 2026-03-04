import "../styles/TutorialTopBar.css";

type Props = {
  menuEnabled: boolean;
  onMenuClick: () => void;
  showMenuHint: boolean;
};

export function TutorialTopBar({ menuEnabled, onMenuClick, showMenuHint }: Props) {
  return (
    <div className="ttb-root" aria-label="tutorial top bar">
      <div className="ttb-title">This is your Travel City Choices Tool</div>

      <div className="ttb-right">

        <div className={`ttb-hint ${showMenuHint ? "is-on" : ""}`} aria-hidden={!showMenuHint}>
          <div className="ttb-hintBubble">
            <span className="ttb-hand" aria-hidden="true">
              ☞
            </span>
            <span className="ttb-hintText">click here!</span>
          </div>
        </div>

        <button
          className={`ttb-menuBtn ${menuEnabled ? "is-enabled" : "is-disabled"}`}
          onClick={onMenuClick}
          aria-label="menu"
          disabled={!menuEnabled}
          type="button"
        >
          <span className="ttb-burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </div>
  );
}