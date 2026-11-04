
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/supabase/admin-authorization";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


export async function GET(request: NextRequest) {
  const { staff, response } = await authorizeAdminRequest();

  if (response) return response;

  try {
    const incidentId = request.nextUrl.searchParams.get("incidentId");

    if (!incidentId || !uuidRegex.test(incidentId)) {
      return NextResponse.json(
        { success: false, message: "A valid incident ID is required." },
        { status: 400 },
      );
    }

    // 1. Load incident.
    const { data: incident, error: incidentError } = await staff.admin
      .from("incidents")
      .select("id, ai_analysis")
      .eq("id", incidentId)
      .maybeSingle();

    if (incidentError) {
      console.error("Incident lookup failed:", incidentError.message);

      return NextResponse.json(
        { success: false, message: "Unable to load incident." },
        { status: 500 },
      );
    }

    if (!incident) {
      return NextResponse.json(
        { success: false, message: "Incident not found." },
        { status: 404 },
      );
    }

    // 2. Load existing assignments.
    const { data: assignments, error: assignmentError } =
      await staff.admin
        .from("assignments")
        .select(`
          id,
          incident_id,
          resource_id,
          responder_id,
          status,
          distance_km,
          estimated_response_minutes,
          allocation_score,
          assigned_at,
          accepted_at,
          completed_at,
          resources (
            id,
            name,
            resource_type,
            capacity,
            skills,
            contact_phone,
            organization,
            organization_id
          )
        `)
        .eq("incident_id", incidentId)
        .order("assigned_at", { ascending: false });

    if (assignmentError) {
      console.error(
        "Assigned resources lookup failed:",
        assignmentError.message,
      );

      return NextResponse.json(
        { success: false, message: "Unable to load assigned resources." },
        { status: 500 },
      );
    }

    // 3. Read AI recommendations. Use an empty array if unavailable.
    const recommendedTypes =
      incident.ai_analysis?.analysis?.recommended_resource_types ?? [];

    // 4. Load available resources.
    // The RPC should return all available resources when recommended_types is [].
    const { data: resources, error: resourceError } =
      await staff.admin.rpc("match_available_resources", {
        incident_id: incidentId,
        recommended_types: recommendedTypes,
      });

    if (resourceError) {
      console.error(
        "Available resource lookup failed:",
        resourceError.message,
      );

      return NextResponse.json(
        { success: false, message: "Unable to load available resources." },
        { status: 500 },
      );
    }

    const availableResources = resources ?? [];

    // 5. Load organization IDs for the returned resources.
    const resourceIds = availableResources
      .map((resource: { id: string }) => resource.id)
      .filter(Boolean);

    if (!resourceIds.length) {
      return NextResponse.json({
        success: true,
        resources: [],
        assignments: assignments ?? [],
        responders: [],
      });
    }

    const { data: resourceOrganizations, error: organizationLinkError } =
      await staff.admin
        .from("resources")
        .select("id, organization_id")
        .in("id", resourceIds);

    if (organizationLinkError) {
      console.error(
        "Resource organization lookup failed:",
        organizationLinkError.message,
      );

      return NextResponse.json(
        { success: false, message: "Unable to load resource organizations." },
        { status: 500 },
      );
    }

    const resourceOrganizationMap = new Map(
      (resourceOrganizations ?? []).map((resource) => [
        resource.id,
        resource.organization_id,
      ]),
    );

    const resourcesWithOrganization = availableResources.map(
      (resource: { id: string }) => ({
        ...resource,
        organization_id: resourceOrganizationMap.get(resource.id) ?? null,
      }),
    );

    const organizationIds = [
      ...new Set(
        (resourceOrganizations ?? [])
          .map((resource) => resource.organization_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (!organizationIds.length) {
      return NextResponse.json({
        success: true,
        resources: resourcesWithOrganization,
        assignments: assignments ?? [],
        responders: [],
      });
    }

    // 6. Only approved organizations are eligible.
    const { data: approvedOrganizations, error: approvedOrgError } =
      await staff.admin
        .from("responder_organizations")
        .select("id, organization_name")
        .in("id", organizationIds)
        .eq("verification_status", "APPROVED");

    if (approvedOrgError) {
      console.error(
        "Approved organization lookup failed:",
        approvedOrgError.message,
      );

      return NextResponse.json(
        { success: false, message: "Unable to verify organizations." },
        { status: 500 },
      );
    }

    const approvedOrganizationIds = (approvedOrganizations ?? []).map(
      (organization) => organization.id,
    );

    if (!approvedOrganizationIds.length) {
      return NextResponse.json({
        success: true,
        resources: resourcesWithOrganization,
        assignments: assignments ?? [],
        responders: [],
      });
    }

    // 7. Find approved organization memberships.
    const { data: memberships, error: membershipError } =
      await staff.admin
        .from("responder_organization_members")
        .select(`
          organization_id,
          user_id,
          designation,
          employee_id,
          membership_role
        `)
        .in("organization_id", approvedOrganizationIds)
        .eq("membership_status", "APPROVED");

    if (membershipError) {
      console.error(
        "Responder membership lookup failed:",
        membershipError.message,
      );

      return NextResponse.json(
        { success: false, message: "Unable to load responder memberships." },
        { status: 500 },
      );
    }

    const responderIds = [
      ...new Set((memberships ?? []).map((member) => member.user_id)),
    ];

    if (!responderIds.length) {
      return NextResponse.json({
        success: true,
        resources: resourcesWithOrganization,
        assignments: assignments ?? [],
        responders: [],
      });
    }

    // 8. Confirm responder roles from profiles.
    const { data: profiles, error: profileError } = await staff.admin
      .from("profiles")
      .select("id, full_name, phone, role")
      .in("id", responderIds)
      .eq("role", "RESPONDER");

    if (profileError) {
      console.error("Responder profile lookup failed:", profileError.message);

      return NextResponse.json(
        { success: false, message: "Unable to load responder profiles." },
        { status: 500 },
      );
    }

    // 9. Combine responder and organization details.
    const organizationNameMap = new Map(
      (approvedOrganizations ?? []).map((organization) => [
        organization.id,
        organization.organization_name,
      ]),
    );

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile]),
    );

    const responders = (memberships ?? [])
      .map((membership) => {
        const profile = profileMap.get(membership.user_id);

        if (!profile) return null;

        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          organization_id: membership.organization_id,
          organization_name:
            organizationNameMap.get(membership.organization_id) ?? null,
          designation: membership.designation,
          employee_id: membership.employee_id,
          membership_role: membership.membership_role,
        };
      })
      .filter(
        (responder): responder is NonNullable<typeof responder> =>
          responder !== null,
      );

    return NextResponse.json({
      success: true,
      resources: resourcesWithOrganization,
      assignments: assignments ?? [],
      responders,
    });
  } catch (error) {
    console.error("Available resources API error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}


export async function POST(request: NextRequest) {
  const { staff, response } = await authorizeAdminRequest();

  if (response) return response;

  try {
    const body = await request.json();

    const { incidentId, resourceId, responderId } = body;

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

    // Individual assignment: validate and assign a specific responder.
    if (responderId !== undefined && responderId !== null) {
      if (
        typeof responderId !== "string" ||
        !uuidRegex.test(responderId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "A valid responder ID is required.",
          },
          { status: 400 },
        );
      }

      const { data: assignmentId, error } = await staff.admin.rpc(
        "admin_assign_resource_to_responder",
        {
          p_incident_id: incidentId,
          p_resource_id: resourceId,
          p_responder_id: responderId,
        },
      );

      if (error) {
        console.error("Individual responder assignment failed:", error.message);

        const errors: Record<
          string,
          { message: string; status: number }
        > = {
          INCIDENT_NOT_FOUND: {
            message: "Incident not found.",
            status: 404,
          },
          RESOURCE_NOT_FOUND: {
            message: "Resource not found.",
            status: 404,
          },
          RESOURCE_NOT_AVAILABLE: {
            message: "This resource is no longer available.",
            status: 409,
          },
          INVALID_RESPONDER: {
            message: "The selected account is not an eligible responder.",
            status: 403,
          },
          RESPONDER_MEMBERSHIP_NOT_APPROVED: {
            message: "The responder's organization membership is not approved.",
            status: 403,
          },
          ORGANIZATION_NOT_APPROVED: {
            message: "The responder's organization is not approved.",
            status: 403,
          },
          RESOURCE_ORGANIZATION_NOT_FOUND: {
            message: "This resource is not linked to an organization.",
            status: 409,
          },
        };

        const matchedError = Object.entries(errors).find(([key]) =>
          error.message.includes(key),
        );

        if (matchedError) {
          const [, details] = matchedError;

          return NextResponse.json(
            { success: false, message: details.message },
            { status: details.status },
          );
        }

        return NextResponse.json(
          {
            success: false,
            message: "Unable to assign this responder.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Resource assigned to responder successfully.",
        assignmentId,
        responderId,
      });
    }

    // Legacy manual assignment: preserve existing behavior.
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
  } catch (error: unknown) {
  const dbError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  console.error("RESPONDER ASSIGNMENT ERROR:", {
    message: dbError.message,
    code: dbError.code,
    details: dbError.details,
    hint: dbError.hint,
    error,
  });

  return NextResponse.json(
    {
      success: false,
      message: "Unable to assign this responder.",
    },
    { status: 500 }
  );
}
}