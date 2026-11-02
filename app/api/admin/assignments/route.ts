
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/supabase/admin-authorization";

export async function POST(request: NextRequest) {
  const { staff, response } = await authorizeAdminRequest();

  if (response) return response;

  try {
    const body = await request.json();

    const incidentId = body.incidentId;
    const resourceId = body.resourceId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof incidentId !== "string" ||
      typeof resourceId !== "string" ||
      !uuidRegex.test(incidentId) ||
      !uuidRegex.test(resourceId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid incident and resource IDs are required.",
        },
        { status: 400 },
      );
    }

    const { data: assignmentId, error } = await staff.admin.rpc(
      "admin_assign_resource",
      {
        p_incident_id: incidentId,
        p_resource_id: resourceId,
      },
    );

    if (error) {
      console.error("Resource assignment failed:", error.message);

      if (error.message.includes("INCIDENT_NOT_FOUND")) {
        return NextResponse.json(
          { success: false, message: "Incident not found." },
          { status: 404 },
        );
      }

      if (error.message.includes("RESOURCE_NOT_FOUND")) {
        return NextResponse.json(
          { success: false, message: "Resource not found." },
          { status: 404 },
        );
      }

      if (error.message.includes("RESOURCE_NOT_AVAILABLE")) {
        return NextResponse.json(
          {
            success: false,
            message: "This resource is no longer available.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Unable to assign this resource.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resource assigned successfully.",
      assignmentId,
    });
  } catch (error) {
    console.error("Admin assignment API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred.",
      },
      { status: 500 },
    );
  }
}
