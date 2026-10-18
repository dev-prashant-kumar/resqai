"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateIncidentStatus(incidentId: string, newStatus: string) {
  const supabase = await createClient();

  // Verify authentication & responder/admin role
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
    return { success: false, error: "Permission denied. Restricted to responders and admins." };
  }

  // Update incident status in Supabase (RLS policy will validate permissions)
  const { error } = await supabase
    .from("incidents")
    .update({ status: newStatus.toUpperCase() })
    .eq("id", incidentId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Revalidate paths so the UI reflects the change immediately
  revalidatePath(`/dashboard/incidents/${incidentId}`);
  revalidatePath("/responder");
  revalidatePath("/incidents");

  return { success: true };
}