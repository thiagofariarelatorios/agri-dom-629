
export type RoomStatus = 'Limpo' | 'Sujo' | 'Manutenção';

export type ReservationStatus = 
  'reserved' | 'confirmed' | 'confirmed_advance' | 
  'occupied' | 'occupied_partial' | 'occupied_full' | 
  'cancelled' | 'no_show' | 'checked-out' |
  'checked-out_invoiced' | 'checked-out_paid';

export type PaymentType = 'pix' | 'credit' | 'debit' | 'transfer' | 'money';

export interface Payment {
  amount: number;
  type: PaymentType;
}

export interface Consumption {
  id: string;
  description: string;
  amount: number;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  status: RoomStatus;
  price: number;
  capacity: number;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  cpf?: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
}

export interface CompanyPayment {
  id: string;
  companyId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentType;
  notes?: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  guestId: string;
  companyId?: string;
  startDate: string; 
  endDate: string;
  status: ReservationStatus;
  adults: number;
  children: number;
  dailyRate: number;
  payments: Payment[];
  advancePayment: Payment;
  consumptions: Consumption[];
  observations?: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    role: 'admin' | 'employee' | 'limpeza';
    active: boolean;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: string;
    details: string;
}

export interface AppSettings {
    hotelName: string;
    address: string;
    phone: string;
    email: string;
    checkInTime: string;
    checkOutTime: string;
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  reportText: string;
  tasks: DailyTask[];
}

export type Page = 'dashboard' | 'calendar' | 'hospedes' | 'quartos' | 'usuarios' | 'configuracoes' | 'daily_tasks' | 'empresas' | 'financeiro' | 'audit_log';

export interface ModalState {
  type: 'reservation' | 'guest' | 'room' | 'user' | 'checkout' | 'confirmation' | 'company' | 'company_payment' | null;
  data?: any;
}