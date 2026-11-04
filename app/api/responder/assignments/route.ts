
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createClient as createSupabaseAdmin,
} from "@supabase/supabase-js";

const allowedTransitions: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "EN_ROUTE",
  EN_ROUTE: "ARRIVED",
  ARRIVED: "COMPLETED",
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createSupabaseAdmin(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getAuthenticatedResponder() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  // Verify the role using the authenticated user's session.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "RESPONDER") {
    return {
      error: NextResponse.json(
        { success: false, message: "Responder access required." },
        { status: 403 }
      ),
    };
  }

  const admin = getAdminClient();

  // assignments.responder_id references responders.id,
  // not profiles.id.
  const { data: responder, error: responderError } = await admin
    .from("responders")
    .select("id, profile_id, is_available")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (responderError) {
    console.error("Responder lookup failed:", responderError);
    return {
      error: NextResponse.json(
        { success: false, message: "Could not verify responder profile." },
        { status: 500 }
      ),
    };
  }

  if (!responder) {
    return {
      error: NextResponse.json(
        { success: false, message: "Responder profile not found." },
        { status: 404 }
      ),
    };
  }

  return { admin, responder };
}

// GET /api/responder/assignments
export async function GET() {
  try {
    const auth = await getAuthenticatedResponder();

    if (auth.error) return auth.error;

    const { admin, responder } = auth;

    const { data: assignments, error } = await admin
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
        completed_at
      `)
      .eq("responder_id", responder.id)
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Assignment fetch failed:", error);
      return NextResponse.json(
        { success: false, message: "Could not load assignments." },
        { status: 500 }
      );
    }

    const incidentIds = [
      ...new Set((assignments ?? []).map((item) => item.incident_id)),
    ];

    const resourceIds = [
      ...new Set((assignments ?? []).map((item) => item.resource_id)),
    ];

    const [incidentResult, resourceResult] = await Promise.all([
      incidentIds.length
        ? admin
            .from("incidents")
            .select(`
              id,
              title,
              description,
              incident_type,
              severity,
              status,
              affected_people,
              medical_required,
              evacuation_required,
              address,
              created_at
            `)
            .in("id", incidentIds)
        : Promise.resolve({ data: [], error: null }),

      resourceIds.length
        ? admin
            .from("resources")
            .select(`
              id,
              name,
              resource_type,
              status,
              capacity,
              skills,
              organization,
              contact_phone
            `)
            .in("id", resourceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (incidentResult.error || resourceResult.error) {
      console.error(
        "Assignment detail fetch failed:",
        incidentResult.error || resourceResult.error
      );

      return NextResponse.json(
        { success: false, message: "Could not load assignment details." },
        { status: 500 }
      );
    }

    const incidentsById = new Map(
      (incidentResult.data ?? []).map((item) => [item.id, item])
    );

    const resourcesById = new Map(
      (resourceResult.data ?? []).map((item) => [item.id, item])
    );

    const result = (assignments ?? []).map((assignment) => ({
      ...assignment,
      incident: incidentsById.get(assignment.incident_id) ?? null,
      resource: resourcesById.get(assignment.resource_id) ?? null,
    }));

    return NextResponse.json(
      {
        success: true,
        assignments: result,
        responder: {
          id: responder.id,
          isAvailable: responder.is_available,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Responder assignments GET error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

// PATCH /api/responder/assignments
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedResponder();

    if (auth.error) return auth.error;

    const { admin, responder } = auth;

    let body: { assignmentId?: string; status?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { assignmentId, status: nextStatus } = body;

    if (!assignmentId || !nextStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "assignmentId and status are required.",
        },
        { status: 400 }
      );
    }

    // Read the assignment using its owner responder ID.
    const { data: current, error: currentError } = await admin
      .from("assignments")
      .select("id, status")
      .eq("id", assignmentId)
      .eq("responder_id", responder.id)
      .maybeSingle();

    if (currentError) {
      console.error("Assignment lookup failed:", currentError);
      return NextResponse.json(
        { success: false, message: "Could not verify assignment." },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Assignment not found." },
        { status: 404 }
      );
    }

    const expectedNext = allowedTransitions[current.status];

    if (!expectedNext || nextStatus !== expectedNext) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition from ${current.status}.`,
        },
        { status: 409 }
      );
    }

    const updateValues: Record<string, string> = {
      status: nextStatus,
    };

    if (nextStatus === "ACCEPTED") {
      updateValues.accepted_at = new Date().toISOString();
    }

    if (nextStatus === "COMPLETED") {
      updateValues.completed_at = new Date().toISOString();
    }

    // Conditional update prevents two simultaneous requests from
    // advancing the same assignment from the same previous status.
    const { data: updated, error: updateError } = await admin
      .from("assignments")
      .update(updateValues)
      .eq("id", assignmentId)
      .eq("responder_id", responder.id)
      .eq("status", current.status)
      .select(`
        id,
        status,
        accepted_at,
        completed_at
      `)
      .maybeSingle();

    if (updateError) {
      console.error("Assignment update failed:", updateError);
      return NextResponse.json(
        { success: false, message: "Could not update assignment." },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Assignment updated to ${nextStatus}.`,
      assignment: updated,
    });
  } catch (error) {
    console.error("Responder assignments PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
