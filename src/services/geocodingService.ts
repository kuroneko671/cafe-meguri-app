// ============================================================
// ジオコーディングサービス（Nominatim OpenStreetMap API）
// 住所から緯度・経度を取得
// ============================================================

export type GeocodingResult = {
  lat: number;
  lng: number;
  displayName: string;
};

/**
 * 住所から緯度・経度を取得する
 * @param address 検索する住所文字列
 * @returns 緯度・経度、または取得失敗時はnull
 */
export async function searchCoordinatesByAddress(
  address: string
): Promise<GeocodingResult | null> {
  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    // Nominatimの利用規約に沿い、format=jsonと適切なUser-Agent/Acceptヘッダーを指定
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&countrycodes=jp&limit=1`,
      {
        headers: {
          'Accept-Language': 'ja,en',
        },
      }
    );

    if (!response.ok) {
      console.warn('Geocoding request failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
}

/**
 * 店舗名からGoogle検索URLを生成する
 * （Google Maps APIは使用せず、通常のGoogle検索URLを開く仕様）
 * @param shopName 店舗名
 * @param address 住所（任意、より正確な検索用）
 * @returns Google検索URL
 */
export function generateGoogleSearchUrl(shopName: string, address?: string | null): string {
  const queryParts = [shopName.trim()];
  if (address && address.trim()) {
    // 住所の市区町村程度を付加して精度向上
    queryParts.push(address.trim());
  }
  const query = encodeURIComponent(queryParts.join(' '));
  return `https://www.google.com/search?q=${query}`;
}
