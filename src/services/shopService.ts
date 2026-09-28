import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Shop, ShopFilter, ShopInput } from '../types';

const LOCAL_STORAGE_KEY_SHOPS = 'cafe_app_shops';

// 初期サンプル店舗データ（初回訪問時や動作確認用）
const INITIAL_SHOPS: Shop[] = [
  {
    id: 'sample-shop-1',
    user_id: 'local-user',
    name: '自家焙煎 珈琲館 杜の香',
    status: 'visited',
    shop_status: 'open',
    use_type: 'both',
    area_id: 'area-1',
    address: '宮城県仙台市青葉区中央2丁目1-15',
    lat: 38.2605,
    lng: 140.8785,
    parking: 'nearby',
    parking_memo: '徒歩2分にコインパーキングあり（200円/30分）',
    shop_memo: 'ハンドドリップ珈琲が絶品。クラシックプリンが人気。席数は20席ほど。静かで落ち着いた雰囲気。',
    is_favorite: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    area: { id: 'area-1', user_id: 'local-user', name: '仙台駅周辺', created_at: '' },
    purposes: [
      { id: 'purpose-1', user_id: 'local-user', name: '夫と行きたい', created_at: '' },
      { id: 'purpose-3', user_id: 'local-user', name: '友達とカフェ', created_at: '' },
      { id: 'purpose-7', user_id: 'local-user', name: 'スイーツ巡り', created_at: '' },
    ],
    photos: [
      {
        id: 'p1',
        shop_id: 'sample-shop-1',
        storage_path: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        created_at: '',
      },
    ],
    visits: [
      {
        id: 'v1',
        shop_id: 'sample-shop-1',
        visited_at: '2026-08-15',
        rating: 3,
        food_eaten: '深煎りブレンドコーヒー、特製クラシックプリン',
        price: 1300,
        driver_id: 'person-1',
        staff_impression: 'マスターがとても物腰柔らかく丁寧な接客',
        my_impression: 'プリンのカラメルがほろ苦くて珈琲と相性抜群！カウンター席の居心地が最高でした。',
        want_to_revisit: true,
        created_at: '2026-08-15T14:30:00Z',
        updated_at: '2026-08-15T14:30:00Z',
        driver: { id: 'person-1', user_id: 'local-user', name: '夫', is_frequent: true, created_at: '' },
        companions: [
          { id: 'person-1', user_id: 'local-user', name: '夫', is_frequent: true, created_at: '' },
        ],
        photos: [
          {
            id: 'vp1',
            visit_id: 'v1',
            storage_path: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
            created_at: '',
          },
        ],
      },
    ],
  },
  {
    id: 'sample-shop-2',
    user_id: 'local-user',
    name: 'Bake & Tea Salon 一番町',
    status: 'visited',
    shop_status: 'open',
    use_type: 'sweets',
    area_id: 'area-2',
    address: '宮城県仙台市青葉区一番町3丁目8-1',
    lat: 38.2612,
    lng: 140.8715,
    parking: 'no',
    parking_memo: '専用駐車場なし。地下鉄青葉通一番町駅から徒歩3分',
    shop_memo: '季節のフルーツタルトと紅茶専門店。テラス席あり。土日は予約推奨。',
    is_favorite: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    area: { id: 'area-2', user_id: 'local-user', name: '一番町・国分町', created_at: '' },
    purposes: [
      { id: 'purpose-2', user_id: 'local-user', name: 'ともぴーと行きたい', created_at: '' },
      { id: 'purpose-7', user_id: 'local-user', name: 'スイーツ巡り', created_at: '' },
    ],
    photos: [
      {
        id: 'p2',
        shop_id: 'sample-shop-2',
        storage_path: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
        created_at: '',
      },
    ],
    visits: [
      {
        id: 'v2',
        shop_id: 'sample-shop-2',
        visited_at: '2026-09-02',
        rating: 3,
        food_eaten: 'いちじくとアールグレイのタルト、ロイヤルミルクティー',
        price: 1650,
        driver_id: null,
        staff_impression: '明るく笑顔で紅茶の説明をしてくれた',
        my_impression: 'ともぴーと一緒に訪問。タルト生地がサクサクで紅茶の香りが最高でした！',
        want_to_revisit: true,
        created_at: '2026-09-02T15:00:00Z',
        updated_at: '2026-09-02T15:00:00Z',
        driver: null,
        companions: [
          { id: 'person-2', user_id: 'local-user', name: 'ともぴー', is_frequent: true, created_at: '' },
        ],
        photos: [
          {
            id: 'vp2',
            visit_id: 'v2',
            storage_path: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
            created_at: '',
          },
        ],
      },
    ],
  },
  {
    id: 'sample-shop-3',
    user_id: 'local-user',
    name: '森のキッチンテラス 泉ボタニカル',
    status: 'want_to_go',
    shop_status: 'open',
    use_type: 'meal',
    area_id: 'area-3',
    address: '宮城県仙台市泉区福岡岳山9-8',
    lat: 38.3582,
    lng: 140.7321,
    parking: 'yes',
    parking_memo: '店前15台あり（無料）',
    shop_memo: '高原野菜の生パスタとガレットが有名らしい。緑に囲まれてロケーション抜群。ドライブで行きたい。',
    is_favorite: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    area: { id: 'area-3', user_id: 'local-user', name: '泉区', created_at: '' },
    purposes: [
      { id: 'purpose-1', user_id: 'local-user', name: '夫と行きたい', created_at: '' },
      { id: 'purpose-4', user_id: 'local-user', name: '友達と食事', created_at: '' },
    ],
    photos: [
      {
        id: 'p3',
        shop_id: 'sample-shop-3',
        storage_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        created_at: '',
      },
    ],
    visits: [],
  },
];

// ==========================================
// 店舗一覧取得
// ==========================================

export async function fetchShops(userId?: string): Promise<Shop[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          area:areas(*),
          purposes:shop_purposes(purpose:purposes(*)),
          photos:shop_photos(*),
          visits:visits(
            *,
            driver:persons!visits_driver_id_fkey(*),
            companions:visit_companions(person:persons(*)),
            photos:visit_photos(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // ネストされたデータの整形
        return data.map((item: any) => ({
          ...item,
          purposes: item.purposes?.map((p: any) => p.purpose).filter(Boolean) || [],
          visits: (item.visits || []).map((v: any) => ({
            ...v,
            companions: v.companions?.map((c: any) => c.person).filter(Boolean) || [],
          })),
        })) as Shop[];
      }
    } catch (e) {
      console.warn('Supabase fetchShops error, falling back to local storage:', e);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY_SHOPS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // JSON parse error
    }
  }

  // 初期データを保存して返却
  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(INITIAL_SHOPS));
  return INITIAL_SHOPS;
}

// ==========================================
// 単一店舗取得
// ==========================================

export async function fetchShopById(id: string, userId?: string): Promise<Shop | null> {
  const shops = await fetchShops(userId);
  return shops.find((s) => s.id === id) || null;
}


// ==========================================
// 店舗の作成
// ==========================================

export async function createShop(input: ShopInput, userId: string): Promise<Shop> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          user_id: userId,
          name: input.name,
          status: input.status,
          shop_status: input.shop_status,
          use_type: input.use_type,
          area_id: input.area_id,
          address: input.address,
          lat: input.lat,
          lng: input.lng,
          parking: input.parking,
          parking_memo: input.parking_memo,
          shop_memo: input.shop_memo,
          is_favorite: input.is_favorite,
        })
        .select()
        .single();

      if (!shopError && shopData) {
        const shopId = shopData.id;

        // 用途の関連付け
        if (input.purpose_ids && input.purpose_ids.length > 0) {
          const relations = input.purpose_ids.map((purpose_id) => ({
            shop_id: shopId,
            purpose_id,
          }));
          await supabase.from('shop_purposes').insert(relations);
        }

        // 写真の登録
        if (input.photo_urls && input.photo_urls.length > 0) {
          const photoRecords = input.photo_urls.map((storage_path) => ({
            shop_id: shopId,
            storage_path,
          }));
          await supabase.from('shop_photos').insert(photoRecords);
        }

        const fullShop = await fetchShopById(shopId, userId);
        if (fullShop) return fullShop;
      }
    } catch (e) {
      console.warn('Supabase createShop error, saving locally:', e);
    }
  }

  // ローカルストレージでの作成
  const shops = await fetchShops(userId);
  const newShopId = `shop-${Date.now()}`;
  const now = new Date().toISOString();

  const newShop: Shop = {
    id: newShopId,
    user_id: userId,
    name: input.name,
    status: input.status,
    shop_status: input.shop_status,
    use_type: input.use_type,
    area_id: input.area_id,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    parking: input.parking,
    parking_memo: input.parking_memo,
    shop_memo: input.shop_memo,
    is_favorite: input.is_favorite,
    created_at: now,
    updated_at: now,
    photos: (input.photo_urls || []).map((url, i) => ({
      id: `photo-${Date.now()}-${i}`,
      shop_id: newShopId,
      storage_path: url,
      created_at: now,
    })),
    visits: [],
  };

  const updated = [newShop, ...shops];
  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(updated));
  return newShop;
}

// ==========================================
// 店舗の更新
// ==========================================

export async function updateShop(
  id: string,
  input: Partial<ShopInput>,
  userId: string
): Promise<Shop> {
  if (isSupabaseConfigured && userId) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.shop_status !== undefined) updateData.shop_status = input.shop_status;
      if (input.use_type !== undefined) updateData.use_type = input.use_type;
      if (input.area_id !== undefined) updateData.area_id = input.area_id;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.lat !== undefined) updateData.lat = input.lat;
      if (input.lng !== undefined) updateData.lng = input.lng;
      if (input.parking !== undefined) updateData.parking = input.parking;
      if (input.parking_memo !== undefined) updateData.parking_memo = input.parking_memo;
      if (input.shop_memo !== undefined) updateData.shop_memo = input.shop_memo;
      if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite;

      await supabase.from('shops').update(updateData).eq('id', id);

      if (input.purpose_ids !== undefined) {
        await supabase.from('shop_purposes').delete().eq('shop_id', id);
        if (input.purpose_ids.length > 0) {
          const relations = input.purpose_ids.map((purpose_id) => ({
            shop_id: id,
            purpose_id,
          }));
          await supabase.from('shop_purposes').insert(relations);
        }
      }

      if (input.photo_urls !== undefined) {
        await supabase.from('shop_photos').delete().eq('shop_id', id);
        if (input.photo_urls.length > 0) {
          const photoRecords = input.photo_urls.map((storage_path) => ({
            shop_id: id,
            storage_path,
          }));
          await supabase.from('shop_photos').insert(photoRecords);
        }
      }

      const fullShop = await fetchShopById(id, userId);
      if (fullShop) return fullShop;
    } catch (e) {
      console.warn('Supabase updateShop error, updating locally:', e);
    }
  }

  const shops = await fetchShops(userId);
  const existing = shops.find((s) => s.id === id);
  if (!existing) {
    throw new Error('Shop not found');
  }

  const updatedShop: Shop = {
    ...existing,
    ...input,
    updated_at: new Date().toISOString(),
    photos:
      input.photo_urls !== undefined
        ? input.photo_urls.map((url, i) => ({
            id: `photo-${Date.now()}-${i}`,
            shop_id: id,
            storage_path: url,
            created_at: new Date().toISOString(),
          }))
        : existing.photos,
  };

  const updatedList = shops.map((s) => (s.id === id ? updatedShop : s));
  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(updatedList));
  return updatedShop;
}

// ==========================================
// お気に入りのトグル
// ==========================================

export async function toggleFavorite(id: string, current: boolean, userId: string): Promise<boolean> {
  const next = !current;
  await updateShop(id, { is_favorite: next }, userId);
  return next;
}

// ==========================================
// 店舗の削除
// ==========================================

export async function deleteShop(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && userId) {
    try {
      await supabase.from('shops').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteShop error:', e);
    }
  }

  const shops = await fetchShops(userId);
  const updated = shops.filter((s) => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(updated));
}

// ==========================================
// 店舗フィルター検索関数
// ==========================================

export function filterShops(shops: Shop[], filter: ShopFilter): Shop[] {
  return shops.filter((shop) => {
    // 検索テキスト（店舗名、住所、メモ、食べたもの）
    if (filter.searchText && filter.searchText.trim()) {
      const q = filter.searchText.trim().toLowerCase();
      const matchName = shop.name.toLowerCase().includes(q);
      const matchAddress = (shop.address || '').toLowerCase().includes(q);
      const matchMemo = (shop.shop_memo || '').toLowerCase().includes(q);
      const matchFood = (shop.visits || []).some((v) =>
        (v.food_eaten || '').toLowerCase().includes(q) ||
        (v.my_impression || '').toLowerCase().includes(q)
      );
      if (!matchName && !matchAddress && !matchMemo && !matchFood) {
        return false;
      }
    }

    // ステータス（訪問済み / 行きたい）
    if (filter.status && shop.status !== filter.status) {
      return false;
    }

    // 店舗状態（営業中 / 閉店 / 移転 / 不明）
    if (filter.shopStatus && shop.shop_status !== filter.shopStatus) {
      return false;
    }

    // 利用タイプ（食事 / スイーツ / 両方）
    if (filter.useType) {
      if (filter.useType === 'both') {
        if (shop.use_type !== 'both') return false;
      } else {
        if (shop.use_type !== filter.useType && shop.use_type !== 'both') {
          return false;
        }
      }
    }

    // エリア
    if (filter.areaId && shop.area_id !== filter.areaId) {
      return false;
    }

    // お気に入り
    if (filter.isFavorite && !shop.is_favorite) {
      return false;
    }

    // 用途
    if (filter.purposeId) {
      const hasPurpose = (shop.purposes || []).some((p) => p.id === filter.purposeId);
      if (!hasPurpose) return false;
    }

    // 同行者（訪問記録の同行者または運転者）
    if (filter.personId) {
      const hasPerson = (shop.visits || []).some((v) => {
        const isDriver = v.driver_id === filter.personId || v.driver?.id === filter.personId;
        const isCompanion = (v.companions || []).some((c) => c.id === filter.personId);
        return isDriver || isCompanion;
      });
      if (!hasPerson) return false;
    }

    return true;
  });
}
