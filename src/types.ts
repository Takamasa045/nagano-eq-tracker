export type RawEvent = {
  time: string;
  magnitude: number;
  depth: number | null;
  lat: number;
  lon: number;
  maxScale: number | null;
  type: string;
  id: string;
};

export type Dataset = {
  fetched_at: string;
  source: string;
  filter: {
    name: string;
    bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
    depth_max_km: number;
    min_magnitude: number;
    since: string;
    until: string;
  };
  count: number;
  events: RawEvent[];
};

export type Event = RawEvent & {
  date: Date;
  intensity: string;
};

export type Series = {
  key: "A" | "B";
  label: string;
  color: string;
  mainshock: Event;
  events: Event[];
};
