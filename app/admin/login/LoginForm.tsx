"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../auth-actions";
import SubmitButton from "../SubmitButton";
import { Field, Notice } from "../ui";

/**
 * The login form.
 *
 * A CLIENT COMPONENT FOR ONE REASON: useActionState, which is what puts "that
 * email and password do not match" back on the screen without a full navigation
 * and without the action having to redirect to itself carrying an error in the
 * query string. The page around it stays a Server Component and does the work
 * that needs the server — reading whether this deployment is still on
 * development credentials.
 *
 * IT DEGRADES WITHOUT JAVASCRIPT. `action={action}` on a real <form> with real
 * named inputs is a normal POST if the bundle has not loaded; React's
 * progressive enhancement handles the rest, and the redirect on success is a 303
 * in that case rather than a client navigation. Nothing here depends on an
 * onSubmit handler, which is why.
 */
export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {/* WHERE THEY WERE HEADED, CARRIED THROUGH THE FORM RATHER THAN THE URL.
          proxy.ts puts it in the query string, the page reads it there and it
          rides along in the POST body, so the action does not have to reach for
          a request object it does not get. It is re-validated in the action —
          see safeNext — because a hidden field is as attacker-controlled as a
          query parameter. */}
      <input type="hidden" name="next" value={next} />

      {state?.error ? (
        /* label, because Notice's default word for this tone is "Not saved" —
           written for the four save forms, and nonsense on a login. */
        <Notice tone="bad" label="Sign-in failed">
          {state.error}
        </Notice>
      ) : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state?.email}
        placeholder="admin@hotcups.co.in"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        /* current-password, not new-password: it tells a password manager to
           offer the saved entry rather than to generate one. */
        autoComplete="current-password"
        required
      />

      <div className="pt-1">
        <SubmitButton pendingLabel="Checking…">Sign in</SubmitButton>
      </div>
    </form>
  );
}
