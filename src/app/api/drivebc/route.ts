import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lower Mainland bounding box
    const bbox = "-123.4,49.0,-122.5,49.5";
    // Using Open511 standard API from DriveBC
    const url = `https://api.open511.gov.bc.ca/events?bbox=${bbox}&status=ACTIVE`;
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) throw new Error("Failed to fetch DriveBC");

    const data = await response.json();
    
    // Map DriveBC events to GeoJSON features
    const features = data.events.map((event: any) => {
      // Determine color based on severity or event type
      let color = "#FFC857"; // Default Yellow (Moderate/Warning)
      if (event.severity === "MAJOR" || event.event_type === "INCIDENT" || event.event_type === "CLOSURE") {
        color = "#FF5D73"; // Red for major incidents
      } else if (event.severity === "MINOR" || event.event_type === "CONSTRUCTION") {
        color = "#3DDC97"; // Green for minor/construction (or you could use a blue)
      }

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: event.geography?.coordinates || [-123.12, 49.28],
        },
        properties: {
          id: event.id,
          name: event.headline,
          description: event.description,
          severity: event.severity,
          type: event.event_type,
          color: color,
        }
      };
    });

    return NextResponse.json({ ok: true, features });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to load road events" }, { status: 500 });
  }
}