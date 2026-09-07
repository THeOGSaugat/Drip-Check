import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const USERNAME_RE = /^[a-z0-9._]{2,24}$/;

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string; ext: string } {
  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Unsupported image format.");
  const contentType = match[1]!;
  const ext = match[2] === "jpeg" ? "jpg" : match[2]!;
  const bytes = new Uint8Array(Buffer.from(match[3]!, "base64"));
  return { bytes, contentType, ext };
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, created_at")
      .eq("id", context.userId)
      .single();

    if (error) {
      console.error("[account] getMyProfile failed", error);
      return { ok: false as const, error: "Could not load your profile." };
    }
    return { ok: true as const, profile: data };
  });

const updateProfileInput = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, "2-24 chars: lowercase letters, numbers, dot, underscore."),
  displayName: z.string().trim().min(1).max(40),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateProfileInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ username: data.username, display_name: data.displayName })
      .eq("id", context.userId);

    if (error) {
      const message =
        error.code === "23505"
          ? "That username is already taken."
          : "Could not update your profile.";
      console.error("[account] updateMyProfile failed", error);
      return { ok: false as const, error: message };
    }
    return { ok: true as const };
  });

export const listSavedFits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_fits")
      .select("id, image_url, drip_score, style_label, summary, breakdown, source, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[account] listSavedFits failed", error);
      return { ok: false as const, error: "Could not load your saved fits." };
    }
    return { ok: true as const, fits: data ?? [] };
  });

const saveFitInput = z.object({
  image: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "Image is too large — try a smaller photo."),
  dripScore: z.number().min(1).max(10),
  styleLabel: z.string().max(60),
  summary: z.string().max(500).optional(),
  breakdown: z.record(z.string(), z.number()).optional(),
  source: z.enum(["photo", "live"]).default("photo"),
});

export const saveFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveFitInput.parse(data))
  .handler(async ({ data, context }) => {
    let bytes: Uint8Array, contentType: string, ext: string;
    try {
      ({ bytes, contentType, ext } = dataUrlToBytes(data.image));
    } catch {
      return { ok: false as const, error: "Unsupported image format." };
    }

    const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await context.supabase.storage
      .from("saved-fits")
      .upload(path, bytes, { contentType, upsert: false });

    if (uploadError) {
      console.error("[account] saveFit upload failed", uploadError);
      return { ok: false as const, error: "Could not upload the image." };
    }

    const { data: publicUrl } = context.supabase.storage.from("saved-fits").getPublicUrl(path);

    const { data: row, error } = await context.supabase
      .from("saved_fits")
      .insert({
        user_id: context.userId,
        image_url: publicUrl.publicUrl,
        drip_score: data.dripScore,
        style_label: data.styleLabel,
        summary: data.summary ?? null,
        breakdown: data.breakdown ?? {},
        source: data.source,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[account] saveFit insert failed", error);
      return { ok: false as const, error: "Could not save this fit." };
    }
    return { ok: true as const, id: row.id };
  });

const deleteFitInput = z.object({ id: z.string().uuid() });

export const deleteSavedFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteFitInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_fits")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) {
      console.error("[account] deleteSavedFit failed", error);
      return { ok: false as const, error: "Could not remove this fit." };
    }
    return { ok: true as const };
  });
