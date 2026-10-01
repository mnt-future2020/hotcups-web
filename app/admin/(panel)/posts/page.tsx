import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import { Notice, PageHead } from "../../ui";
import PostsManager from "./PostsManager";

export const metadata: Metadata = { title: "Blog posts" };

export default async function PostsPage() {
  await requireAdmin();
  const { posts } = await getContent();

  return (
    <>
      <PageHead
        title="Blog posts"
        lead="The reading strip near the foot of the home page."
      />

      <div className="space-y-4">
        <Notice tone="note">
          Three cards fit the row on the home page. Each one opens its own
          post — write the article in the editor, or the card stays unclickable.
        </Notice>

        {/* The stored id is NOT on this form. It is derived from the headline
            on save — it is the slug in the post's own address, so changing the
            headline changes the URL. Showing it as a field would invite
            somebody to edit it into disagreement with the title it came from;
            what it must NOT become is a second thing to keep in step. */}
        <PostsManager posts={posts} />
      </div>
    </>
  );
}
