"use server";

/**
 * The upload endpoint.
 *
 * ITS OWN FILE, for the same reason auth-actions.ts is: every export of a
 * "use server" module becomes a callable HTTP endpoint the moment any client
 * component imports anything from it. This one takes a file off the wire and
 * writes it to disk, which is the highest-consequence thing the panel does, so
 * it is worth being able to read the whole of it in one screen rather than
 * finding it in the middle of the content editors.
 *
 * requireAdmin() IS THE FIRST LINE, and here that is not a formality. Without
 * it this is an open file-upload endpoint on a public marketing site — the one
 * shape of bug that turns a content panel into someone else's file host.
 */

import { requireAdmin } from "@/lib/admin/session";
import { saveUpload, type UploadResult } from "@/lib/admin/uploads";

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "No file arrived." };
  }

  /* EVERY OTHER CHECK — type, size, magic numbers, where it lands — is in
     lib/admin/uploads. This function is the boundary and that one is the
     policy, so swapping the disk for object storage later does not mean
     re-reading the auth code. */
  return saveUpload(file);
}
