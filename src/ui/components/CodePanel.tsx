import { useState } from "react";

const SAMPLE = `const result = resolveContractCoinMtIndex({
  snapshot: {
    firstFree: 0n,
    debugDump: zswapState.toString(true),
  },
  lookup: { contractAddress, coin },
});

if (!result.ok || !result.qualified) {
  throw new Error(result.detail);
}

await release(result.qualified);`;

export function CodePanel() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(SAMPLE);
      ok = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = SAMPLE;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand("copy");
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="code-panel">
      <div className="code-head">
        <span>resolveContractCoinMtIndex</span>
        <button type="button" className="btn btn-ghost copy-btn" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{SAMPLE}</code>
      </pre>
    </div>
  );
}
