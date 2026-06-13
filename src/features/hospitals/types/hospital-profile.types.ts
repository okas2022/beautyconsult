export interface HospitalDoctorProfile {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  photoUrl: string;
  bio: string;
  career?: string[];
}

export interface HospitalProfile {
  hospitalId: string;
  slug: string;
  tagline: string;
  introShort: string;
  introFull: string;
  address: string;
  addressDetail?: string;
  mapUrl?: string;
  phone?: string;
  website: string;
  hours?: string;
  highlights: string[];
  doctors: HospitalDoctorProfile[];
}
