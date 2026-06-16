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

export interface StayListing {
  price?: number | null;
  currency?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  checkIn?: string;
  checkOut?: string;
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
  stayAirbnbUrl?: string; // source Airbnb listing URL ("View on Airbnb")
  stayPhotos?: string[]; // cached Airbnb listing photo filenames (served via PocketBase)
  stayListing?: StayListing; // scraped price/rating metadata
  created?: string;
  updated?: string;
  // PB also returns these; needed to build file URLs via pb.files.getUrl.
  collectionId?: string;
  collectionName?: string;
}

export interface PhotoAttribution {
  displayName?: string;
  uri?: string;
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
  photos?: string[]; // cached Google Places photo filenames (served via PocketBase)
  photoAttribution?: PhotoAttribution[];
  created?: string;
  updated?: string;
  // PB also returns these; needed to build file URLs via pb.files.getUrl.
  collectionId?: string;
  collectionName?: string;
}

// Convenience shape used by the map + overview: a place joined to its sub-period.
export interface PlaceWithSub extends Place {
  sub: SubPeriod;
}
