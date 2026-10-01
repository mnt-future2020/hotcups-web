"use client";

import { useFormStatus } from "react-dom";
import { primaryButton } from "./ui";

/**
 * A submit button that knows its own form is in flight.
 *
 * useFormStatus RATHER THAN THE `pending` FROM useActionState, and the reason is
 * where the state has to be read. useActionState returns pending in the
 * component that CALLS it, which for every form in this panel is the form
 * component itself; passing it down as a prop works and means every form
 * re-declares the same disabled/label logic. useFormStatus reads the enclosing
 * <form> from context, so this component is self-contained and a form's only
 * job is to render it.
 *
 * WHY DISABLING MATTERS HERE MORE THAN USUALLY. A save writes a file and then
 * revalidates every page on the site, which is not instant. Without this, a
 * second click posts the same form again — and since two saves of different
 * sections can overwrite each other (see the note on locking in
 * lib/content/store.ts), a double submit is the one concurrency case a single
 * operator can actually produce.
 */
export default function SubmitButton({
  children = "Save",
  pendingLabel = "Saving…",
}: {
  children?: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? (
        <>
          {/* aria-hidden, and the label beside it carries the meaning. A spinner
              is the only thing on screen that says "still working", so it has to
              be said in text as well. */}
          <span
            aria-hidden
            className="size-3.5 animate-spin rounded-full border-2 border-cream/35 border-t-cream"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
