import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, Notice, PageHead } from "../../ui";
import WorkplacesForm from "./WorkplacesForm";

export const metadata: Metadata = { title: "Services" };

export default async function WorkplacesAdminPage() {
  await requireAdmin();
  const { whoWeServe, contact } = await getContent();

  const unconfirmed = whoWeServe.places.filter((p) => p.placeholder).length;

  return (
    <>
      <PageHead
        title="Services"
        lead="The chips on the home page and the cards on /who-we-serve."
      />

      <div className="space-y-4">
        {/* THE UNCONFIRMED-FACTS WARNING WAS HERE. It counted the tick
            that this form no longer has, so it could only ever have counted up
            — see the note where the control stood. The `unconfirmed` figure it
            used is still computed above and still shown on the dashboard tile,
            where it reads as a fact about the content rather than as a task
            nobody can finish. */}

        <Card>
          <WorkplacesForm whoWeServe={whoWeServe} contact={contact} />
        </Card>
      </div>
    </>
  );
}
