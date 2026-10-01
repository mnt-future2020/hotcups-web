import type { Metadata } from "next";
import Logo from "@/components/layout/Logo";
import { credentialSource, isProduction, adminEmail } from "@/lib/admin/config";
import LoginForm from "./LoginForm";
import { Card, Notice } from "../ui";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The only page on /admin that answers to someone without a session.
 *
 * WHY IT TELLS AN UNAUTHENTICATED VISITOR THE DEFAULT PASSWORD. Because it only
 * does so when the default password is in force, and when it is, that password
 * is already published in lib/admin/config.ts in a git repository — the panel is
 * open either way, and the notice is what makes that fact visible to the person
 * who can fix it rather than only to the person exploiting it. The same
 * condition throws rather than renders in production (assertProductionReady), so
 * there is no deployment where this box is both visible and a disclosure.
 *
 * The block below is therefore development-only by construction: `isProduction`
 * gates it, and if production somehow reaches the default branch the login
 * action refuses the credential outright.
 */
export default async function LoginPage({
  searchParams,
}: {
  /* A PROMISE. searchParams became async in Next 15 and awaiting it is not
     optional here — reading `.next` off the promise silently yields undefined
     and every login would land on the dashboard instead of where the visitor
     was going. */
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const usingDefaults = !isProduction && credentialSource() === "default";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        {/* The site's own lockup. It is the only decoration on this page and it
            is doing a job: it tells whoever opened a bookmarked URL which
            client's panel they are looking at, and it is a way back to the
            public site from a login screen.

            `size` rather than a width in className, because Logo's own note
            says two `w-[…]` classes on one element is a specificity tie decided
            by whatever order Tailwind emitted them in. */}
        <Logo size="w-[150px]" />
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-mute">
          Content panel
        </p>
      </div>

      <Card>
        <LoginForm next={next ?? "/admin"} />
      </Card>

      {usingDefaults ? (
        <div className="mt-5">
          <Notice tone="warn">
            No credentials are configured, so this panel is using the development
            defaults —{" "}
            <code className="rounded bg-amber-950/10 px-1.5 py-0.5 font-mono text-[0.8rem]">
              {adminEmail()}
            </code>{" "}
            /{" "}
            <code className="rounded bg-amber-950/10 px-1.5 py-0.5 font-mono text-[0.8rem]">
              hotcups-admin
            </code>
            . Set <code className="font-mono">ADMIN_EMAIL</code>,{" "}
            <code className="font-mono">ADMIN_PASSWORD_HASH</code> and{" "}
            <code className="font-mono">SESSION_SECRET</code> in{" "}
            <code className="font-mono">.env.local</code> before this goes
            anywhere public — see <code className="font-mono">.env.example</code>
            . A production build refuses to sign anyone in until you do.
          </Notice>
        </div>
      ) : null}
    </div>
  );
}
