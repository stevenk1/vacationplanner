// PocketBase record shapes (the fields we use; PB also returns collectionId/collectionName).

export interface Holiday {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  locationName: string;
  countryCode: string;
  accentOverride?: string;
  emoji?: string;
  notes?: string;
  created?: string;
  updated?: string;
}

export interface SubPeriod {
  id: string;
  holiday: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  stayName: string;
  stayAddress: string;
  stayLat: number;
  stayLng: number;
  stayCountryCode?: string;
  created?: string;
  updated?: string;
}

export interface Place {
  id: string;
  subperiod: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  notes?: string;
  driveSeconds?: number;
  driveMeters?: number;
  created?: string;
  updated?: string;
}

// Convenience shape used by the map + overview: a place joined to its sub-period.
export interface PlaceWithSub extends Place {
  sub: SubPeriod;
}
