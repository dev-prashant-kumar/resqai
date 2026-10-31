import { runIncidentIntelligence } from "./src";



const exampleIncident = {
  id: "test-incident",
  title: "Major road accident",
  description:
    "A truck collided with a car. Several people are injured and one person is unconscious.",
  incident_type: "ROAD_ACCIDENT" as const,
  affected_people: 12,
  medical_required: true,
  evacuation_required: false,
  flags: {},
};

const result = runIncidentIntelligence(exampleIncident);

console.log(
  JSON.stringify(result, null, 2)
);
