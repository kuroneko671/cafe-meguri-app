import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shop } from '../types';
import { STATUS_LABELS, USE_TYPE_LABELS, RATING_LABELS } from '../types';
import { generateGoogleSearchUrl } from '../services/geocodingService';
import './MapComponent.css';

// Leafletのデフォルトマーカーアイコン設定
const visitedIcon = L.divIcon({
  className: 'custom-map-pin visited-pin',
  html: `<div class="pin-marker visited"><span class="pin-icon">☕</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

const wantToGoIcon = L.divIcon({
  className: 'custom-map-pin want-pin',
  html: `<div class="pin-marker want"><span class="pin-icon">✨</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

// 地図の中心・ズームを店舗マーカーに合わせて自動調整するヘルパー
function MapAutoBounds({ shops }: { shops: Shop[] }) {
  const map = useMap();

  useEffect(() => {
    const validShops = shops.filter((s) => s.lat != null && s.lng != null);
    if (validShops.length === 0) return;

    if (validShops.length === 1) {
      const s = validShops[0];
      map.setView([s.lat!, s.lng!], 15);
    } else {
      const bounds = L.latLngBounds(
        validShops.map((s) => [s.lat!, s.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [shops, map]);

  return null;
}

type MapComponentProps = {
  shops: Shop[];
  onSelectShop: (shop: Shop) => void;
};

export const MapComponent = ({ shops, onSelectShop }: MapComponentProps) => {
  // 座標がある店舗のみ抽出
  const mappableShops = shops.filter(
    (s) => s.lat != null && s.lng != null && !isNaN(s.lat) && !isNaN(s.lng)
  );

  // 初期中心位置（仙台駅周辺をデフォルト）
  const defaultCenter: [number, number] = [38.2601, 140.8824];

  return (
    <div className="map-wrapper">
      {mappableShops.length === 0 && (
        <div className="map-overlay-notice">
          📍 座標が登録されている店舗がありません。店舗編集から「住所から座標取得」を行ってください。
        </div>
      )}

      <MapContainer
        center={
          mappableShops.length > 0
            ? [mappableShops[0].lat!, mappableShops[0].lng!]
            : defaultCenter
        }
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-full-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoBounds shops={mappableShops} />

        {mappableShops.map((shop) => {
          const icon = shop.status === 'visited' ? visitedIcon : wantToGoIcon;
          const latestVisit = shop.visits && shop.visits.length > 0 ? shop.visits[0] : null;
          const photo =
            shop.photos && shop.photos.length > 0 ? shop.photos[0].storage_path : null;
          const googleUrl = generateGoogleSearchUrl(shop.name, shop.address);

          return (
            <Marker
              key={shop.id}
              position={[shop.lat!, shop.lng!]}
              icon={icon}
            >
              <Popup className="custom-shop-popup">
                <div className="map-popup-card">
                  {photo && (
                    <img src={photo} alt={shop.name} className="map-popup-img" />
                  )}
                  <div className="map-popup-content">
                    <div className="map-popup-badges">
                      <span className={`status-badge status-${shop.status}`}>
                        {STATUS_LABELS[shop.status]}
                      </span>
                      <span className="meta-tag">🍴 {USE_TYPE_LABELS[shop.use_type]}</span>
                    </div>

                    <h4 className="map-popup-title">{shop.name}</h4>

                    {shop.area && (
                      <p className="map-popup-area">📍 {shop.area.name}</p>
                    )}

                    {latestVisit?.rating && (
                      <p className="map-popup-rating">
                        評価: {RATING_LABELS[latestVisit.rating]}
                      </p>
                    )}

                    <div className="map-popup-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectShop(shop)}
                      >
                        詳細を見る
                      </button>
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Googleで店舗を検索"
                      >
                        Google検索 ↗
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
