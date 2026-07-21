export interface Appointment {
  id: string;
  available: boolean;
  startTime: string;
  endingTime: string;
}

export interface Day {
  id: string;
  date: Date;
  appointments: Appointment[];
}

export interface Agenda {
  id: string;
  days: Day[];
}
