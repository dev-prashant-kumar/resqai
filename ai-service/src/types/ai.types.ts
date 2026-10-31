
export type IncidentType =
  | "FLOOD"
  | "FIRE"
  | "ROAD_ACCIDENT"
  | "MEDICAL"
  | "EVACUATION"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ResourceType =
  | "AMBULANCE"
  | "RESCUE_TEAM"
  | "VOLUNTEER"
  | "EMERGENCY_VEHICLE"
  | "MEDICAL_TEAM"
  | "SHELTER";

export interface IncidentInput {
  id?: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  affected_people: number | null;
  medical_required: boolean | null;
  evacuation_required: boolean | null;
  flags?: Record<string, unknown> | null;
}

export interface ResourceInput {
  id: string;
  name: string;
  resource_type: ResourceType;
  status: string;
  capacity: number | null;
  skills: string[] | null;
  distanceKm?: number | null;
}

export interface IncidentAnalysis {
  detected_type: IncidentType;
  severity: Severity;
  risk_score: number;
  risk_factors: string[];
  recommended_resource_types: ResourceType[];
  analysis_method: "RULE_BASED";
  requires_human_review: true;
  explanation: string;
}

export interface RankedResource {
  id: string;
  name: string;
  resource_type: ResourceType;
  score: number;
  reasons: string[];
  distance_km: number | null;
}

export interface ResponsePlan {
  priority: Severity;
  immediate_actions: string[];
  recommended_resources: ResourceType[];
  operator_notes: string[];
}
