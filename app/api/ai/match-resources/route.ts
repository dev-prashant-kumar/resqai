
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { rankResources } from "@/ai-service/src/services/resourceRanker";
import type {
  ResourceInput,
  ResourceType,
} from "@/ai-service/src/types/ai.types";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "Unable to verify user role" },
        { status: 403 }
      );
    }

    if (!["OPERATOR", "ADMIN"].includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: "Operator or admin access required" },
        { status: 403 }
      );
    }

    // 3. Validate incident ID
    const body = await request.json();
    const incidentId = body.incidentId;

    if (
      typeof incidentId !== "string" ||
      !UUID_REGEX.test(incidentId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid incident ID" },
        { status: 400 }
      );
    }

    // 4. Fetch incident and saved analysis
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("id, title, location, ai_analysis")
      .eq("id", incidentId)
      .maybeSingle();

    if (incidentError) {
      console.error("Incident fetch error:", incidentError);

      return NextResponse.json(
        { success: false, message: "Could not fetch incident" },
        { status: 500 }
      );
    }

    if (!incident) {
      return NextResponse.json(
        { success: false, message: "Incident not found or access denied" },
        { status: 404 }
      );
    }

    if (!incident.location) {
      return NextResponse.json(
        { success: false, message: "Incident location is missing" },
        { status: 400 }
      );
    }

    const analysis = incident.ai_analysis?.analysis;

    if (!analysis?.recommended_resource_types?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Generate incident analysis before matching resources",
        },
        { status: 400 }
      );
    }

    const recommendedTypes =
      analysis.recommended_resource_types as ResourceType[];

    // 5. Fetch available resources and calculate distance in PostGIS
    // NOTE: Supabase JS cannot directly select a computed ST_Distance
    // expression. This query requires the database RPC below.
    const { data: matchedResources, error: matchingError } =
      await supabase.rpc("match_available_resources", {
        incident_id: incidentId,
        recommended_types: recommendedTypes,
      });

    if (matchingError) {
      console.error("Resource matching error:", matchingError);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve nearby resources",
          detail: matchingError.message,
        },
        { status: 500 }
      );
    }

    // 6. Convert database results into engine inputs
    const resources: ResourceInput[] = (matchedResources ?? []).map(
      (resource: any) => ({
        id: resource.id,
        name: resource.name,
        resource_type: resource.resource_type,
        status: resource.status,
        capacity: resource.capacity,
        skills: resource.skills,
        distanceKm: resource.distance_km,
      })
    );

    // 7. Rank resources
    const rankedResources = rankResources(resources, {
      recommendedTypes,
    });

    return NextResponse.json({
      success: true,
      message: "Resource recommendations generated",
      incident: {
        id: incident.id,
        title: incident.title,
        severity: analysis.severity,
        risk_score: analysis.risk_score,
      },
      analysis_method: "RULE_BASED",
      requires_human_review: true,
      recommendations: rankedResources,
      total_recommendations: rankedResources.length,
    });
  } catch (error) {
    console.error("Resource matching API error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
