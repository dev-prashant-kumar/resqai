
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/supabase/admin-authorization";

export async function GET() {
  const { staff, response } = await authorizeAdminRequest();

  if (response) return response;

  try {
    const { data: incidents, error } = await staff.admin
      .from("incidents")
      .select(`
        id,
        reported_by,
        title,
        description,
        incident_type,
        severity,
        status,
        affected_people,
        medical_required,
        evacuation_required,
        image_url,
        address,
        ai_confidence,
        ai_analysis,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin incident lookup failed:", error.message);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load incidents.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      incidents: incidents ?? [],
      total: incidents?.length ?? 0,
    });
  } catch (error) {
    console.error("Admin incidents API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while loading incidents.",
      },
      { status: 500 },
    );
  }
}
