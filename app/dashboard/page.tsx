import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  MapPin, 
  LogOut, 
  Activity,
  PlusCircle,
  Truck,
  Users,
  Flame,
  Waves,
  HeartPulse,
  Car,
  Home,
  FileText,
  Compass,
  User as UserIcon,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile data including role and full name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .single();

  // Fetch real-time metrics for the command dashboard
  const { count: totalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true });

  const { count: criticalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("severity", "CRITICAL");

  const { count: availableResources } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("status", "AVAILABLE");

  const { count: activeShelters } = await supabase
    .from("shelters")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Fetch recent incidents for the command feed
  const { data: recentIncidents } = await supabase
    .from("incidents")
    .select("id, title, incident_type, severity, status, created_at, address")
    .order("created_at", { ascending: false })
    .limit(5);

  // Server action for logging out securely
  async function signOut() {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/login");
  }

  const role = profile?.role || "CITIZEN";
  const isOperatorOrResponder = role === "OPERATOR" || role === "ADMIN" || role === "RESPONDER";

  return (
    <main className="min-h-screen bg-[#060709] text-zinc-100 selection:bg-red-500 selection:text-white flex flex-col justify-between pb-24 md:pb-0 antialiased">
      <div>
        {/* Friendly Top Navigation */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#060709]/90 px-4 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-lg">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">ResQAI Emergency Hub</h1>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected & Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-zinc-300 transition active:scale-95 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-8 sm:px-8 space-y-6">
          
          {/* Welcome Action Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/30 via-[#101115] to-[#0a0b0f] p-6 sm:p-8 shadow-2xl">
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <span className="inline-block rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2">
                  Account Type: {role}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Hello, {profile?.full_name || "Emergency User"}! 👋
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  {isOperatorOrResponder 
                    ? "Here is your overview of ongoing emergencies, rescue teams ready for deployment, and recent citizen reports."
                    : "Need help right away? Tap the button below to report an emergency or check the progress of your submitted requests."}
                </p>
              </div>

              <div className="shrink-0">
                {role === "CITIZEN" ? (
                  <Link href="/report">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition active:scale-95 hover:bg-red-500">
                      <PlusCircle className="h-5 w-5" />
                      Report New Emergency
                    </button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl bg-zinc-800/80 border border-white/10 px-5 py-3.5 text-xs text-zinc-300">
                    <Radio className="h-5 w-5 text-red-400 animate-pulse shrink-0" />
                    <span>Emergency Response Controls Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            
            <div className="rounded-2xl border border-white/10 bg-[#101115] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Reports</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{totalIncidents || 0}</div>
              <p className="mt-1 text-[11px] text-zinc-500">Recorded in system</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101115] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Critical Emergencies</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{criticalIncidents || 0}</div>
              <p className="mt-1 text-[11px] text-rose-400 font-medium">Needs immediate help</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101115] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Teams Ready</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{availableResources || 0}</div>
              <p className="mt-1 text-[11px] text-zinc-500">Available units</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101115] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Open Shelters</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{activeShelters || 0}</div>
              <p className="mt-1 text-[11px] text-emerald-400 font-medium">Safe places open</p>
            </div>

          </div>

          {/* Recent Reports & Account Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Incident Feed */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500 shrink-0" />
                    <span>Recent Emergency Reports</span>
                  </h3>
                  <span className="text-xs text-zinc-400">Showing latest updates</span>
                </div>

                {recentIncidents && recentIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {recentIncidents.map((incident) => (
                      <Link
                        key={incident.id}
                        href={`/dashboard/incidents/${incident.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/25 p-4 transition active:scale-[0.99] hover:border-red-500/30 hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                            {incident.incident_type === "FIRE" ? <Flame className="h-5 w-5" /> :
                             incident.incident_type === "FLOOD" ? <Waves className="h-5 w-5" /> :
                             incident.incident_type === "MEDICAL" ? <HeartPulse className="h-5 w-5" /> :
                             incident.incident_type === "ROAD_ACCIDENT" ? <Car className="h-5 w-5" /> :
                             <AlertTriangle className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">{incident.title}</h4>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{incident.address || "Location coordinates logged"}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            incident.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            incident.severity === "HIGH" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {incident.severity}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500">
                              {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
                    <Radio className="h-10 w-10 text-zinc-600 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">No emergency reports right now.</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">When reports are submitted, they will show up here immediately.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  Your Profile Information
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-3.5">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Name</span>
                    <span className="font-bold text-zinc-200 truncate block">{profile?.full_name || "Emergency User"}</span>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20 p-3.5">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Email Address</span>
                    <span className="font-semibold text-zinc-300 font-mono text-xs truncate block">{user.email}</span>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20 p-3.5">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Role</span>
                    <span className="inline-block mt-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <span className="text-[11px] text-zinc-500 tracking-wide font-medium">
                  ResQAI Emergency Support System
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#060709]/95 py-3 px-2 backdrop-blur-2xl md:hidden shadow-2xl">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-red-500">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/report" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200">
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Report</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200">
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Incidents</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200">
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden md:flex border-t border-white/10 bg-zinc-950 py-5 px-8 items-center justify-between text-xs text-zinc-500">
        <div>© {new Date().getFullYear()} ResQAI. All rights reserved.</div>
        <div>
          Developed by{" "}
          <a
            href="https://github.com/dev-prashant-kumar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 font-semibold underline underline-offset-4 transition hover:text-red-300"
          >
            Shant
          </a>
        </div>
      </footer>
    </main>
  );
}