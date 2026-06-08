import type { Unit } from "@/integrations/types";

const NOW = new Date().toISOString();

export const UNITS: Unit[] = [
  { id: "G1", floor: "Ground", label: "G1", rent_amount: 0, unit_type: "2-bedroom", created_at: NOW },
  { id: "G2", floor: "Ground", label: "G2", rent_amount: 0, unit_type: "2-bedroom", created_at: NOW },
  { id: "G3", floor: "Ground", label: "G3", rent_amount: 0, unit_type: "bedsitter", created_at: NOW },
  { id: "G4", floor: "Ground", label: "G4", rent_amount: 0, unit_type: "bedsitter", created_at: NOW },
  { id: "F1", floor: "First", label: "F1", rent_amount: 0, unit_type: "2-bedroom", created_at: NOW },
  { id: "F2", floor: "First", label: "F2", rent_amount: 0, unit_type: "2-bedroom", created_at: NOW },
  { id: "F3", floor: "First", label: "F3", rent_amount: 0, unit_type: "bedsitter", created_at: NOW },
  { id: "F4", floor: "First", label: "F4", rent_amount: 0, unit_type: "bedsitter", created_at: NOW },
];

export async function getUnits(): Promise<Unit[]> {
  // Return a cloned array so callers can safely mutate if needed
  return UNITS.slice();
}

export async function getUnit(id: string | null | undefined): Promise<Unit | null> {
  if (!id) return null;
  return UNITS.find((u) => u.id === id) ?? null;
}

export default UNITS;
