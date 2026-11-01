
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function authorizeResourceManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      error: "You must be logged in.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      supabase,
      error: "Unable to verify your account permissions.",
    };
  }

  const role = String(profile.role).toUpperCase();

  if (!["ADMIN", "RESPONDER"].includes(role)) {
    return {
      supabase,
      error: "You are not authorized to manage resources.",
    };
  }

  return { supabase, error: null };
}

function refreshIncidentPaths(incidentId: string) {
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath(`/dashboard/incidents/${incidentId}`);
  revalidatePath("/incidents");
}

// Assign a resource only if it is still available.
export async function assignResourceToIncident(
  incidentId: string,
  resourceId: string
) {
  const { supabase, error: authError } =
    await authorizeResourceManager();

  if (authError) {
    return { success: false, error: authError };
  }

  if (!incidentId || !resourceId) {
    return {
      success: false,
      error: "Incident ID and resource ID are required.",
    };
  }

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", incidentId)
    .maybeSingle();

  if (incidentError || !incident) {
    return {
      success: false,
      error: "Incident not found or inaccessible.",
    };
  }

  const { data: updatedResource, error } = await supabase
    .from("resources")
    .update({
      assigned_incident_id: incidentId,
      status: "ASSIGNED",
    })
    .eq("id", resourceId)
    .eq("status", "AVAILABLE")
    .is("assigned_incident_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Resource assignment failed:", error);

    return {
      success: false,
      error: "Resource assignment failed. Check your database permissions.",
    };
  }

  if (!updatedResource) {
    return {
      success: false,
      error: "This resource is no longer available. Refresh and try again.",
    };
  }

  refreshIncidentPaths(incidentId);

  return {
    success: true,
    message: "Resource assigned successfully.",
  };
}

// Release only a resource assigned to this incident.
export async function releaseResource(
  resourceId: string,
  incidentId: string
) {
  const { supabase, error: authError } =
    await authorizeResourceManager();

  if (authError) {
    return { success: false, error: authError };
  }

  if (!incidentId || !resourceId) {
    return {
      success: false,
      error: "Incident ID and resource ID are required.",
    };
  }

  const { data: updatedResource, error } = await supabase
    .from("resources")
    .update({
      assigned_incident_id: null,
      status: "AVAILABLE",
    })
    .eq("id", resourceId)
    .eq("assigned_incident_id", incidentId)
    .eq("status", "ASSIGNED")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Resource release failed:", error);

    return {
      success: false,
      error: "Unable to release this resource.",
    };
  }

  if (!updatedResource) {
    return {
      success: false,
      error: "This resource is not assigned to this incident.",
    };
  }

  refreshIncidentPaths(incidentId);

  return {
    success: true,
    message: "Resource released successfully.",
  };
}
