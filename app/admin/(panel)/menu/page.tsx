import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Card, Notice, PageHead } from "../../ui";
import MenuForm from "./MenuForm";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage() {
  await requireAdmin();
  const { menu } = await getContent();

  return (
    <>
      <PageHead
        title="Menu"
        lead="The drinks on the home page, on /menu and on /service."
      />

      <div className="space-y-4">
        <Notice tone="note">
          A <strong className="font-bold">category</strong> is a card in the
          row, and each one holds its{" "}
          <strong className="font-bold">drinks</strong>. More than one drink and
          the card opens a drawer.
        </Notice>

        <Card>
          <MenuForm menu={menu} />
        </Card>
      </div>
    </>
  );
}
