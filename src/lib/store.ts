import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UnitStatus = "Occupied" | "Vacant" | "Maintenance";
export type Priority = "Emergency" | "High" | "Normal";
export type TicketStatus = "Open" | "In Progress" | "Done";
export type PaymentType = "Rent" | "Water" | "Service";
export type EventType = "Move-in" | "Inspection" | "Admin";

export interface Unit { id: string; number: string; floor: number; status: UnitStatus; rent: number; tenantId?: string; }
export interface Tenant { id: string; name: string; email: string; phone: string; unitId: string; leaseStart: string; leaseEnd: string; balance: number; }
export interface Payment { id: string; tenantId: string; amount: number; type: PaymentType; date: string; }
export interface Ticket { id: string; title: string; unit: string; priority: Priority; status: TicketStatus; createdAt: string; cost: number; }
export interface UtilityReading { id: string; unit: string; cubicMeters: number; date: string; }
export interface CalendarEvent { id: string; title: string; date: string; type: EventType; }
export interface Notice { id: string; title: string; body: string; date: string; pinned?: boolean; }

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  units: Unit[]; tenants: Tenant[]; payments: Payment[]; tickets: Ticket[];
  readings: UtilityReading[]; events: CalendarEvent[]; notices: Notice[];

  addUnit: (u: Omit<Unit, "id">) => void;
  updateUnit: (id: string, u: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  addTenant: (t: Omit<Tenant, "id">) => void;
  updateTenant: (id: string, t: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  addPayment: (p: Omit<Payment, "id">) => void;
  deletePayment: (id: string) => void;

  addTicket: (t: Omit<Ticket, "id">) => void;
  updateTicket: (id: string, t: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;

  addReading: (r: Omit<UtilityReading, "id">) => void;
  deleteReading: (id: string) => void;

  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: string) => void;

  addNotice: (n: Omit<Notice, "id">) => void;
  updateNotice: (id: string, n: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      units: [], tenants: [], payments: [], tickets: [], readings: [], events: [], notices: [],

      addUnit: (u) => set((s) => ({ units: [...s.units, { ...u, id: uid() }] })),
      updateUnit: (id, u) => set((s) => ({ units: s.units.map((x) => x.id === id ? { ...x, ...u } : x) })),
      deleteUnit: (id) => set((s) => ({
        units: s.units.filter((x) => x.id !== id),
        tenants: s.tenants.filter((t) => t.unitId !== id),
      })),

      addTenant: (t) => set((s) => ({
        tenants: [...s.tenants, { ...t, id: uid() }],
        units: s.units.map((u) => u.id === t.unitId ? { ...u, status: "Occupied" } : u),
      })),
      updateTenant: (id, t) => set((s) => ({ tenants: s.tenants.map((x) => x.id === id ? { ...x, ...t } : x) })),
      deleteTenant: (id) => set((s) => {
        const tenant = s.tenants.find((x) => x.id === id);
        return {
          tenants: s.tenants.filter((x) => x.id !== id),
          units: tenant ? s.units.map((u) => u.id === tenant.unitId ? { ...u, status: "Vacant" } : u) : s.units,
        };
      }),

      addPayment: (p) => set((s) => ({
        payments: [...s.payments, { ...p, id: uid() }],
        tenants: s.tenants.map((t) => t.id === p.tenantId ? { ...t, balance: t.balance + p.amount } : t),
      })),
      deletePayment: (id) => set((s) => {
        const p = s.payments.find((x) => x.id === id);
        return {
          payments: s.payments.filter((x) => x.id !== id),
          tenants: p ? s.tenants.map((t) => t.id === p.tenantId ? { ...t, balance: t.balance - p.amount } : t) : s.tenants,
        };
      }),

      addTicket: (t) => set((s) => ({ tickets: [...s.tickets, { ...t, id: uid() }] })),
      updateTicket: (id, t) => set((s) => ({ tickets: s.tickets.map((x) => x.id === id ? { ...x, ...t } : x) })),
      deleteTicket: (id) => set((s) => ({ tickets: s.tickets.filter((x) => x.id !== id) })),

      addReading: (r) => set((s) => ({ readings: [...s.readings, { ...r, id: uid() }] })),
      deleteReading: (id) => set((s) => ({ readings: s.readings.filter((x) => x.id !== id) })),

      addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),

      addNotice: (n) => set((s) => ({ notices: [...s.notices, { ...n, id: uid() }] })),
      updateNotice: (id, n) => set((s) => ({ notices: s.notices.map((x) => x.id === id ? { ...x, ...n } : x) })),
      deleteNotice: (id) => set((s) => ({ notices: s.notices.filter((x) => x.id !== id) })),
    }),
    { name: "propertyhq-store" }
  )
);
