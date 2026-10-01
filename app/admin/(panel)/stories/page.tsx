import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { PageHead } from "../../ui";
import CasesManager from "./CasesManager";

export const metadata: Metadata = { title: "Case studies" };

export default async function StoriesPage() {
  await requireAdmin();
  const { cases } = await getContent();

  return (
    <>
      <PageHead
        title="Case studies"
        lead="The three stories on the home page."
      />

      {/* THE SIGN-OFF WARNING MOVED ONTO THE FIELD IT IS ABOUT — it now sits
          beside the body in the editor, where somebody is about to name a
          customer, rather than at the top of a list of headlines. */}
      <CasesManager cases={cases} />

    </>
  );
}
