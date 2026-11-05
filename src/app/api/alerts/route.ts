import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

export const dynamic = 'force-dynamic';

export async function GET() {
  //const apiKey = process.env.TRANSLINK_API_KEY; 
   const apiKey = "H3UjUs0J3JBlupKCwj2e";
  
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing API Key" }, { status: 500 });
  }

  try {
    const url = `https://gtfsapi.translink.ca/v3/gtfsalerts?apikey=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) throw new Error("Failed to fetch alerts");

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const alerts = feed.entity.map((entity) => {
      const a = entity.alert;
      if (!a) return null;
      return {
        id: entity.id,
        title: a.headerText?.translation?.[0]?.text || "Service Alert",
        description: a.descriptionText?.translation?.[0]?.text || "",
      };
    }).filter(Boolean).slice(0, 5); // Keep the top 5 most recent

    return NextResponse.json({ ok: true, alerts });

  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to load alerts" }, { status: 500 });
  }
}