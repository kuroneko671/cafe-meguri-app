import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Visit } from '../types';
import { fetchShops } from './shopService';
import { isValidUUID } from './masterDataService';

const LOCAL_STORAGE_KEY_SHOPS = 'cafe_app_shops';

export type VisitInput = {
  shop_id: string;
  visited_at: string | null;
  rating: 1 | 2 | 3 | null;
  food_eaten: string | null;
  price: number | null;
  driver_id: string | null;
  staff_impression: string | null;
  my_impression: string | null;
  want_to_revisit: boolean | null;
  companion_ids?: string[];
  photo_urls?: string[];
};

// ==========================================
// 訪問記録の作成
// ==========================================

export async function createVisit(input: VisitInput, userId: string): Promise<Visit> {
  // Supabase動作モード
  if (isSupabaseConfigured && userId && isValidUUID(input.shop_id)) {
    // driver_idが正規のUUIDでない場合はnullにする（安全ガード）
    const validDriverId = isValidUUID(input.driver_id) ? input.driver_id : null;

    const { data: visitData, error: visitError } = await supabase
      .from('visits')
      .insert({
        shop_id: input.shop_id,
        visited_at: input.visited_at || null,
        rating: input.rating,
        food_eaten: input.food_eaten,
        price: input.price,
        driver_id: validDriverId,
        staff_impression: input.staff_impression,
        my_impression: input.my_impression,
        want_to_revisit: input.want_to_revisit,
      })
      .select()
      .single();

    if (visitError) {
      console.error('Supabase createVisit error:', visitError);
      throw new Error(`訪問記録の登録に失敗しました: ${visitError.message}`);
    }

    if (visitData) {
      const visitId = visitData.id;

      // 同行者の関連付け（有効なUUIDのみ登録）
      const validCompanionIds = (input.companion_ids || []).filter(isValidUUID);
      if (validCompanionIds.length > 0) {
        const companionRecords = validCompanionIds.map((person_id) => ({
          visit_id: visitId,
          person_id,
        }));
        const { error: compError } = await supabase.from('visit_companions').insert(companionRecords);
        if (compError) {
          console.warn('visit_companions insert error:', compError);
        }
      }

      // 写真の登録
      if (input.photo_urls && input.photo_urls.length > 0) {
        const photoRecords = input.photo_urls.map((storage_path) => ({
          visit_id: visitId,
          storage_path,
        }));
        const { error: photoError } = await supabase.from('visit_photos').insert(photoRecords);
        if (photoError) {
          console.warn('visit_photos insert error:', photoError);
        }
      }

      // 店舗のステータスを「visited」に更新
      await supabase
        .from('shops')
        .update({ status: 'visited', updated_at: new Date().toISOString() })
        .eq('id', input.shop_id);

      return visitData as Visit;
    }
  }

  // ローカルストレージでの訪問記録作成（フォールバックまたは非Supabase環境）
  const shops = await fetchShops(userId);
  const now = new Date().toISOString();
  const newVisitId = `visit-${Date.now()}`;

  const newVisit: Visit = {
    id: newVisitId,
    shop_id: input.shop_id,
    visited_at: input.visited_at,
    rating: input.rating,
    food_eaten: input.food_eaten,
    price: input.price,
    driver_id: input.driver_id,
    staff_impression: input.staff_impression,
    my_impression: input.my_impression,
    want_to_revisit: input.want_to_revisit,
    created_at: now,
    updated_at: now,
    photos: (input.photo_urls || []).map((url, i) => ({
      id: `vphoto-${Date.now()}-${i}`,
      visit_id: newVisitId,
      storage_path: url,
      created_at: now,
    })),
  };

  const updatedShops = shops.map((shop) => {
    if (shop.id === input.shop_id) {
      const currentVisits = shop.visits || [];
      return {
        ...shop,
        status: 'visited' as const, // 自動的に訪問済みに変更
        visits: [newVisit, ...currentVisits],
        updated_at: now,
      };
    }
    return shop;
  });

  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(updatedShops));
  return newVisit;
}

// ==========================================
// 訪問記録の削除
// ==========================================

export async function deleteVisit(visitId: string, shopId: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && userId && isValidUUID(visitId)) {
    const { error } = await supabase.from('visits').delete().eq('id', visitId);
    if (error) {
      console.error('Supabase deleteVisit error:', error);
      throw new Error(`訪問記録の削除に失敗しました: ${error.message}`);
    }
  }

  const shops = await fetchShops(userId);
  const updatedShops = shops.map((shop) => {
    if (shop.id === shopId) {
      const remainingVisits = (shop.visits || []).filter((v) => v.id !== visitId);
      return {
        ...shop,
        visits: remainingVisits,
        updated_at: new Date().toISOString(),
      };
    }
    return shop;
  });

  localStorage.setItem(LOCAL_STORAGE_KEY_SHOPS, JSON.stringify(updatedShops));
}
