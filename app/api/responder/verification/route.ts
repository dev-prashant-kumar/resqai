import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "responder-verification-documents";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type VerificationPayload = {
  organizationName: string;
  registrationNumber: string;
  organizationType: string;
  officialEmail: string;
  officialPhone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  representativeName: string;
  representativeDesignation: string;
  representativeEmail: string;
  representativePhone: string;
};

type OrganizationRecord = {
  id: string;
  owner_user_id: string;
  verification_status: string;
};

type ExistingApplication = {
  id: string;
  application_status: string;
  authorization_document_path: string | null;
  representative_identity_document_path: string | null;
};

function getText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getFileExtension(file: File): string | null {
  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

function validateFile(
  value: FormDataEntryValue | null,
): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0 &&
    value.size <= MAX_FILE_SIZE &&
    ALLOWED_MIME_TYPES.has(value.type)
  );
}

function validatePayload(
  payload: VerificationPayload,
): string | null {
  const requiredFields: Array<keyof VerificationPayload> = [
    "organizationName",
    "registrationNumber",
    "organizationType",
    "officialEmail",
    "officialPhone",
    "address",
    "city",
    "state",
    "postalCode",
    "representativeName",
    "representativeDesignation",
    "representativeEmail",
    "representativePhone",
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      return "Please complete all required verification fields.";
    }
  }

  if (
    !isValidEmail(payload.officialEmail) ||
    !isValidEmail(payload.representativeEmail)
  ) {
    return "Please enter valid email addresses.";
  }

  if (payload.website) {
    try {
      const website = new URL(payload.website);

      if (!["http:", "https:"].includes(website.protocol)) {
        return "Please enter a valid organization website.";
      }
    } catch {
      return "Please enter a valid organization website.";
    }
  }

  if (payload.organizationName.length > 200) {
    return "The organization name is too long.";
  }

  if (payload.registrationNumber.length > 150) {
    return "The registration number is too long.";
  }

  return null;
}

export async function POST(request: Request) {
  let uploadedPaths: string[] = [];

  try {
    // 1. Authenticate the user through the existing server client.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    // 2. Read server-only Supabase credentials.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing server-side Supabase environment variables.",
      );

      return NextResponse.json(
        {
          success: false,
          message: "The verification service is not configured correctly.",
        },
        { status: 500 },
      );
    }

    // 3. Create a privileged client for server-side operations only.
    const admin = createSupabaseAdmin(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 4. Parse and validate submitted form data.
    const formData = await request.formData();

    if (getText(formData, "declaration") !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "Please confirm the verification declaration.",
        },
        { status: 400 },
      );
    }

    const payload: VerificationPayload = {
      organizationName: getText(formData, "organizationName"),
      registrationNumber: getText(formData, "registrationNumber"),
      organizationType: getText(formData, "organizationType"),
      officialEmail: getText(formData, "officialEmail"),
      officialPhone: getText(formData, "officialPhone"),
      website: getText(formData, "website"),
      address: getText(formData, "address"),
      city: getText(formData, "city"),
      state: getText(formData, "state"),
      postalCode: getText(formData, "postalCode"),
      representativeName: getText(formData, "representativeName"),
      representativeDesignation: getText(
        formData,
        "representativeDesignation",
      ),
      representativeEmail: getText(formData, "representativeEmail"),
      representativePhone: getText(formData, "representativePhone"),
    };

    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 },
      );
    }

    const registrationFile = formData.get("registrationDocument");
    const identityFile = formData.get("representativeDocument");

    if (!validateFile(registrationFile)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Upload a valid registration document in PDF, JPG, PNG, or WEBP format. Maximum size: 5 MB.",
        },
        { status: 400 },
      );
    }

    if (!validateFile(identityFile)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Upload a valid representative identity document in PDF, JPG, PNG, or WEBP format. Maximum size: 5 MB.",
        },
        { status: 400 },
      );
    }

    // 5. Look up the organization owned by the authenticated user.
    const {
      data: organizationData,
      error: organizationError,
    } = await admin
      .from("responder_organizations")
      .select("id, owner_user_id, verification_status")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (organizationError) {
      console.error(
        "Organization lookup failed:",
        organizationError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify your organization.",
        },
        { status: 500 },
      );
    }

    if (!organizationData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No organization is linked to your account. Complete responder registration first.",
        },
        { status: 404 },
      );
    }

    /*
     * Explicit type annotation resolves property access errors caused
     * by an incorrectly inferred Supabase query result.
     */
    const organization =
      organizationData as unknown as OrganizationRecord;

    if (organization.owner_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to submit for this organization.",
        },
        { status: 403 },
      );
    }

    if (organization.verification_status === "VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your organization is already verified.",
        },
        { status: 409 },
      );
    }

    // 6. Find the user's existing verification application.
    const {
      data: existingApplicationData,
      error: applicationLookupError,
    } = await admin
      .from("responder_organization_applications")
      .select(
        [
          "id",
          "application_status",
          "authorization_document_path",
          "representative_identity_document_path",
        ].join(", "),
      )
      .eq("organization_id", organization.id)
      .eq("submitted_by", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationLookupError) {
      console.error(
        "Application lookup failed:",
        applicationLookupError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load your verification application.",
        },
        { status: 500 },
      );
    }

    /*
     * This cast fixes the GenericStringError property errors.
     * The database schema should still be kept in sync with these fields.
     */
    const existingApplication =
      existingApplicationData as unknown as ExistingApplication | null;

    if (
      existingApplication &&
      existingApplication.application_status !== "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your application is no longer pending. Please contact an administrator if you need assistance.",
        },
        { status: 409 },
      );
    }

    if (
      existingApplication?.authorization_document_path ||
      existingApplication?.representative_identity_document_path
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A verification submission already contains documents. Please contact an administrator before resubmitting.",
        },
        { status: 409 },
      );
    }

    // 7. Validate file extensions.
    const registrationExtension = getFileExtension(registrationFile);
    const identityExtension = getFileExtension(identityFile);

    if (!registrationExtension || !identityExtension) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more document formats are unsupported.",
        },
        { status: 400 },
      );
    }

    // 8. Generate private, unpredictable document paths.
    const registrationPath =
      `${organization.id}/${user.id}/${crypto.randomUUID()}.${registrationExtension}`;

    const identityPath =
      `${organization.id}/${user.id}/${crypto.randomUUID()}.${identityExtension}`;

    // 9. Upload the registration document.
    const { error: registrationUploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(registrationPath, registrationFile, {
        contentType: registrationFile.type,
        upsert: false,
      });

    if (registrationUploadError) {
      console.error(
        "Registration document upload failed:",
        registrationUploadError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to upload the registration document.",
        },
        { status: 500 },
      );
    }

    uploadedPaths.push(registrationPath);

    // 10. Upload the representative identity document.
    const { error: identityUploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(identityPath, identityFile, {
        contentType: identityFile.type,
        upsert: false,
      });

    if (identityUploadError) {
      console.error(
        "Identity document upload failed:",
        identityUploadError.message,
      );

      await admin.storage
        .from(BUCKET_NAME)
        .remove(uploadedPaths);

      uploadedPaths = [];

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to upload the representative identity document.",
        },
        { status: 500 },
      );
    }

    uploadedPaths.push(identityPath);

    // 11. Prepare the database record.
    const applicationData = {
      organization_id: organization.id,
      submitted_by: user.id,
      application_status: "PENDING",
      authorization_document_path: registrationPath,
      representative_identity_document_path: identityPath,
      organization_registration_number: payload.registrationNumber,
      organization_type: payload.organizationType,
      organization_name: payload.organizationName,
      organization_email: payload.officialEmail,
      organization_phone: payload.officialPhone,
      organization_website: payload.website || null,
      organization_address: payload.address,
      organization_city: payload.city,
      organization_state: payload.state,
      organization_postal_code: payload.postalCode,
      verification_contact_name: payload.representativeName,
      verification_contact_email: payload.representativeEmail,
      verification_contact_phone: payload.representativePhone,
      verification_contact_designation:
        payload.representativeDesignation,
      official_directory_url: payload.website || null,
      applicant_declaration: true,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 12. Update an existing pending application or create a new one.
    let saveError: { message: string } | null = null;

    if (existingApplication) {
      const { error } = await admin
        .from("responder_organization_applications")
        .update(applicationData)
        .eq("id", existingApplication.id)
        .eq("organization_id", organization.id)
        .eq("submitted_by", user.id)
        .eq("application_status", "PENDING");

      saveError = error;
    } else {
      const { error } = await admin
        .from("responder_organization_applications")
        .insert(applicationData);

      saveError = error;
    }

    if (saveError) {
      console.error(
        "Application save failed:",
        saveError.message,
      );

      await admin.storage
        .from(BUCKET_NAME)
        .remove(uploadedPaths);

      uploadedPaths = [];

      return NextResponse.json(
        {
          success: false,
          message:
            "We could not save your application. Please try again or contact an administrator.",
        },
        { status: 500 },
      );
    }

    // 13. Return a successful submission response.
    return NextResponse.json(
      {
        success: true,
        message:
          "Your verification application has been submitted successfully and is awaiting review.",
        status: "PENDING",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verification submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "An unexpected error occurred while submitting your application. Please try again.",
      },
      { status: 500 },
    );
  }
}