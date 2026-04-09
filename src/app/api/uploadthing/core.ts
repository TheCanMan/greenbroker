import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createClient } from "@/lib/supabase/server";

const f = createUploadthing();

/**
 * GreenBroker file upload routes.
 * Uploadthing handles the actual file storage (CDN-backed).
 * We store the returned URLs in Supabase.
 *
 * Security: each route verifies auth before allowing upload.
 */
export const ourFileRouter = {
  /**
   * Utility bill uploads — for homeowner intake.
   * Max 5 files, 10MB each, PDF or image.
   */
  utilityBillUploader: f({
    pdf: { maxFileSize: "10MB", maxFileCount: 5 },
    image: { maxFileSize: "10MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Allow anonymous uploads (guest intake flow)
      return { userId: user?.id ?? "anonymous" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the file URL back to the client
      return { url: file.url, name: file.name, size: file.size };
    }),

  /**
   * Property photos — for homeowner intake.
   * Max 10 images, 10MB each.
   */
  propertyPhotoUploader: f({
    image: { maxFileSize: "10MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return { userId: user?.id ?? "anonymous" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name, size: file.size };
    }),

  /**
   * Contractor logo — for contractor profiles.
   * 1 image, 2MB max. Requires authentication.
   */
  contractorLogoUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Verify contractor account
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!contractor) throw new Error("No contractor account found");

      return { userId: user.id, contractorId: contractor.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update contractor logo URL in Supabase
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminClient = createAdminClient();
      await adminClient
        .from("contractors")
        .update({ logo_url: file.url })
        .eq("id", metadata.contractorId);

      return { url: file.url };
    }),

  /**
   * Rebate application documents.
   * Authenticated homeowners only.
   */
  rebateDocumentUploader: f({
    pdf: { maxFileSize: "10MB", maxFileCount: 10 },
    image: { maxFileSize: "10MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
