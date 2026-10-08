"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  LocateFixed,
  LogOut,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Siren,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const activeIncident = {
  id: "INC-2048",
  type: "Medical Emergency",
  title: "Multiple injuries reported",
  location: "Civil Lines, Near Railway Crossing",
  distance: "2.4 km",
  eta: "7 min",
  severity: "CRITICAL",
  people: 4,
  reported: "3 min ago",
};

export default function ResponderDashboard() {
  const [status, setStatus] = useState("AVAILABLE");
  const [assignmentStatus, setAssignmentStatus] = useState("EN_ROUTE");

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#090b10]/95 px-5 py-6 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/15 text-red-400">
            <Siren size={21} />
          </div>

          <div>
            <h1 className="font-bold tracking-wide">ResQAI</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Response Network
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          <NavItem
            icon={<ShieldCheck size={18} />}
            label="Overview"
            active
          />

          <NavItem
            icon={<AlertTriangle size={18} />}
            label="My Incidents"
          />

          <NavItem
            icon={<Navigation size={18} />}
            label="Navigation"
          />

          <NavItem
            icon={<Radio size={18} />}
            label="Communication"
          />

          <NavItem
            icon={<Bell size={18} />}
            label="Notifications"
          />
        </nav>

        <div className="absolute bottom-6 left-5 right-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-500">Current role</p>

            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-sm font-medium">RESPONDER</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="relative min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#07090d]/80 px-5 backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-red-400">
              Responder Command
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Field Operations
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Availability */}
            <button
              onClick={() =>
                setStatus(status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE")
              }
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:flex"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "AVAILABLE"
                    ? "bg-green-400"
                    : "bg-gray-500"
                }`}
              />

              {status}
            </button>

            <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
              <Bell size={19} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <User size={16} />
              </div>

              <span className="hidden text-sm sm:block">
                Responder
              </span>
            </button>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Stay ready. Respond fast.
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Monitor your assigned emergencies and coordinate your response.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<AlertTriangle size={19} />}
              label="Active Assignment"
              value="01"
              description="Requires attention"
              danger
            />

            <StatCard
              icon={<Clock3 size={19} />}
              label="Response ETA"
              value="07 min"
              description="Current assignment"
            />

            <StatCard
              icon={<CheckCircle2 size={19} />}
              label="Completed Today"
              value="08"
              description="Successful responses"
            />

            <StatCard
              icon={<Users size={19} />}
              label="Team Members"
              value="04"
              description="Currently deployed"
            />
          </div>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            {/* Active Assignment */}
            <div className="overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] to-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                    <Siren size={21} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-red-400">
                      Active Assignment
                    </p>

                    <h3 className="mt-1 font-semibold">
                      {activeIncident.id}
                    </h3>
                  </div>
                </div>

                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-400">
                  {activeIncident.severity}
                </span>
              </div>

              <div className="p-5">
                <h2 className="text-xl font-bold">
                  {activeIncident.title}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {activeIncident.type}
                </p>

                <div className="mt-6 space-y-4">
                  <InfoRow
                    icon={<MapPin size={18} />}
                    label="Location"
                    value={activeIncident.location}
                  />

                  <InfoRow
                    icon={<LocateFixed size={18} />}
                    label="Distance"
                    value={activeIncident.distance}
                  />

                  <InfoRow
                    icon={<Clock3 size={18} />}
                    label="Estimated arrival"
                    value={activeIncident.eta}
                  />

                  <InfoRow
                    icon={<Users size={18} />}
                    label="People affected"
                    value={`${activeIncident.people} people`}
                  />
                </div>

                {/* Assignment status */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Assignment status
                    </span>

                    <span className="text-xs font-semibold text-orange-400">
                      {assignmentStatus}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[65%] rounded-full bg-orange-500" />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                    <span>Assigned</span>
                    <span>En Route</span>
                    <span>Arrived</span>
                    <span>Completed</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-500">
                    <Navigation size={17} />
                    Open Navigation
                  </button>

                  <button
                    onClick={() => setAssignmentStatus("ARRIVED")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
                  >
                    <CheckCircle2 size={17} />
                    Mark Arrived
                  </button>
                </div>
              </div>
            </div>

            {/* Live Status */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Live Status
                  </p>

                  <h3 className="mt-1 text-lg font-semibold">
                    Response Network
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-green-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                  LIVE
                </div>
              </div>

              {/* Fake map */}
              <div className="relative mt-5 h-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute left-1/4 top-0 h-full w-px bg-white" />
                  <div className="absolute left-2/4 top-0 h-full w-px bg-white" />
                  <div className="absolute left-3/4 top-0 h-full w-px bg-white" />

                  <div className="absolute left-0 top-1/3 h-px w-full bg-white" />
                  <div className="absolute left-0 top-2/3 h-px w-full bg-white" />
                </div>

                <div className="absolute left-[32%] top-[42%]">
                  <span className="absolute h-12 w-12 animate-ping rounded-full bg-red-500/20" />

                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-400 bg-red-500 text-white">
                    <Siren size={14} />
                  </div>
                </div>

                <div className="absolute left-[68%] top-[63%]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-green-500/20 text-green-400">
                    <Navigation size={14} />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-[10px] text-gray-400 backdrop-blur">
                  LIVE LOCATION
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-gray-500">Your location</p>
                  <p className="mt-1 text-sm font-medium">Tracking active</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-gray-500">Team channel</p>
                  <p className="mt-1 text-sm font-medium text-green-400">
                    Connected
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Quick Actions
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Response controls
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                icon={<Navigation size={19} />}
                title="Navigation"
                description="View response route"
              />

              <QuickAction
                icon={<Radio size={19} />}
                title="Team Radio"
                description="Contact operations"
              />

              <QuickAction
                icon={<MapPin size={19} />}
                title="Share Location"
                description="Send live location"
              />

              <QuickAction
                icon={<X size={19} />}
                title="Request Backup"
                description="Ask for assistance"
                danger
              />
            </div>
          </div>

          {/* Footer status */}
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              System operational
            </div>

            <div>
              Last synchronization: just now
            </div>

            <button className="flex items-center gap-2 text-gray-400 hover:text-white">
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
        active
          ? "bg-red-500/10 text-red-400"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "bg-red-500/10 text-red-400"
              : "bg-white/5 text-gray-400"
          }`}
        >
          {icon}
        </div>

        {danger && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        )}
      </div>

      <p className="mt-5 text-xs text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-500">{icon}</div>

      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`rounded-2xl border p-4 text-left transition ${
        danger
          ? "border-red-500/10 bg-red-500/[0.04] hover:border-red-500/30 hover:bg-red-500/[0.08]"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${
          danger
            ? "bg-red-500/10 text-red-400"
            : "bg-white/5 text-gray-400"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  );
}
