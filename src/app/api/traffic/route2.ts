import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  // In a real app, you would fetch from TomTom, HERE, or a commercial API.
  // Since TransLink retired RTTI, we simulate realistic data here.
  
  // Major roads in Vancouver (Coordinates for demonstration)
  const mockRoads = [
    {
      id: "hwy-1",
      name: "Trans-Canada Hwy",
      coordinates: [
        [-123.050, 49.285], [-123.020, 49.280], [-122.990, 49.275]
      ],
      speed: 80, // Green
    },
    {
      id: "kingsway",
      name: "Kingsway",
      coordinates: [
        [-123.090, 49.260], [-123.060, 49.255], [-123.030, 49.250]
      ],
      speed: 30, // Yellow
    },
    {
      id: "granville",
      name: "Granville St",
      coordinates: [
        [-123.140, 49.260], [-123.135, 49.240], [-123.130, 49.220]
      ],
      speed: 10, // Red
    }
  ];

  const features = mockRoads.map((road) => {
    let color = "#3DDC97"; // Green
    if (road.speed < 20) color = "#FF5D73"; // Red
    else if (road.speed < 50) color = "#FFC857"; // Yellow

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: road.coordinates,
      },
      properties: {
        id: road.id,
        name: road.name,
        speed: road.speed,
        color: color,
      },
    };
  });

  return NextResponse.json({ ok: true, features });
}