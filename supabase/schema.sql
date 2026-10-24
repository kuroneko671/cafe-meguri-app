-- ============================================================
-- カフェめぐりアプリ: 完全データベーススキーマ & RLS設定
-- Supabaseの SQL Editor に貼り付けて「RUN」を実行してください
-- ============================================================

-- ------------------------------------------------------------
-- 1. テーブル作成 (全9テーブル)
-- ------------------------------------------------------------

-- (1) エリアマスター
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (2) 用途マスター
CREATE TABLE IF NOT EXISTS purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (3) 人物マスター (同行者・運転者)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_frequent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (4) 店舗基本情報
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visited', 'want_to_go')),
  shop_status TEXT NOT NULL DEFAULT 'open' CHECK (shop_status IN ('open', 'closed', 'moved', 'unknown')),
  use_type TEXT NOT NULL DEFAULT 'both' CHECK (use_type IN ('meal', 'sweets', 'both')),
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  parking TEXT DEFAULT 'unknown' CHECK (parking IN ('yes', 'no', 'partner', 'nearby', 'unknown')),
  parking_memo TEXT,
  shop_memo TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (5) 店舗と用途の中間テーブル
CREATE TABLE IF NOT EXISTS shop_purposes (
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  purpose_id UUID NOT NULL REFERENCES purposes(id) ON DELETE CASCADE,
  PRIMARY KEY (shop_id, purpose_id)
);

-- (6) 店舗写真
CREATE TABLE IF NOT EXISTS shop_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (7) 訪問記録
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  visited_at DATE,
  rating SMALLINT CHECK (rating IN (1, 2, 3)),
  food_eaten TEXT,
  price INTEGER,
  driver_id UUID,
  staff_impression TEXT,
  my_impression TEXT,
  want_to_revisit BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT visits_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES persons(id) ON DELETE SET NULL
);

-- (8) 訪問記録と同伴者の中間テーブル
CREATE TABLE IF NOT EXISTS visit_companions (
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (visit_id, person_id)
);

-- (9) 訪問写真
CREATE TABLE IF NOT EXISTS visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. パフォーマンス向上用インデックス作成
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas(user_id);
CREATE INDEX IF NOT EXISTS idx_purposes_user_id ON purposes(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_area_id ON shops(area_id);
CREATE INDEX IF NOT EXISTS idx_visits_shop_id ON visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_visits_driver_id ON visits(driver_id);
CREATE INDEX IF NOT EXISTS idx_shop_photos_shop_id ON shop_photos(shop_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_visit_id ON visit_photos(visit_id);

-- ------------------------------------------------------------
-- 3. 全テーブルで RLS（Row Level Security）を有効化
-- ------------------------------------------------------------
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. RLS ポリシー設定 (本人のみアクセス許可)
-- ------------------------------------------------------------

-- (1) areas
DROP POLICY IF EXISTS "areas_owner_policy" ON areas;
CREATE POLICY "areas_owner_policy" ON areas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (2) purposes
DROP POLICY IF EXISTS "purposes_owner_policy" ON purposes;
CREATE POLICY "purposes_owner_policy" ON purposes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (3) persons
DROP POLICY IF EXISTS "persons_owner_policy" ON persons;
CREATE POLICY "persons_owner_policy" ON persons
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (4) shops
DROP POLICY IF EXISTS "shops_owner_policy" ON shops;
CREATE POLICY "shops_owner_policy" ON shops
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (5) shop_purposes (shopsの所有者のみ)
DROP POLICY IF EXISTS "shop_purposes_owner_policy" ON shop_purposes;
CREATE POLICY "shop_purposes_owner_policy" ON shop_purposes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_purposes.shop_id
        AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_purposes.shop_id
        AND shops.user_id = auth.uid()
    )
  );

-- (6) shop_photos (shopsの所有者のみ)
DROP POLICY IF EXISTS "shop_photos_owner_policy" ON shop_photos;
CREATE POLICY "shop_photos_owner_policy" ON shop_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_photos.shop_id
        AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_photos.shop_id
        AND shops.user_id = auth.uid()
    )
  );

-- (7) visits (shopsの所有者のみ)
DROP POLICY IF EXISTS "visits_owner_policy" ON visits;
CREATE POLICY "visits_owner_policy" ON visits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = visits.shop_id
        AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = visits.shop_id
        AND shops.user_id = auth.uid()
    )
  );

-- (8) visit_companions (visits経由でshopsの所有者のみ)
DROP POLICY IF EXISTS "visit_companions_owner_policy" ON visit_companions;
CREATE POLICY "visit_companions_owner_policy" ON visit_companions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      JOIN shops ON shops.id = visits.shop_id
      WHERE visits.id = visit_companions.visit_id
        AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      JOIN shops ON shops.id = visits.shop_id
      WHERE visits.id = visit_companions.visit_id
        AND shops.user_id = auth.uid()
    )
  );

-- (9) visit_photos (visits経由でshopsの所有者のみ)
DROP POLICY IF EXISTS "visit_photos_owner_policy" ON visit_photos;
CREATE POLICY "visit_photos_owner_policy" ON visit_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      JOIN shops ON shops.id = visits.shop_id
      WHERE visits.id = visit_photos.visit_id
        AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      JOIN shops ON shops.id = visits.shop_id
      WHERE visits.id = visit_photos.visit_id
        AND shops.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. Storage (写真保存用バケット: cafe-photos) の作成 & RLS設定
-- ------------------------------------------------------------

-- バケット cafe-photos を作成（存在しない場合のみ、非公開バケット）
INSERT INTO storage.buckets (id, name, public)
VALUES ('cafe-photos', 'cafe-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage用ポリシー: 自分のフォルダ (auth.uid()/...) のみ読み書き許可
DROP POLICY IF EXISTS "cafe_photos_select_policy" ON storage.objects;
CREATE POLICY "cafe_photos_select_policy" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'cafe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "cafe_photos_insert_policy" ON storage.objects;
CREATE POLICY "cafe_photos_insert_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cafe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "cafe_photos_delete_policy" ON storage.objects;
CREATE POLICY "cafe_photos_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cafe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
