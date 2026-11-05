import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

export const dynamic = 'force-dynamic'; // Ensures no caching issues

export async function GET() {
  // 1. Get your API key from the environment variables (.env.local or Cloudflare Secrets)
  //const apiKey = process.env.TRANSLINK_API_KEY;
   // Temporarily replace this line:
   const apiKey = process.env.TRANSLINK_API_KEY;
  
  
  
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing TransLink API Key" }, { status: 500 });
  }

  try {
    // 2. Fetch the vehicle positions (where are the buses/trains right now?)
    const url = `https://gtfsapi.translink.ca/v3/gtfsposition?apikey=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });
    


    if (!response.ok) {
      throw new Error(`TransLink API responded with status: ${response.status}`);
    }

    // 3. Decode the binary Protobuf data into an object
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    // 4. Format the data so your MapLibre map can read it easily
    const vehicles = feed.entity.map((entity) => {
      const v = entity.vehicle;
      if (!v || !v.position) return null;
      
      return {
        id: entity.id,
        route: v.trip?.routeId || "Unknown",
        lat: v.position.latitude,
        lon: v.position.longitude,
        bearing: v.position.bearing || 0,
        speed: v.position.speed || 0
      };
    }).filter(Boolean); // Remove any empty entries

    // 5. Return the clean JSON to the frontend
    return NextResponse.json({ ok: true, vehicles });

  } catch (error) {
    console.error("TransLink Fetch Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch TransLink data" }, { status: 500 });
  }
}