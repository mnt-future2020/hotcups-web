"use client";

import { useActionState, useState } from "react";
import { resetContentAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Notice } from "../../ui";

/**
 * Put everything back to the values the site shipped with.
 *
 * A TYPED WORD RATHER THAN A CONFIRM DIALOG. A dialog is one more click on the
 * way to the same place — it stops a misclick and nothing else. Typing "reset"
 * cannot happen by accident, and it makes the operator state what they are
 * about to do rather than dismiss a question about it.
 *
 * THE BUTTON STAYS DISABLED UNTIL THE WORD MATCHES, so the guard is visible
 * before it is needed rather than appearing as a refusal afterwards. The action
 * checks it again on the server, because a disabled button is a courtesy and
 * not a control.
 */
export default function ResetForm() {
  const [state, action] = useActionState<SaveState, FormData>(
    resetContentAction,
    undefined,
  );
  const [typed, setTyped] = useState("");
  const armed = typed.trim().toLowerCase() === "reset";

  return (
    <form action={action} className="space-y-4">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <p className="max-w-prose text-[0.875rem] leading-relaxed text-ink-soft">
        This throws away every edit made in this panel and puts the site back
        to how it shipped. Uploaded pictures stay on the server — the site just
        stops using them.
      </p>

      <label className="block max-w-xs">
        <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          Type <span className="font-mono lowercase">reset</span> to confirm
        </span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
        />
      </label>

      <div className={armed ? "" : "pointer-events-none opacity-55"}>
        <SubmitButton pendingLabel="Resetting…">
          Reset everything
        </SubmitButton>
      </div>
    </form>
  );
}
