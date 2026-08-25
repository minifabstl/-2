import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, models } from "@/db";
import { mediaUrl } from "@/lib/storage";

export const MODEL_NAME_MAX_LENGTH = 40;

export type ModelSummary = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string;
};

/** Turns a display name into a URL-safe slug: lowercase, ascii-ish, hyphenated. Never empty. */
function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "model";
}

/** Every model in the directory, newest first. */
export async function listModels(): Promise<ModelSummary[]> {
  const db = getDb();
  const rows = await db.select().from(models).orderBy(desc(models.createdAt));
  return rows.map((m) => ({ id: m.id, name: m.name, slug: m.slug, photoUrl: mediaUrl(m.photoKey) }));
}

/** A single model by its slug, or null if it doesn't exist. */
export async function getModelBySlug(slug: string): Promise<ModelSummary | null> {
  const db = getDb();
  const [row] = await db.select().from(models).where(eq(models.slug, slug)).limit(1);
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, photoUrl: mediaUrl(row.photoKey) };
}

/**
 * Creates a new model entry. `name` becomes the tag that content gets matched against (see
 * lib/posts.ts hasExactTag) — uploaders tag their videos/photos with this same name to have
 * them show up on the model's page. The slug is derived from the name and de-duplicated with a
 * numeric suffix (ronaldo, ronaldo-2, ronaldo-3, …) if another model already claimed it.
 */
export async function createModel(params: { name: string; photoKey: string; createdByUserId: string }): Promise<ModelSummary> {
  const db = getDb();
  const name = params.name.trim().slice(0, MODEL_NAME_MAX_LENGTH);
  const base = slugify(name);

  let slug = base;
  for (let i = 2; i < 1000; i++) {
    const [existing] = await db.select({ id: models.id }).from(models).where(eq(models.slug, slug)).limit(1);
    if (!existing) break;
    slug = `${base}-${i}`;
  }

  const id = nanoid();
  await db.insert(models).values({
    id,
    name,
    slug,
    photoKey: params.photoKey,
    createdByUserId: params.createdByUserId,
    createdAt: new Date(),
  });

  return { id, name, slug, photoUrl: mediaUrl(params.photoKey) };
}
