
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Authenticate the current user.
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Please sign in again." },
        { status: 401 },
      );
    }

    // Check the user's role.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Responder role lookup failed:", profileError.message);
      return NextResponse.json(
        { success: false, message: "Unable to verify your account." },
        { status: 500 },
      );
    }

    if (profile?.role !== "RESPONDER") {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    // Create the server-only privileged client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

console.log("Environment variable check:", {
  supabaseUrlExists: Boolean(supabaseUrl),
  serviceRoleKeyExists: Boolean(serviceRoleKey),
  supabaseUrlValid: Boolean(
    supabaseUrl && supabaseUrl.startsWith("https://")
  ),
});

if (!supabaseUrl || !serviceRoleKey) {
  return NextResponse.json(
    {
      success: false,
      message: "Server configuration is incomplete.",
      missing: {
        NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey,
      },
    },
    { status: 500 },
  );
}

    const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find the organization owned by this authenticated responder.
    const { data: organization, error: organizationError } = await admin
      .from("responder_organizations")
      .select("id, owner_user_id, verification_status")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (organizationError) {
      console.error("Organization lookup failed:", organizationError.message);
      return NextResponse.json(
        { success: false, message: "Unable to load your organization." },
        { status: 500 },
      );
    }

    if (!organization || organization.owner_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "No organization is linked to your responder account.",
          incidents: [],
        },
        { status: 200 },
      );
    }

    if (
  organization.verification_status !== "APPROVED" &&
  organization.verification_status !== "VERIFIED"
)  {
      return NextResponse.json(
        {
          success: true,
          message: "Your organization must be verified to view assignments.",
          organization: null,
          incidents: [],
        },
        { status: 200 },
      );
    }

    // Get the latest application and its official organization name.
    const { data: application, error: applicationError } = await admin
      .from("responder_organization_applications")
      .select("organization_name, application_status")
      .eq("organization_id", organization.id)
      .eq("submitted_by", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      console.error("Application lookup failed:", applicationError.message);
      return NextResponse.json(
        { success: false, message: "Unable to load organization details." },
        { status: 500 },
      );
    }

    const organizationName = application?.organization_name?.trim();

    if (!organizationName) {
      return NextResponse.json(
        {
          success: true,
          message: "Your organization name is not available.",
          organization: null,
          incidents: [],
        },
        { status: 200 },
      );
    }

    // Find assigned resources belonging to this organization.
    const { data: resources, error: resourcesError } = await admin
      .from("resources")
      .select(
        "id, name, resource_type, status, organization, assigned_incident_id",
      )
      .eq("organization", organizationName)
      .not("assigned_incident_id", "is", null);

    if (resourcesError) {
      console.error("Assigned resource lookup failed:", resourcesError.message);
      return NextResponse.json(
        { success: false, message: "Unable to load assigned resources." },
        { status: 500 },
      );
    }

    const assignedResources = resources ?? [];
    const incidentIds = [
      ...new Set(
        assignedResources
          .map((resource) => resource.assigned_incident_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (incidentIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          organization: { id: organization.id, name: organizationName },
          incidents: [],
          total: 0,
        },
        {
          status: 200,
          headers: { "Cache-Control": "private, no-store, max-age=0" },
        },
      );
    }

    // Fetch only incidents linked to this organization's resources.
    const { data: incidents, error: incidentsError } = await admin
      .from("incidents")
      .select(
        "id, title, description, incident_type, severity, status, affected_people, address, created_at, updated_at",
      )
      .in("id", incidentIds)
      .order("created_at", { ascending: false });

    if (incidentsError) {
      console.error("Incident lookup failed:", incidentsError.message);
      return NextResponse.json(
        { success: false, message: "Unable to load assigned incidents." },
        { status: 500 },
      );
    }

    // Attach the organization's resources to each incident.
    const result = (incidents ?? []).map((incident) => ({
      ...incident,
      resources: assignedResources
        .filter((resource) => resource.assigned_incident_id === incident.id)
        .map((resource) => ({
          id: resource.id,
          name: resource.name,
          resource_type: resource.resource_type,
          status: resource.status,
        })),
    }));

    return NextResponse.json(
      {
        success: true,
        organization: { id: organization.id, name: organizationName },
        incidents: result,
        total: result.length,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Responder incidents API error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
