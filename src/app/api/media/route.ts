import { MediaError, saveUpload } from "@/lib/media";
import { getSessionUser } from "@/lib/auth";
import { flush } from "@/lib/persist";

/**
 * Upload an invitation photo or video. Returns the stored asset so the event
 * form can preview it and submit its id. Kept out of server actions because
 * their 1 MB body limit is smaller than a WhatsApp video.
 */
export async function POST(request: Request) {
  if (!(await getSessionUser())) return Response.json({ error: "Sign in first." }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Upload a file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Upload a file." }, { status: 400 });

  try {
    const asset = await saveUpload(file);
    await flush();
    return Response.json({
      id: asset.id,
      kind: asset.kind,
      fileName: asset.fileName,
      size: asset.size,
      url: `/api/media/${asset.id}`,
    });
  } catch (e) {
    if (e instanceof MediaError) return Response.json({ error: e.message }, { status: 422 });
    console.error("[media] upload failed", e);
    return Response.json({ error: "The upload didn't go through. Try again." }, { status: 500 });
  }
}
