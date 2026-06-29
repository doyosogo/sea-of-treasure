import { useEffect } from "react";

const tutorialSteps = {
  welcome: {
    title: "Welcome to Sea of Treasure.",
    body: "Gold buys ships and upgrades, experience raises your level, and ships are your long-term milestones.",
    targetPage: "battle",
    navigationLabel: "Go to Battle",
    navigationPage: "battle",
    navigationStep: "battle"
  },
  battle: {
    title: "Go to Battle",
    body: "Fight one enemy to learn active combat and earn your first reward.",
    targetPage: "battle",
    navigationLabel: "Go to Battle",
    navigationPage: "battle",
    navigationStep: "battle"
  },
  ship: {
    title: "Return to My Ship",
    body: "Cannons shape your loadout, ammo powers each volley, and repairs keep you afloat.",
    targetPage: "myShip",
    navigationLabel: "Go to My Ship",
    navigationPage: "myShip",
    continueLabel: "Continue to Skills",
    continuePage: "skills",
    continueStep: "skills"
  },
  skills: {
    title: "Visit Skills",
    body: "Train Fishing once to gather supplies and unlock the next tutorial step.",
    targetPage: "skills",
    navigationLabel: "Go to Skills",
    navigationPage: "skills",
    navigationStep: "skills"
  },
  port: {
    title: "Visit Port",
    body: "Sell Fish when gold runs low. Trade goods and fishing keep the voyage moving.",
    targetPage: "port",
    navigationLabel: "Go to Port",
    navigationPage: "port",
    navigationStep: "port"
  },
  shop: {
    title: "Visit Shop",
    body: "Purchase ammunition so you can keep fighting and test your loadout.",
    targetPage: "shop",
    navigationLabel: "Go to Shop",
    navigationPage: "shop",
    navigationStep: "shop"
  },
  "battle-final": {
    title: "Return to Battle",
    body: "Fight again to finish the tutorial and claim your final reward.",
    targetPage: "battle",
    navigationLabel: "Go to Battle",
    navigationPage: "battle",
    navigationStep: "battle-final"
  }
};

const hintConfigs = {
  battle: {
    title: "Battle Tip",
    body: "Active combat earns bonus gold."
  },
  crew: {
    title: "Crew Tip",
    body: "Crew upgrades permanently improve your voyage."
  },
  shop: {
    title: "Shop Tip",
    body: "Ships are your largest long-term milestones."
  },
  port: {
    title: "Port Tip",
    body: "Trade goods and fishing help when gold runs low."
  }
};

function TutorialOverlay({ activePage, dispatch, gameState, onNavigate }) {
  const tutorial = gameState.tutorial ?? { completed: true, currentStep: "complete", dismissedHints: [] };

  useEffect(() => {
    if (tutorial.completed) {
      return;
    }

    if (tutorial.currentStep === "welcome" && activePage === "battle") {
      dispatch({ type: "SET_TUTORIAL_STEP", step: "battle" });
    }
  }, [activePage, dispatch, tutorial.completed, tutorial.currentStep]);

  if (tutorial.completed) {
    return <TutorialHints activePage={activePage} dispatch={dispatch} gameState={gameState} />;
  }

  const step = tutorialSteps[tutorial.currentStep] ?? tutorialSteps.welcome;
  const isOnTargetPage = activePage === step.targetPage;
  const showContinueAction = Boolean(step.continueLabel) && isOnTargetPage;
  const showNavigationAction = Boolean(step.navigationLabel) && !isOnTargetPage;
  const actionLabel = showContinueAction ? step.continueLabel : step.navigationLabel;
  const handleAction = () => {
    if (showContinueAction && step.continueStep) {
      dispatch({ type: "SET_TUTORIAL_STEP", step: step.continueStep });
      onNavigate?.(step.continuePage);
      return;
    }

    if (showNavigationAction) {
      if (step.navigationStep) {
        dispatch({ type: "SET_TUTORIAL_STEP", step: step.navigationStep });
      }

      onNavigate?.(step.navigationPage);
    }
  };

  return (
    <>
      <aside className="tutorial-overlay" aria-live="polite">
        <div className="tutorial-panel">
          <p className="eyebrow">Tutorial</p>
          <h2>{step.title}</h2>
          <p>{step.body}</p>

          {tutorial.currentStep === "welcome" ? (
            <p className="tutorial-note">Admiralty gifts have been added to your hold.</p>
          ) : null}

          <div className="tutorial-step-meta">
            <span>Step {getTutorialStepNumber(tutorial.currentStep)} of 7</span>
            <span>{isOnTargetPage ? "You are in the right place." : `Go to ${getTutorialPageLabel(step.targetPage)}`}</span>
          </div>

          {(showContinueAction || showNavigationAction) ? (
            <div className="tutorial-action-row">
              <button
                className="chunky-button primary"
                onClick={handleAction}
                type="button"
              >
                {actionLabel}
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <TutorialHints activePage={activePage} dispatch={dispatch} gameState={gameState} />
    </>
  );
}

function TutorialHints({ activePage, dispatch, gameState }) {
  const tutorial = gameState.tutorial ?? { dismissedHints: [] };

  return Object.entries(hintConfigs).map(([hintId, hint]) => {
    const isDismissed = (tutorial.dismissedHints ?? []).includes(hintId);
    const shouldShow = !isDismissed && activePage === hintId && !(hintId === "battle" && (tutorial.currentStep === "battle" || tutorial.currentStep === "battle-final"));

    if (!shouldShow) {
      return null;
    }

    return (
      <aside className="tutorial-hint" key={hintId}>
        <div>
          <p className="eyebrow">{hint.title}</p>
          <p>{hint.body}</p>
        </div>
        <button
          className="chunky-button"
          onClick={() => dispatch({ type: "DISMISS_TUTORIAL_HINT", hintId })}
          type="button"
        >
          Dismiss
        </button>
      </aside>
    );
  });
}

function getTutorialStepNumber(step) {
  const order = ["welcome", "battle", "ship", "skills", "port", "shop", "battle-final", "complete"];
  const index = order.indexOf(step);
  return index >= 0 ? index + 1 : 1;
}

function getTutorialPageLabel(pageId) {
  const labels = {
    dashboard: "Dashboard",
    battle: "Battle",
    myShip: "My Ship",
    skills: "Skills",
    port: "Port",
    shop: "Shop",
    crew: "Crew"
  };

  return labels[pageId] ?? pageId;
}

export default TutorialOverlay;
