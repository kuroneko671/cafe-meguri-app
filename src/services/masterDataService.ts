import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Area, Purpose, Person } from '../types';

// 初期マスターデータ（新規作成時やローカル用のデフォルト値）
const DEFAULT_AREAS = [
  '仙台駅周辺',
  '一番町・国分町',
  '泉区',
  '青葉区（その他）',
  '宮城野区・若林区・太白区',
  '名取・岩沼',
  '富谷・大和',
  '山形市',
  'その他',
];

const DEFAULT_PURPOSES = [
  '夫と行きたい',
  'ともぴーと行きたい',
  '友達とカフェ',
  '友達と食事',
  '飲みに行きたい',
  'ひとりで行きたい',
  'スイーツ巡り',
  '作業・読書',
];

const DEFAULT_PERSONS = [
  { name: '夫', is_frequent: true },
  { name: 'ともぴー', is_frequent: true },
  { name: '友人A', is_frequent: false },
  { name: '友人B', is_frequent: false },
];

const LOCAL_STORAGE_KEYS = {
  AREAS: 'cafe_app_areas',
  PURPOSES: 'cafe_app_purposes',
  PERSONS: 'cafe_app_persons',
};

// UUID検証用ヘルパー
export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ==========================================
// エリア (Areas)
// ==========================================

export async function fetchAreas(userId?: string): Promise<Area[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Area[];
      }

      // 初回でSupabase側にデータが0件の場合、デフォルトデータを自動登録（シード）
      if (!error && data && data.length === 0) {
        const seedData = DEFAULT_AREAS.map((name) => ({
          user_id: userId,
          name,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('areas')
          .insert(seedData)
          .select();

        if (!insertError && inserted && inserted.length > 0) {
          return inserted as Area[];
        }
      }
    } catch (e) {
      console.warn('Supabase fetchAreas error, falling back to local storage:', e);
    }
  }

  // ローカルストレージからのフォールバック
  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.AREAS);
  if (local) {
    return JSON.parse(local);
  }

  // 初期シードデータ
  const initialAreas: Area[] = DEFAULT_AREAS.map((name, index) => ({
    id: `area-${index + 1}`,
    user_id: userId || 'local-user',
    name,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(initialAreas));
  return initialAreas;
}

export async function createArea(name: string, userId: string): Promise<Area> {
  const trimmed = name.trim();
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase
      .from('areas')
      .insert({ name: trimmed, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      return data as Area;
    }
    if (error) {
      console.error('Supabase createArea error:', error);
      throw new Error(error.message);
    }
  }

  const areas = await fetchAreas(userId);
  const existing = areas.find((a) => a.name === trimmed);
  if (existing) return existing;

  const newArea: Area = {
    id: `area-${Date.now()}`,
    user_id: userId,
    name: trimmed,
    created_at: new Date().toISOString(),
  };
  const updated = [...areas, newArea];
  localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
  return newArea;
}

export async function deleteArea(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && userId && isValidUUID(id)) {
    await supabase.from('areas').delete().eq('id', id);
  }
  const areas = await fetchAreas(userId);
  const updated = areas.filter((a) => a.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
}

// ==========================================
// 用途 (Purposes)
// ==========================================

export async function fetchPurposes(userId?: string): Promise<Purpose[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('purposes')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Purpose[];
      }

      // 初回でSupabase側にデータが0件の場合、デフォルトデータを自動登録（シード）
      if (!error && data && data.length === 0) {
        const seedData = DEFAULT_PURPOSES.map((name) => ({
          user_id: userId,
          name,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('purposes')
          .insert(seedData)
          .select();

        if (!insertError && inserted && inserted.length > 0) {
          return inserted as Purpose[];
        }
      }
    } catch (e) {
      console.warn('Supabase fetchPurposes error, falling back to local storage:', e);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.PURPOSES);
  if (local) {
    return JSON.parse(local);
  }

  const initialPurposes: Purpose[] = DEFAULT_PURPOSES.map((name, index) => ({
    id: `purpose-${index + 1}`,
    user_id: userId || 'local-user',
    name,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(LOCAL_STORAGE_KEYS.PURPOSES, JSON.stringify(initialPurposes));
  return initialPurposes;
}

export async function createPurpose(name: string, userId: string): Promise<Purpose> {
  const trimmed = name.trim();
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase
      .from('purposes')
      .insert({ name: trimmed, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      return data as Purpose;
    }
    if (error) {
      console.error('Supabase createPurpose error:', error);
      throw new Error(error.message);
    }
  }

  const purposes = await fetchPurposes(userId);
  const existing = purposes.find((p) => p.name === trimmed);
  if (existing) return existing;

  const newPurpose: Purpose = {
    id: `purpose-${Date.now()}`,
    user_id: userId,
    name: trimmed,
    created_at: new Date().toISOString(),
  };
  const updated = [...purposes, newPurpose];
  localStorage.setItem(LOCAL_STORAGE_KEYS.PURPOSES, JSON.stringify(updated));
  return newPurpose;
}

export async function deletePurpose(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && userId && isValidUUID(id)) {
    await supabase.from('purposes').delete().eq('id', id);
  }
  const purposes = await fetchPurposes(userId);
  const updated = purposes.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.PURPOSES, JSON.stringify(updated));
}

// ==========================================
// 人物 (Persons)
// ==========================================

export async function fetchPersons(userId?: string): Promise<Person[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('is_frequent', { ascending: false })
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Person[];
      }

      // 初回でSupabase側にデータが0件の場合、デフォルトデータを自動登録（シード）
      if (!error && data && data.length === 0) {
        const seedData = DEFAULT_PERSONS.map((item) => ({
          user_id: userId,
          name: item.name,
          is_frequent: item.is_frequent,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('persons')
          .insert(seedData)
          .select();

        if (!insertError && inserted && inserted.length > 0) {
          return inserted as Person[];
        }
      }
    } catch (e) {
      console.warn('Supabase fetchPersons error, falling back to local storage:', e);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.PERSONS);
  if (local) {
    return JSON.parse(local);
  }

  const initialPersons: Person[] = DEFAULT_PERSONS.map((item, index) => ({
    id: `person-${index + 1}`,
    user_id: userId || 'local-user',
    name: item.name,
    is_frequent: item.is_frequent,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONS, JSON.stringify(initialPersons));
  return initialPersons;
}

export async function createPerson(
  name: string,
  isFrequent: boolean,
  userId: string
): Promise<Person> {
  const trimmed = name.trim();
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase
      .from('persons')
      .insert({ name: trimmed, is_frequent: isFrequent, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      return data as Person;
    }
    if (error) {
      console.error('Supabase createPerson error:', error);
      throw new Error(error.message);
    }
  }

  const persons = await fetchPersons(userId);
  const existing = persons.find((p) => p.name === trimmed);
  if (existing) return existing;

  const newPerson: Person = {
    id: `person-${Date.now()}`,
    user_id: userId,
    name: trimmed,
    is_frequent: isFrequent,
    created_at: new Date().toISOString(),
  };
  const updated = [...persons, newPerson];
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONS, JSON.stringify(updated));
  return newPerson;
}

export async function updatePerson(
  id: string,
  updates: Partial<Pick<Person, 'name' | 'is_frequent'>>,
  userId: string
): Promise<void> {
  if (isSupabaseConfigured && userId && isValidUUID(id)) {
    await supabase.from('persons').update(updates).eq('id', id);
  }
  const persons = await fetchPersons(userId);
  const updated = persons.map((p) => (p.id === id ? { ...p, ...updates } : p));
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONS, JSON.stringify(updated));
}

export async function deletePerson(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && userId && isValidUUID(id)) {
    await supabase.from('persons').delete().eq('id', id);
  }
  const persons = await fetchPersons(userId);
  const updated = persons.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONS, JSON.stringify(updated));
}
