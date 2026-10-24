
import { NextResponse } from "next/server";
import {
  createClient as createSupabaseAdmin,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const ADMIN_BUCKET_NAME = "responder-verification-documents";

type StaffRole = "ADMIN" | "OPERATOR";

type AuthorizedStaff = {
  userId: string;
  role: StaffRole;
  admin: SupabaseClient;
};

type AuthorizationResult =
  | {
      staff: AuthorizedStaff;
      response: null;
    }
  | {
      staff: null;
      response: NextResponse;
    };

export async function authorizeAdminRequest(): Promise<AuthorizationResult> {
  // 1. Authenticate the user through the existing server-side session.
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      staff: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Please sign in to continue.",
        },
        { status: 401 },
      ),
    };
  }

  // 2. Ensure the privileged service-role credentials are configured.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Admin API environment configuration is incomplete.",
    );

    return {
      staff: null,
      response: NextResponse.json(
        {
          success: false,
          message: "The admin service is not configured.",
        },
        { status: 500 },
      ),
    };
  }

  // 3. Create a privileged client on the server only.
  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 4. Read the role from the database, never from the request body.
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Admin role lookup failed:",
      profileError.message,
    );

    return {
      staff: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unable to verify your permissions.",
        },
        { status: 500 },
      ),
    };
  }

  const role = profile?.role;

  // 5. Only ADMIN and OPERATOR can access admin endpoints.
  if (role !== "ADMIN" && role !== "OPERATOR") {
    return {
      staff: null,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access this resource.",
        },
        { status: 403 },
      ),
    };
  }

  // 6. Return the verified user identity and privileged server client.
  return {
    staff: {
      userId: user.id,
      role,
      admin,
    },
    response: null,
  };
}
