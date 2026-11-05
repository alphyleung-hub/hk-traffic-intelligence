import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current_weather=true&timezone=America%2FVancouver");
    const data = await res.json();
    
    return NextResponse.json({
      ok: true,
      warnings: [],
      conditions: {
        temperature: data.current_weather.temperature,
        humidity: 50, 
        rainfall: data.current_weather.rain || 0
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to fetch weather" }, { status: 500 });
  }
}