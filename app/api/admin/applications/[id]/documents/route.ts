
import { NextResponse } from "next/server";

import {
  ADMIN_BUCKET_NAME,
  authorizeAdminRequest,
} from "@/lib/supabase/admin-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_URL_EXPIRY_SECONDS = 5 * 60;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DocumentType = "authorization" | "identity";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Verify that the requester is authenticated staff.
    const authorization = await authorizeAdminRequest();

    if (!authorization.staff) {
      return authorization.response;
    }

    const { admin } = authorization.staff;

    // 2. Validate the application ID.
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID.",
        },
        { status: 400 },
      );
    }

    // 3. Accept only the two supported document types.
    const documentType = new URL(request.url).searchParams.get("type");

    if (
      documentType !== "authorization" &&
      documentType !== "identity"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid document type. Use "authorization" or "identity".',
        },
        { status: 400 },
      );
    }

    // 4. Retrieve the requested application's stored document path.
    const { data: application, error: applicationError } = await admin
      .from("responder_organization_applications")
      .select(
        "id, authorization_document_path, representative_identity_document_path",
      )
      .eq("id", id)
      .maybeSingle();

    if (applicationError) {
      console.error(
        "Admin document application lookup failed:",
        applicationError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to retrieve the application.",
        },
        { status: 500 },
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 },
      );
    }

    // 5. Select the requested path from the database record.
    const documentPath =
      documentType === "authorization"
        ? application.authorization_document_path
        : application.representative_identity_document_path;

    if (!documentPath) {
      return NextResponse.json(
        {
          success: false,
          message: "This application has no document of the requested type.",
        },
        { status: 404 },
      );
    }

    // 6. Generate a temporary URL from the private storage bucket.
    const { data: signedDocument, error: signingError } = await admin.storage
      .from(ADMIN_BUCKET_NAME)
      .createSignedUrl(documentPath, SIGNED_URL_EXPIRY_SECONDS);

    if (signingError || !signedDocument?.signedUrl) {
      console.error(
        "Admin document signing failed:",
        signingError?.message ?? "No signed URL returned.",
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to generate a secure document preview.",
        },
        { status: 500 },
      );
    }

    // 7. Return the temporary URL without exposing the stored file path.
    return NextResponse.json(
      {
        success: true,
        document_type: documentType,
        signed_url: signedDocument.signedUrl,
        expires_in_seconds: SIGNED_URL_EXPIRY_SECONDS,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected admin document API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while preparing the document.",
      },
      { status: 500 },
    );
  }
}
