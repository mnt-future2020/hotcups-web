import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { PageHead } from "../../ui";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact details" };

/**
 * THE "WHAT THESE CURRENTLY BUILD" CARD THAT WAS HERE HAS GONE INTO THE FORM.
 * It listed the assembled tel:, wa.me, mailto: and maps links so they could be
 * clicked and checked — a good idea in the wrong place. Rendered here it could
 * only show the SAVED values, so the one moment it was needed, between typing a
 * number and committing it, was exactly the moment it could not help. The same
 * four links are now built from the live fields and sit under the boxes that
 * feed them.
 *
 * WHICH ALSO MEANS THIS PAGE NEEDS NOTHING FROM lib/content/links ANY MORE.
 */
export default async function ContactPage() {
  await requireAdmin();
  const { contact } = await getContent();

  return (
    <>
      <PageHead
        title="Contact details"
        lead="The number, the inbox and the address."
      />

      <div className="space-y-4">
        {/* A WARNING STOOD HERE AND HAS BEEN REMOVED at the client's
            direction: that nobody had checked these values and that every one
            of them is a live link.

            WHAT IT WAS GUARDING IS STILL TRUE. lib/contact.ts opens with the
            same point in exclamation marks — the number, the inbox and the
            address arrived as placeholders, and tel: dials, mailto: sends,
            wa.me opens a chat. A wrong value here does not look wrong on the
            page; it routes a real enquiry to a real stranger.

            THE FORM ITSELF STILL SHOWS THE LINKS, which is the better half of
            what the banner did: each field has the href it builds underneath
            it and a "Try it" that fires. Checking is now something you do
            rather than something you are told to do. */}

        <ContactForm contact={contact} />
      </div>
    </>
  );
}
