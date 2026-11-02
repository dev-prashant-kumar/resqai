
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runIncidentIntelligence } from "@/ai-service/src";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INCIDENT_TYPES = [
  "MEDICAL",
  "FIRE",
  "FLOOD",
  "ROAD_ACCIDENT",
  "EVACUATION",
  "OTHER",
] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Please log in to report an incident." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      incident_type,
      affected_people,
      medical_required,
      evacuation_required,
      image_url,
      location,
      address,
    } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 120 ||
      typeof description !== "string" ||
      description.trim().length < 5 ||
      description.length > 3000
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid title and description." },
        { status: 400 }
      );
    }

    if (
      !INCIDENT_TYPES.includes(incident_type) ||
      !Number.isInteger(affected_people) ||
      affected_people < 1 ||
      affected_people > 100000 ||
      typeof medical_required !== "boolean" ||
      typeof evacuation_required !== "boolean"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid incident details." },
        { status: 400 }
      );
    }

    if (
      typeof location !== "string" ||
      !/^POINT\(\s*-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s*\)$/.test(location)
    ) {
      return NextResponse.json(
        { success: false, message: "A valid GPS location is required." },
        { status: 400 }
      );
    }

    const flags = {
      medical_required,
      evacuation_required,
    };

    // Generate a deterministic, rule-based assessment on the server.
    // This is decision support and requires authorized human review.
    const result = runIncidentIntelligence({
      title: title.trim(),
      description: description.trim(),
      incident_type,
      affected_people,
      medical_required,
      evacuation_required,
      flags,
    });

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

    const { data: incident, error: insertError } = await supabase
      .from("incidents")
      .insert({
        reported_by: user.id,
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        incident_type,
        severity: result.analysis.severity,
        status: "REPORTED",
        affected_people,
        medical_required,
        evacuation_required,
        flags,
        image_url: image_url ?? null,
        location,
        address: address ?? null,
        ai_analysis: analysisToSave,
      })
      .select("id, ai_analysis")
      .single();

    if (insertError) {
      console.error("Incident creation error:", insertError);

      return NextResponse.json(
        {
          success: false,
          message: "Could not submit the incident report.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Incident submitted and initial assessment generated.",
        incidentId: incident.id,
        ai_analysis: incident.ai_analysis,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Incident API error:", error);

    return NextResponse.json(
      { success: false, message: "Unexpected error while submitting the report." },
      { status: 500 }
    );
  }
}
