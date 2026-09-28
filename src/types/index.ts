// ============================================================
// カフェ・飲食店巡り記録アプリ 型定義
// ============================================================

export type Area = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Purpose = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Person = {
  id: string;
  user_id: string;
  name: string;
  is_frequent: boolean;
  created_at: string;
};

export type ShopStatus = 'visited' | 'want_to_go';
export type ShopCondition = 'open' | 'closed' | 'moved' | 'unknown';
export type UseType = 'meal' | 'sweets' | 'both';
export type ParkingType = 'yes' | 'no' | 'partner' | 'nearby' | 'unknown';

export type ShopInput = {
  name: string;
  status: ShopStatus;
  shop_status: ShopCondition;
  use_type: UseType;
  area_id: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  parking: ParkingType | null;
  parking_memo: string | null;
  shop_memo: string | null;
  is_favorite: boolean;
  purpose_ids?: string[];
  photo_urls?: string[];
};

export type Shop = {
  id: string;
  user_id: string;
  name: string;
  status: ShopStatus;
  shop_status: ShopCondition;
  use_type: UseType;
  area_id: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  parking: ParkingType | null;
  parking_memo: string | null;
  shop_memo: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // JOINデータ（クエリ時に付加）
  area?: Area | null;
  purposes?: Purpose[];
  photos?: ShopPhoto[];
  visits?: Visit[];
};

export type ShopPhoto = {
  id: string;
  shop_id: string;
  storage_path: string;
  created_at: string;
};

export type Visit = {
  id: string;
  shop_id: string;
  visited_at: string | null;
  rating: 1 | 2 | 3 | null;
  food_eaten: string | null;
  price: number | null;
  driver_id: string | null;
  staff_impression: string | null;
  my_impression: string | null;
  want_to_revisit: boolean | null;
  created_at: string;
  updated_at: string;
  // JOINデータ
  driver?: Person | null;
  companions?: Person[];
  photos?: VisitPhoto[];
};

export type VisitPhoto = {
  id: string;
  visit_id: string;
  storage_path: string;
  created_at: string;
};

// フィルター条件
export type ShopFilter = {
  searchText: string;
  status: ShopStatus | '';
  shopStatus: ShopCondition | '';
  useType: UseType | '';
  areaId: string;
  purposeId: string;
  personId: string;
  isFavorite: boolean;
};

// ラベル変換用定数
export const STATUS_LABELS: Record<ShopStatus, string> = {
  visited: '訪問済み',
  want_to_go: '行きたい',
};

export const SHOP_CONDITION_LABELS: Record<ShopCondition, string> = {
  open: '営業中',
  closed: '閉店',
  moved: '移転',
  unknown: '不明',
};

export const USE_TYPE_LABELS: Record<UseType, string> = {
  meal: '食事',
  sweets: 'スイーツ・軽食',
  both: '両方',
};

export const PARKING_LABELS: Record<ParkingType, string> = {
  yes: 'あり',
  no: 'なし',
  partner: '提携あり',
  nearby: '近隣コインパーキング',
  unknown: '不明',
};

export const RATING_LABELS: Record<number, string> = {
  1: '★',
  2: '★★',
  3: '★★★',
};
