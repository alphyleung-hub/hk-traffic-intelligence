export type TransLinkVehicle = {
  id: string;
  route: string;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
};

export type TransLinkResponse = {
  ok: boolean;
  vehicles?: TransLinkVehicle[];
  error?: string;
};

export async function getTransLinkVehicles(): Promise<TransLinkResponse> {
  try {
    // Call our own internal API route
    const res = await fetch("/api/translink", { cache: "no-store" });
    
    if (!res.ok) {
      return { ok: false, error: "Failed to fetch from internal API" };
    }
    
    return await res.json();
  } catch (error) {
    return { ok: false, error: "Network error" };
  }
}