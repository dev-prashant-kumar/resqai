import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  REPORTED: ["ANALYZING", "VERIFIED", "CANCELLED"],
  ANALYZING: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !["ADMIN", "OPERATOR"].includes(profile?.role?.toUpperCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus = body.status;

  if (!nextStatus || !Object.values(allowedTransitions).some((statuses) =>
    statuses.includes(nextStatus)
  )) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("id,status")
    .eq("id", id)
    .single();

  if (fetchError || !incident) {
    return NextResponse.json({ error: "Incident not found or inaccessible" }, { status: 404 });
  }

  if (!allowedTransitions[incident.status]?.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot change status from ${incident.status} to ${nextStatus}` },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("incidents")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("status", incident.status)
    .select("id,status")
    .maybeSingle();

  if (updateError) {
    console.error("Incident status update failed:", updateError);
    return NextResponse.json(
      { error: "Update denied. Check incident update policies." },
      { status: 403 }
    );
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Incident changed concurrently or is inaccessible. Refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ incident: updated });
}