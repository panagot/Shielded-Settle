#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO = Path(r"C:\Users\panag\Desktop\ZCash\MIDNIGHT\escrow-index")
GIT = r"C:\Program Files\Git\bin\git.exe"


def run(args: list[str], *, input_text: str | None = None) -> str:
    completed = subprocess.run(
        [GIT, *args],
        cwd=REPO,
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
        env={
            **os.environ,
            "GIT_AUTHOR_NAME": "panagot",
            "GIT_AUTHOR_EMAIL": "panagot@users.noreply.github.com",
            "GIT_COMMITTER_NAME": "panagot",
            "GIT_COMMITTER_EMAIL": "panagot@users.noreply.github.com",
        },
    )
    if completed.returncode != 0:
        sys.stderr.write(completed.stderr or "")
        raise SystemExit(completed.returncode)
    return completed.stdout.strip()


def main() -> None:
    run(["rm", "-r", "--cached", "-f", ".vite"] ) if (REPO / ".vite").exists() else None
    subprocess.run([GIT, "rm", "-r", "--cached", "-f", ".vite"], cwd=REPO, check=False)
    run(["add", "-A"])
    # Keep helper / local junk out
    for path in ("scripts", "_clean_commit.py", "PRODUCT.md", "DESIGN.md"):
        subprocess.run([GIT, "rm", "-r", "--cached", "-f", path], cwd=REPO, check=False)
    tree = run(["write-tree"])
    parent = run(["rev-parse", "HEAD"])
    message = (
        "Align README with hackathon judge review and drop Vite cache from the tree.\n"
        "\n"
        "Clarify simulated demo vs Compact/kit scope, fix HOW_TO_USE paths, ignore .vite.\n"
    )
    commit = run(["commit-tree", tree, "-p", parent], input_text=message)
    run(["update-ref", "refs/heads/main", commit])
    run(["checkout", "-f", "main"])
    print(commit)
    print(run(["log", "-1", "--format=%B"]))
    print("has_cursor", "Cursor" in run(["log", "-1", "--format=%B"]))
    print("has_vite", any(p.startswith(".vite/") for p in run(["ls-tree", "-r", "--name-only", "HEAD"]).splitlines()))


if __name__ == "__main__":
    main()
