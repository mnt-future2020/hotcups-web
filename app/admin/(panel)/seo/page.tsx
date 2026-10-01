import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, Notice, PageHead } from "../../ui";
import SeoForm from "./SeoForm";

export const metadata: Metadata = { title: "SEO Manager" };

export default async function SeoPage() {
  await requireAdmin();
  /* The contact details are not edited here and are not posted by this form.
     They fill in the structured-data templates, so one arrives carrying the
     real number and address rather than placeholders waiting to be published
     by accident. */
  const { seo, contact } = await getContent();

  const hidden = seo.pages.filter((p) => p.noindex);

  return (
    <>
      <PageHead
        title="SEO Manager"
        lead="What each page says when it turns up in a search result."
      />

      <div className="space-y-4">
        {seo.noindexAll ? (
          <Notice tone="warn">
            The whole site is kept out of search. Turn it off below before
            launch, or none of these pages will appear in Google.
          </Notice>
        ) : hidden.length > 0 ? (
          <Notice tone="note">
            {hidden.length}{" "}
            {hidden.length === 1 ? "page is" : "pages are"} kept out of search on
            purpose: {hidden.map((p) => p.path).join(", ")}. They are empty for
            now — take them off once there is something on them.
          </Notice>
        ) : null}

        <Card>
          <SeoForm seo={seo} contact={contact} />
        </Card>
      </div>
    </>
  );
}
