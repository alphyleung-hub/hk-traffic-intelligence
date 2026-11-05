import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch events in the Lower Mainland (bbox covers Vancouver area)
    const bbox = "-123.4,49.0,-122.5,49.5";
    const url = `https://api.open511.gov.bc.ca/events?bbox=${bbox}&status=ACTIVE`;
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) throw new Error("Failed to fetch DriveBC");

    const data = await response.json();
    
    // Map DriveBC events to GeoJSON features
    const features = data.events.map((event: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: event.geography?.coordinates || [-123.12, 49.28], // Fallback
      },
      properties: {
        id: event.id,
        name: event.headline,
        severity: event.severity, // MINOR, MODERATE, MAJOR
        type: event.event_type,   // CONSTRUCTION, INCIDENT, etc.
      }
    }));

    return NextResponse.json({ ok: true, features });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to load road events" }, { status: 500 });
  }
}