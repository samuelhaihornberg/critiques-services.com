import { useEffect, useRef } from 'react'

export default function LeafletMap({ 
  center, 
  zoom, 
  markerPosition, 
  onMapClick, 
  onMoveEnd,
  readOnly = false 
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!window.L || initialized.current) return
    
    const map = window.L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      boxZoom: !readOnly,
      keyboard: !readOnly,
      dragging: !readOnly,
      tap: !readOnly
    })
    
    mapInstance.current = map
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)
    
    if (!readOnly) {
      map.on('click', (e) => {
        onMapClick(e)
      })
      
      map.on('moveend', () => {
        const c = map.getCenter()
        onMoveEnd({ lat: c.lat, lng: c.lng }, map.getZoom())
      })
    }
    
    if (markerPosition) {
      const markerIcon = window.L.divIcon({
        className: 'custom-marker',
        html: '<div class="marker-pin"><span>📍</span></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
      
      markerRef.current = window.L.marker([markerPosition.lat, markerPosition.lng], {
        icon: markerIcon,
        draggable: !readOnly
      }).addTo(map)
      
      if (!readOnly) {
        markerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng()
          onMapClick({ latlng: pos })
        })
      }
    }
    
    initialized.current = true
    
    return () => {
      map.off()
      map.remove()
      initialized.current = false
      mapInstance.current = null
      markerRef.current = null
    }
  }, [center, zoom, markerPosition, onMapClick, onMoveEnd, readOnly])

  useEffect(() => {
    if (!mapInstance.current || !center) return
    mapInstance.current.setView([center.lat, center.lng], zoom, { animate: true })
  }, [center, zoom])

  useEffect(() => {
    if (!mapInstance.current || !markerRef.current || !markerPosition) return
    markerRef.current.setLatLng([markerPosition.lat, markerPosition.lng])
  }, [markerPosition])

  return <div ref={mapRef} className="leaflet-map" style={{ height: '100%', width: '100%' }} />
}