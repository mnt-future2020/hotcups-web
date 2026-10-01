import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, Notice, PageHead } from "../../ui";
import HeroForm from "./HeroForm";

export const metadata: Metadata = { title: "Hero" };

export default async function HeroPage() {
  await requireAdmin();
  const { hero } = await getContent();

  return (
    <>
      <PageHead
        title="Hero"
        lead="The slides at the top of the home page."
      />

      <div className="space-y-4">
        <Notice tone="note">
          Slide 1 is a live scene, not a flat photograph, so it takes two
          pictures and cannot be removed. You can add as many slides after it as
          you like.
        </Notice>

        <Card>
          <HeroForm hero={hero} />
        </Card>
      </div>
    </>
  );
}
