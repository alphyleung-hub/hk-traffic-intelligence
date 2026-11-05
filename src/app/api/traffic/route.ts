import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.TRANSLINK_API_KEY; // Ensure you have RTDS access on this key
 
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing API Key" }, { status: 500 });
  }

  try {
    // Replace this URL with the exact RTDS endpoint from TransLink Developer docs
    const url = `https://api.translink.ca/rttiapi/v1/roads?apikey=${apiKey}`; 
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    
    if (!response.ok) throw new Error("Failed to fetch traffic");

    const data = await response.json();

    // Process the data to assign colors based on speed
    // Note: You must adapt this mapping to the actual JSON structure TransLink returns
    const features = data.map((segment: any) => {
      let color = "#3DDC97"; // Green (Free flow)
      if (segment.speed < 20) color = "#FF5D73"; // Red (Congested)
      else if (segment.speed < 40) color = "#FFC857"; // Yellow (Slow)

      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: segment.coordinates, // Assuming the API returns an array of [lng, lat]
        },
        properties: {
          id: segment.id,
          name: segment.roadName,
          speed: segment.speed,
          color: color,
        },
      };
    });

    return NextResponse.json({ ok: true, features });

  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to load traffic" }, { status: 500 });
  }
}