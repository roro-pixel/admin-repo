export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Client {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  noShowCount: number;
}

export interface Barber {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  description: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientLastname: string;
  clientFirstname: string;
  clientEmail: string;
  barberId: string;
  barberLastname: string;
  barberFirstname: string;
  appointmentTime: Date;
  bookedTime: Date;
  haircutType: string;
  price: number;
  status: string;
}

export interface Haircut {
  id: number;
  type: string;
  duration: number;
  description: string;
  price: number;
}

export interface TimeOff {
  timeId: string;
  barberId: string;
  startDate: Date;
  endDate: Date;
  status: boolean;
}

export interface Availability {
  id: number;
  barberId: string;
  lastname: string;
  firstname: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  note: string;
}

export interface History {
  historyId: string;
  clientId: string;
  appointmentId: string;
}

export interface CreateAppointmentData {
  email: string;
  barberId: string;
  haircutType: string;
  appointmentTime: Date;
}

export interface UpdateAppointmentData {
  id: string;
  email: string;
  barberId: string;
  haircutType: string;
  appointmentTime: Date;
}

export type ScheduleForm = {
  barberId: string;
  workingDays: number[];
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};

export interface Schedule {
  id: string;
  barberId: string;
  workingDays: number[];
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string;
}

// ----------------------------------------------------------------------------------------

export interface Esthetician {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  description: string;
  available: boolean;
}

export interface BeautyService {
  id: number;
  type: string; 
  duration: number;
  description: string;
  price: number;
}

export interface EstheticianAppointment {
  id: string;
  clientId: string;
  clientLastname: string;
  clientFirstname: string;
  clientEmail: string;
  estheticianId: string;
  estheticianLastname: string;
  estheticianFirstname: string;
  appointmentTime: Date;
  bookedTime: Date;
  estheticType: string;
  price: number;
  status: string;
}

export interface EstheticianTimeOff {
  timeId: string;
  estheticianId: string; 
  startDate: Date;
  endDate: Date;
  status: boolean;
}

export interface EstheticianAvailability {
  id: number;
  estheticianId: string; 
  lastname: string;
  firstname: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  note: string;
}

export interface CreateEstheticianAppointmentData {
  email: string;
  estheticianId: string; 
  estheticType: string; 
  appointmentTime: Date;
}

export interface UpdateEstheticianAppointmentData {
  id: string;
  email: string;
  estheticianId: string; 
  estheticType: string; 
  appointmentTime: Date;
}

export type EstheticianScheduleForm = {
  estheticianId: string;
  workingDays: number[];
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};

export interface EstheticianSchedule {
  id: string;
  estheticianId: string; 
  workingDays: number[];
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string;
}