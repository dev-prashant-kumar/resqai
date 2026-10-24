import { NextResponse } from "next/server";

import { authorizeAdminRequest } from "@/lib/supabase/admin-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Authenticate the requester and verify their ADMIN or OPERATOR role.
    const authorization = await authorizeAdminRequest();

    if (!authorization.staff) {
      return authorization.response;
    }

    const { admin, role } = authorization.staff;

    const { data: applications, error } = await admin
      .from("responder_organization_applications")
      .select(`
        id,
        organization_id,
        submitted_by,
        application_status,
        organization_registration_number,
        organization_type,
        organization_name,
        organization_email,
        organization_phone,
        organization_website,
        organization_address,
        organization_city,
        organization_state,
        organization_postal_code,
        verification_contact_name,
        verification_contact_email,
        verification_contact_phone,
        verification_contact_designation,
        government_id_reference,
        applicant_declaration,
        official_directory_url,
        review_notes,
        rejection_reason,
        reviewed_by,
        reviewed_at,
        submitted_at,
        updated_at,
        authorization_document_path,
        representative_identity_document_path
      `)
      .order("submitted_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error(
        "Failed to fetch responder applications:",
        error.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load responder verification applications.",
        },
        { status: 500 },
      );
    }

    // Never expose private document storage paths in the API response.
    const safeApplications = (applications ?? []).map((application) => {
      const {
        authorization_document_path,
        representative_identity_document_path,
        ...applicationDetails
      } = application;

      return {
        ...applicationDetails,
        has_authorization_document: Boolean(
          authorization_document_path,
        ),
        has_representative_identity_document: Boolean(
          representative_identity_document_path,
        ),
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Applications retrieved successfully.",
        reviewer_role: role,
        total: safeApplications.length,
        applications: safeApplications,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected admin applications API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while loading applications.",
      },
      { status: 500 },
    );
  }
}
