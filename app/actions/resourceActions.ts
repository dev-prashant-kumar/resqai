"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignResourceToIncident(incidentId: string, resourceId: string) {
  const supabase = await createClient();

  // Verify authentication & permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized user." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role ?? "").toUpperCase();
  if (role !== "RESPONDER" && role !== "ADMIN" && role !== "OPERATOR") {
    return { success: false, error: "Permission denied." };
  }

  // 1. Update the incident status to ASSIGNED or IN_PROGRESS and link the resource if your table supports it,
  // Or update the resource's status to 'DISPATCHED'
  const { error: resourceError } = await supabase
    .from("resources")
    .update({ status: "DISPATCHED" })
    .eq("id", resourceId);

  if (resourceError) {
    return { success: false, error: resourceError.message };
  }

  // Also update incident status to IN_PROGRESS if it was reported
  await supabase
    .from("incidents")
    .update({ status: "IN_PROGRESS" })
    .eq("id", incidentId);

  revalidatePath(`/dashboard/incidents/${incidentId}`);
  revalidatePath("/responder");

  return { success: true };
}