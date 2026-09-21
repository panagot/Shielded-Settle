import type { EscrowStatus } from "@kit/types";

const STEPS = [
  { label: "Deploy", tip: "Instantiate the vault." },
  { label: "Deposit", tip: "Shielded coin enters the tree." },
  { label: "Resolve", tip: "Recover the real mtIndex." },
  { label: "Settle", tip: "Release or refund with a non-zero index." },
] as const;

function stepIndex(status: EscrowStatus): number {
  switch (status) {
    case "idle":
      return -1;
    case "deployed":
      return 0;
    case "funded":
      return 1;
    case "index-resolved":
      return 2;
    case "released":
    case "refunded":
      return 3;
    default:
      return -1;
  }
}

export function FlowSteps({ status }: { status: EscrowStatus }) {
  const active = stepIndex(status);
  const progress = active < 0 ? 0 : ((active + 1) / STEPS.length) * 100;

  return (
    <div className="flow-rail" aria-label="Escrow progress">
      <div className="flow-track">
        <div className="flow-progress" style={{ width: `${progress}%` }} />
      </div>
      <ol className="flow-steps">
        {STEPS.map((step, i) => {
          const done = i < active || (i === 3 && active === 3);
          const current = i === active;
          return (
            <li
              key={step.label}
              className={["flow-step", done ? "is-done" : "", current ? "is-current" : ""]
                .filter(Boolean)
                .join(" ")}
              title={step.tip}
            >
              <span className="flow-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
