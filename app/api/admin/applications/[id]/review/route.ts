import { NextResponse } from "next/server";

import { authorizeAdminRequest } from "@/lib/supabase/admin-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_REVIEW_NOTES_LENGTH = 4000;
const MAX_REJECTION_REASON_LENGTH = 2000;

type ReviewDecision = "APPROVE" | "REJECT";

type ReviewRequestBody = {
  decision?: unknown;
  review_notes?: unknown;
  rejection_reason?: unknown;
};

function isOptionalText(
  value: unknown,
): value is string | null | undefined {
  return (
    value === undefined ||
    value === null ||
    typeof value === "string"
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate the user and verify their staff role.
    const authorization = await authorizeAdminRequest();

    if (!authorization.staff) {
      return authorization.response;
    }

    const { admin, userId, role } = authorization.staff;

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

    // 3. Parse and validate the request body.
    let body: ReviewRequestBody;

    try {
      body = (await request.json()) as ReviewRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The request body must contain valid JSON.",
        },
        { status: 400 },
      );
    }

    const decision = body.decision;

    if (decision !== "APPROVE" && decision !== "REJECT") {
      return NextResponse.json(
        {
          success: false,
          message: 'Decision must be "APPROVE" or "REJECT".',
        },
        { status: 400 },
      );
    }

    if (
      !isOptionalText(body.review_notes) ||
      !isOptionalText(body.rejection_reason)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Review notes and rejection reason must be text.",
        },
        { status: 400 },
      );
    }

    const reviewNotes = body.review_notes?.trim() || null;
    const rejectionReason =
      body.rejection_reason?.trim() || null;

    if (
      reviewNotes &&
      reviewNotes.length > MAX_REVIEW_NOTES_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Review notes cannot exceed ${MAX_REVIEW_NOTES_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    if (
      rejectionReason &&
      rejectionReason.length > MAX_REJECTION_REASON_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Rejection reason cannot exceed ${MAX_REJECTION_REASON_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    if (decision === "REJECT" && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          message: "A rejection reason is required.",
        },
        { status: 400 },
      );
    }

    // 4. Call the existing database function.
    // The reviewer ID comes from the authenticated session.
    const { data, error } = await admin.rpc(
      "review_responder_organization_application",
      {
        p_application_id: id,
        p_reviewer_id: userId,
        p_decision: decision,
        p_review_notes: reviewNotes,
        p_rejection_reason: rejectionReason,
      },
    );

    if (error) {
      // Log the actual database error to help diagnose HTTP 409.
      console.error(
        "Responder application review failed:",
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          reviewerRole: role,
          applicationId: id,
          decision,
        },
      );

      // Keep the current response status while diagnosing the issue.
      return NextResponse.json(
        {
          success: false,
          message:
            "The application could not be reviewed. Check the server logs for details.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          decision === "APPROVE"
            ? "Responder organization application approved successfully."
            : "Responder organization application rejected successfully.",
        decision,
        result: data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Unexpected application review API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "An unexpected error occurred while reviewing the application.",
      },
      { status: 500 },
    );
  }
}
