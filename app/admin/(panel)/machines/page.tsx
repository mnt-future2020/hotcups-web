import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, Notice, PageHead } from "../../ui";
import MachinesForm from "./MachinesForm";

export const metadata: Metadata = { title: "Machines" };

export default async function MachinesAdminPage() {
  await requireAdmin();
  const { machines } = await getContent();

  return (
    <>
      <PageHead
        title="Machines"
        lead="The units on the home page and on /machines."
      />

      <div className="space-y-4">
        {/* ONE NOTICE, AND ONLY BECAUSE IT NAMES A RULE THE FORM ENFORCES.
            Everything else that stood here — why the brand names came off, what
            the middle unit's photograph actually shows, which filenames still
            carry the old marks — is history. It is true, it is worth keeping,
            and it belongs in the code comments where it already is: an operator
            opening this page to change a capacity cannot act on any of it. */}
        <Notice tone="note">
          Smallest to largest. Each unit picks up where the last one stopped.
        </Notice>

        <Card>
          <MachinesForm machines={machines} />
        </Card>
      </div>
    </>
  );
}
