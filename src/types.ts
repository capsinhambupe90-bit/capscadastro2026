export interface Patient {
  id: string;
  name: string;
  medicalRecord: string;
  birthDate: string;
  cpf: string;
  motherName: string;
  address: string;
  gender: 'Masculino' | 'Feminino' | '';
  isIntensive: 'Sim' | 'Não' | '';
  lastUpdate: string;
}

export type NewPatient = Omit<Patient, 'id' | 'lastUpdate'>;

export interface DateSlot {
  id: string;
  date: string; // YYYY-MM-DD
  description: string; // e.g., "Manhã", "Tarde", "Dr. Silva"
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMedicalRecord: string;
  dateId: string;
  status: 'Agendado' | 'Realizado' | 'Faltou';
}
