export type Role = "owner" | "assistant" | "tenant";
export type UnitStatus = "Occupied" | "Vacant" | "Maintenance";
export type BedroomType = "Bedsitter" | "1 Bedroom" | "2 Bedroom" | "3 Bedroom" | "4 Bedroom";
export type Priority = "Emergency" | "High" | "Normal";
export type TicketStatus = "Open" | "In Progress" | "Done";
export type PaymentType = "Rent" | "Deposit" | "Water" | "Electricity" | "Garbage" | "Security" | "Service" | "Other";
export type EventType = "Move-in" | "Inspection" | "Admin";

export interface Unit {
  id: string;
  number: string;
  floor: number;
  bedrooms: BedroomType;
  rent: number;
  status: UnitStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  unit_id: string | null;
  login_email?: string | null;
  created_at: string;
}

export interface TenantLoginRef {
  id: string;
  unit_id: string;
  user_id: string;
  login_email: string;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  type: PaymentType;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  unit_id: string | null;
  created_by: string | null;
  priority: Priority;
  status: TicketStatus;
  cost: number;
  created_at: string;
}

export interface Reading {
  id: string;
  unit_id: string;
  cubic_meters: number;
  date: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  created_at: string;
  expires_at?: string | null;
}

export const FLOORS: { value: number; label: string }[] = [
  { value: 0, label: "Ground" },
  { value: 1, label: "First" },
];

export const BEDROOM_TYPES: BedroomType[] = ["Bedsitter", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4 Bedroom"];
