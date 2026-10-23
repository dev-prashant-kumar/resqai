"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignResourceToIncident(incidentId: string, resourceId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .update({ 
      assigned_incident_id: incidentId,
      status: "ASSIGNED" // Matches your database resource_status enum
    })
    .eq("id", resourceId);

  if (error) {
    console.error("Assignment Error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/incidents/${incidentId}`);
  return { success: true };
}

export async function releaseResource(resourceId: string, incidentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Return resource status back to AVAILABLE
  const { error } = await supabase
    .from("resources")
    .update({ 
      status: "AVAILABLE",
      assigned_incident_id: null 
    })
    .eq("id", resourceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/incidents/${incidentId}`);
  revalidatePath("/responder");

  return { success: true };
}