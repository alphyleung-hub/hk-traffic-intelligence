"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import { CityMap } from "@/components/city-map"
import { LayerDock } from "@/components/layer-dock"
import { OpsHud } from "@/components/ops-hud"
import { useLiveJson } from "@/components/use-live-json"
import { useI18n } from "@/components/locale"
import { decorateControlPoints } from "@/lib/control-points"
import { kmbListFollowMs } from "@/lib/list-wait"
import { PLACE_POLL_MS, placePinZoom } from "@/lib/kmb-view"
import { PARKING_POLL_MS, type ParkReadingResponse } from "@/lib/parking"
import { KERB_POLL_MS, type KerbPlacesResponse } from "@/lib/kerb"
import { METER_POLL_MS, type MeterPlacesResponse } from "@/lib/meter-poles"
import type { ChargerPlacesResponse } from "@/lib/ev-chargers"
import { CHARGER_POLL_MS } from "@/lib/epd-chargers"
import { inLantau } from "@/lib/lantau"
import { CAMERA_LAYER_MS, WORKS_LAYER_MS } from "@/lib/picture"
import { mergePicture } from "@/lib/picture-join"
import { SPEED_CAM_POLL_MS, type SpeedCamResponse } from "@/lib/speed-cam"
import { boardFaultSnapshot, subscribeBoardFaults } from "@/lib/board-status"
import { catalogueBoards } from "@/lib/place-arrivals"
import { layersForIntel } from "@/lib/intel-focus"
import { INTEL_PHONE_QUERY, intelCardOpen, preferenceServerSnapshot, preferenceSnapshot, soleLayer, subscribePreferences, updatePreference } from "@/lib/preferences"
import { hkoLang } from "@/lib/i18n"
import { shareAddress, siteAddress } from "@/lib/share-link"
import { nextRoads } from "@/lib/traffic-join"
import { getTransLinkVehicles } from "@/lib/fetchTransLink"
import type {
  ApproachesResponse,
  CitybusPlacesResponse,
  ControlPointsResponse,
  FerryResponse,
  GmbPlacesResponse,
  IncidentsResponse,
  KmbPlacesResponse,
  LrtResponse,
  MtrResponse,
  NlbPlacesResponse,
  PictureResponse,
  TrafficResponse,
  TrafficSpeedReading,
  WarningsResponse,
  WatchLayer,
  WatchLayers,
  Basemap,
} from "@/lib/types"

export function Dashboard() {
  const { locale, messages: m } = useI18n()
  const search = useSearchParams()
  const forceDown = search.get("feed") === "down"
  const mapDown = search.get("map") === "down"
  const prefs = useSyncExternalStore(subscribePreferences, preferenceSnapshot, preferenceServerSnapshot)
  const phone = useSyncExternalStore(subscribeIntelPhone, intelPhoneNow, () => false)
  const [flyToken, setFlyToken] = useState(0)
  const [mapLive, setMapLive] = useState(!mapDown)
  const layers = prefs.layers
  const basemap = prefs.basemap
  
  // TransLink Vehicles
  const [transLinkVehicles, setTransLinkVehicles] = useState<any[]>([])
  useEffect(() => {
    let active = true
    const fetchData = async () => {
      const res = await getTransLinkVehicles()
      if (res.ok && res.vehicles && active) {
        setTransLinkVehicles(res.vehicles)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  // Traffic Lines (Speeds)
  const [trafficLines, setTrafficLines] = useState<any[]>([])
  useEffect(() => {
    let active = true
    const fetchTraffic = async () => {
      const res = await fetch("/api/traffic")
      const data = await res.json()
      if (data.ok && active && data.features) {
        setTrafficLines(data.features)
      }
    }
    fetchTraffic()
    const interval = setInterval(fetchTraffic, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  // DriveBC Road Events (Incidents)
  const [roadEvents, setRoadEvents] = useState<any>(null)
  useEffect(() => {
    let active = true
    const fetchRoadEvents = async () => {
      const res = await fetch("/api/drivebc")
      const data = await res.json()
      if (data.ok && active) {
        setRoadEvents({
          type: "FeatureCollection",
          features: data.features
        })
      }
    }
    fetchRoadEvents()
    const interval = setInterval(fetchRoadEvents, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  const [view, setView] = useState<{ lng: number; lat: number; zoom: number } | null>(null)
  const [only, setOnly] = useState(false)
  const intelChoice = prefs.intelOpen
  const intelOpen = intelCardOpen(phone, intelChoice)
  const boardFaults = useSyncExternalStore(subscribeBoardFaults, boardFaultSnapshot, boardFaultSnapshot)

  function setLayers(next: WatchLayers) { updatePreference({ layers: next }) }
  function focusIntel(next: any) {
    const opened = layersForIntel(next.layer, layers, only)
    if (opened.only !== only) setOnly(opened.only)
    if (opened.layers !== layers) setLayers(opened.layers)
  }
  function selectBasemap(next: Basemap) {
    if (next === "buildings") {
      updatePreference((current) => ({ basemap: current.basemap === "buildings" ? current.ground : "buildings" }))
      return
    }
    updatePreference({ basemap: next, ground: next })
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#061018]">
      <CityMap
        corridors={trafficLines} // Pass traffic lines here
        approaches={[]}
        picture={null}
        speedCams={null}
        incidents={roadEvents} // Pass incidents here
        controlPoints={null}
        mtr={null}
        mtrStations={null}
        kmb={null}
        lrt={null}
        citybus={null}
        gmb={null}
        nlb={null}
        mtrBus={null}
        ferry={null}
        parking={null}
        motorcycles={null}
        kerbs={null}
        meters={null}
        chargers={null}
        transLinkVehicles={transLinkVehicles}
        onView={setView}
        layers={layers}
        basemap={basemap}
        flyToken={flyToken}
        focus={null}
        disabled={mapDown}
        onMap={setMapLive}
      />
      <OpsHud
        traffic={{ ok: true, corridors: [], summary: { meanSpeedKmh: 50, free: 10, slow: 0, congested: 0 } } as any}
        trafficLoading={false}
        trafficError={null}
        approaches={null}
        incidents={null} // Hide alerts from ticker
        incidentsError={null}
        works={null}
        controlPoints={null}
        controlError={null}
        warnings={[]}
        warningsReady={true}
        warningsError={null}
        conditions={null}
        approachesError={null}
        mapLive={mapLive}
        pictureError={null}
        mtrError={null}
        kmbError={null}
        lrtError={null}
        citybusError={null}
        gmbError={null}
        nlbError={null}
        mtrBusError={null}
        ferryError={null}
        boardFaults={[]}
        
        // HIDE THE UPDATES PANEL
        open={false}
        choice={false}
        onOpenChange={() => {}}
        
        onFocus={focusIntel}
        view={view}
      />
      
      <p className="pointer-events-auto absolute bottom-1 left-2 z-30 max-w-[calc(100%-1rem)] bg-[#041018]/92 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.72rem] text-white sm:bottom-[0.4rem] sm:left-3 sm:whitespace-nowrap">
        {m.creditBy} <a href="https://www.linkedin.com/in/keithlihk" target="_blank" className="text-cyan-100 underline">{m.creditLinkedIn}</a> / <a href="https://github.com/keithligh" target="_blank" className="text-cyan-100 underline">{m.creditGitHub}</a> / <ShareSite label={m.share} copiedLabel={m.shared} title={m.productName} />
      </p>
      
      <LayerDock
        layers={layers} only={only} onOnly={setOnly} basemap={basemap}
        counts={{ speed: null, cameras: null, speedcam: null, works: null, tolls: null, incidents: null, mtr: null, kmb: null, lrt: null, citybus: null, gmb: null, nlb: null, mtrbus: null, ferry: null, parking: null, motorcycle: null, kerb: null, meter: null, charger: null, control: null }}
        onSetLayers={setLayers} onBasemap={selectBasemap} onReplay={() => setFlyToken(v => v + 1)} mapLive={mapLive}
        pictureError={null} speedCamError={null} mtrError={null} kmbError={null} lrtError={null} citybusError={null} gmbError={null} nlbError={null} mtrBusError={null} ferryError={null} parkingError={null} motorcycleError={null} kerbError={null} meterError={null} chargerError={null}
        aboveMarquee={true} // Changed since updates are hidden
      />
    </main>
  )
}

function subscribeIntelPhone(onChange: () => void) { const query = window.matchMedia(INTEL_PHONE_QUERY); query.addEventListener("change", onChange); return () => query.removeEventListener("change", onChange) }
function intelPhoneNow(): boolean { return window.matchMedia(INTEL_PHONE_QUERY).matches }
function ShareSite(props: { label: string; copiedLabel: string; title: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 2000); return () => window.clearTimeout(timer) }, [copied])
  return (
    <button type="button" aria-live="polite" onClick={() => {
      const url = siteAddress(window.location.href)
      const share = typeof navigator.share === "function" ? navigator.share.bind(navigator) : undefined
      const copy = typeof navigator.clipboard?.writeText === "function" ? (value: string) => navigator.clipboard.writeText(value) : undefined
      void shareAddress(url, props.title, { share, copy }).then((result) => { if (result === "copied") setCopied(true) })
    }} className="text-cyan-100 underline decoration-cyan-200/60 underline-offset-2">
      {copied ? props.copiedLabel : props.label}
    </button>
  )
}