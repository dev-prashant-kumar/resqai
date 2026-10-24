
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const registrationCode = process.env.STAFF_REGISTRATION_CODE;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (
      !registrationCode ||
      !supabaseUrl ||
      !publishableKey ||
      !serviceRoleKey ||
      !siteUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff registration is not configured.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const suppliedCode =
      typeof body.registration_code === "string"
        ? body.registration_code
        : "";

    if (!fullName || !email || !password || !suppliedCode) {
      return NextResponse.json(
        { success: false, message: "Please complete every field." },
        { status: 400 },
      );
    }

    if (fullName.length > 100 || email.length > 254) {
      return NextResponse.json(
        { success: false, message: "Some fields are too long." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 10 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be 10–72 characters long.",
        },
        { status: 400 },
      );
    }

    if (suppliedCode !== registrationCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid staff registration code.",
        },
        { status: 403 },
      );
    }

    // Public client: creates the account and requests confirmation email.
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/admin/login`,
      },
    });

    if (error) {
      console.error("Staff sign-up failed:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase did not return a user account.",
        },
        { status: 500 },
      );
    }

    // Privileged client: used only on the server for profile management.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          role: "OPERATOR",
        },
        { onConflict: "id" },
      );

    if (profileError) {
      console.error("Staff profile creation failed:", profileError.message);

      // Roll back the account if profile creation failed.
      await adminClient.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        {
          success: false,
          message: "The staff profile could not be created.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Check your inbox and spam folder for the confirmation email before signing in.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Staff registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred.",
      },
      { status: 500 },
    );
  }
}
