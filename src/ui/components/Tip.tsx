import * as Tooltip from "@radix-ui/react-tooltip";
import { useState, type ReactNode } from "react";

/**
 * Tooltip that never replaces the child with a broken trigger.
 * Wraps in a span so disabled buttons still allow hover tips,
 * and clicks always reach the real control.
 */
export function Tip({
  content,
  children,
  side = "top",
  hoverOnly = false,
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /** Nav tips should not stay open after a click moves focus. */
  hoverOnly?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Tooltip.Root open={hoverOnly ? hover : undefined} delayDuration={280}>
      <Tooltip.Trigger asChild>
        <span
          className="tip-anchor"
          tabIndex={-1}
          onPointerEnter={hoverOnly ? () => setHover(true) : undefined}
          onPointerLeave={hoverOnly ? () => setHover(false) : undefined}
        >
          {children}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="tip-content"
          side={side}
          sideOffset={8}
          collisionPadding={12}
        >
          {content}
          <Tooltip.Arrow className="tip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function TipProvider({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={80}>
      {children}
    </Tooltip.Provider>
  );
}
