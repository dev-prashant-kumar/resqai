
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runIncidentIntelligence } from "@/ai-service/src";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Get user's role from profiles table
    // Assumes profiles.id references auth.users.id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);

      return NextResponse.json(
        { success: false, message: "Could not verify user permissions." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 403 }
      );
    }

    const role = String(profile.role).toUpperCase();

    // Only operators and admins can generate analysis
    if (!["OPERATOR", "ADMIN"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Operator or admin access required.",
        },
        { status: 403 }
      );
    }

    // 3. Validate request body
    let body: { incidentId?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { incidentId } = body;

    if (
      !incidentId ||
      typeof incidentId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        incidentId
      )
    ) {
      return NextResponse.json(
        { success: false, message: "A valid incident UUID is required." },
        { status: 400 }
      );
    }

    // 4. Fetch incident using the authenticated Supabase client
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select(
        `
          id,
          title,
          description,
          incident_type,
          affected_people,
          medical_required,
          evacuation_required,
          flags
        `
      )
      .eq("id", incidentId)
      .maybeSingle();

    if (incidentError) {
      console.error("Incident fetch error:", incidentError);

      return NextResponse.json(
        {
          success: false,
          message: "Database error while fetching incident.",
          details: incidentError.message,
        },
        { status: 500 }
      );
    }

    if (!incident) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Incident not found or not accessible under current permissions.",
        },
        { status: 404 }
      );
    }

    // 5. Run the rule-based intelligence engine
    const result = runIncidentIntelligence({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      incident_type: incident.incident_type ?? "OTHER",
      affected_people: incident.affected_people ?? 1,
      medical_required: incident.medical_required ?? false,
      evacuation_required: incident.evacuation_required ?? false,
      flags: incident.flags ?? {},
    });

    // 6. Prepare analysis for human review
    const analysisToSave = {
      ...result,
      analysis: {
        ...result.analysis,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        review_status: "PENDING",
        requires_human_review: true,
      },
    };

    // 7. Save analysis in Supabase
    const { data: updatedIncident, error: updateError } = await supabase
      .from("incidents")
      .update({
        ai_analysis: analysisToSave,
      })
      .eq("id", incidentId)
      .select("id, ai_analysis")
      .maybeSingle();

    if (updateError) {
      console.error("Analysis update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          message: "Could not save incident analysis.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // RLS may prevent the update without returning a database error
    if (!updatedIncident) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Analysis was generated but could not be saved. Check your incidents UPDATE RLS policy.",
        },
        { status: 403 }
      );
    }

    // 8. Return successful result
    return NextResponse.json({
      success: true,
      message: "Incident analysis generated successfully.",
      incidentId: updatedIncident.id,
      result: updatedIncident.ai_analysis,
    });
  } catch (error) {
    console.error("AI analysis API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unexpected server error while analyzing incident.",
      },
      { status: 500 }
    );
  }
}
