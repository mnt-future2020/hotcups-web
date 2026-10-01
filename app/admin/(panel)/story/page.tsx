import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, PageHead } from "../../ui";
import StoryForm from "./StoryForm";

export const metadata: Metadata = { title: "Story" };

export default async function StoryAdminPage() {
  await requireAdmin();
  const { story } = await getContent();

  return (
    <>
      <PageHead
        title="Story"
        lead="The timeline on the home page, one stop per year."
      />

      <div className="space-y-4">
        {/* ── TWO NOTICES WERE HERE AND HAVE BEEN REMOVED ─────────
            Both at the client's direction. Neither was wrong, so what they
            said is kept here rather than lost:

            1. THESE ARE FACTS ABOUT THE BUSINESS, NOT MARKETING COPY. The
               stops carry "50+ machines deployed" and the RFID claim; they go
               out as statements and should change only on the client's word.

            2. THE FAINT YEARS BEHIND THE TIMELINE DO NOT FOLLOW THIS LIST.
               "2019" and "2026" are painted into story-bg.webp rather than
               rendered, so adding a stop cannot move them — changing them
               means a new background plate.

            THE SECOND ONE IS THE LOSS WORTH NAMING. It is not a caution, it
            is a fact about the machinery that nobody could guess from this
            screen, and the first person to add a 2027 stop will wonder why one
            pair of years will not update. StoryForm's own notes still record
            it; this page no longer warns anybody in advance. */}

        <Card>
          <StoryForm story={story} />
        </Card>
      </div>
    </>
  );
}
