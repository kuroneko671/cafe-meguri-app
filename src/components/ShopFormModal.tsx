import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Shop, ShopInput, Area, Purpose, ShopStatus, ShopCondition, UseType, ParkingType } from '../types';
import { searchCoordinatesByAddress } from '../services/geocodingService';
import { createArea, createPurpose } from '../services/masterDataService';
import './Modal.css';

type ShopFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShopInput) => Promise<void>;
  initialData?: Shop | null;
  areas: Area[];
  purposes: Purpose[];
  userId: string;
  onAreaCreated: (newArea: Area) => void;
  onPurposeCreated: (newPurpose: Purpose) => void;
};

export const ShopFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  areas,
  purposes,
  userId,
  onAreaCreated,
  onPurposeCreated,
}: ShopFormModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ShopStatus>('want_to_go');
  const [shopStatus, setShopStatus] = useState<ShopCondition>('open');
  const [useType, setUseType] = useState<UseType>('sweets');
  const [areaId, setAreaId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [parking, setParking] = useState<ParkingType>('unknown');
  const [parkingMemo, setParkingMemo] = useState('');
  const [shopMemo, setShopMemo] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPurposeIds, setSelectedPurposeIds] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');

  // 新規エリア・用途のインライン作成用
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [isAddingPurpose, setIsAddingPurpose] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');

  // ジオコーディングローディング
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setStatus(initialData.status || 'want_to_go');
      setShopStatus(initialData.shop_status || 'open');
      setUseType(initialData.use_type || 'sweets');
      setAreaId(initialData.area_id || '');
      setAddress(initialData.address || '');
      setLat(initialData.lat || null);
      setLng(initialData.lng || null);
      setParking(initialData.parking || 'unknown');
      setParkingMemo(initialData.parking_memo || '');
      setShopMemo(initialData.shop_memo || '');
      setIsFavorite(Boolean(initialData.is_favorite));
      setSelectedPurposeIds((initialData.purposes || []).map((p) => p.id));
      setPhotoUrl(initialData.photos && initialData.photos.length > 0 ? initialData.photos[0].storage_path : '');
    } else {
      setName('');
      setStatus('want_to_go');
      setShopStatus('open');
      setUseType('sweets');
      setAreaId(areas.length > 0 ? areas[0].id : '');
      setAddress('');
      setLat(null);
      setLng(null);
      setParking('unknown');
      setParkingMemo('');
      setShopMemo('');
      setIsFavorite(false);
      setSelectedPurposeIds([]);
      setPhotoUrl('');
    }
    setGeocodeMessage(null);
  }, [initialData, isOpen, areas]);

  if (!isOpen) return null;

  // 住所から緯度経度を取得
  const handleGeocode = async () => {
    if (!address.trim()) {
      setGeocodeMessage('住所を入力してください');
      return;
    }
    setIsGeocoding(true);
    setGeocodeMessage(null);
    try {
      const res = await searchCoordinatesByAddress(address);
      if (res) {
        setLat(res.lat);
        setLng(res.lng);
        setGeocodeMessage(`座標を取得しました: 緯度 ${res.lat.toFixed(4)}, 経度 ${res.lng.toFixed(4)}`);
      } else {
        setGeocodeMessage('住所から座標を特定できませんでした。住所を詳しく入力するか、地図上で確認してください。');
      }
    } catch {
      setGeocodeMessage('座標取得中にエラーが発生しました');
    } finally {
      setIsGeocoding(false);
    }
  };

  // 新規エリア追加
  const handleCreateArea = async () => {
    if (!newAreaName.trim()) return;
    const created = await createArea(newAreaName, userId);
    onAreaCreated(created);
    setAreaId(created.id);
    setNewAreaName('');
    setIsAddingArea(false);
  };

  // 新規用途追加
  const handleCreatePurpose = async () => {
    if (!newPurposeName.trim()) return;
    const created = await createPurpose(newPurposeName, userId);
    onPurposeCreated(created);
    setSelectedPurposeIds((prev) => [...prev, created.id]);
    setNewPurposeName('');
    setIsAddingPurpose(false);
  };

  const handlePurposeToggle = (pId: string) => {
    setSelectedPurposeIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const input: ShopInput = {
        name: name.trim(),
        status,
        shop_status: shopStatus,
        use_type: useType,
        area_id: areaId || null,
        address: address.trim() || null,
        lat,
        lng,
        parking,
        parking_memo: parkingMemo.trim() || null,
        shop_memo: shopMemo.trim() || null,
        is_favorite: isFavorite,
        purpose_ids: selectedPurposeIds,
        photo_urls: photoUrl.trim() ? [photoUrl.trim()] : [],
      };
      await onSubmit(input);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? '店舗情報を編集' : '新しい店舗を登録'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 店舗名 */}
          <div className="form-group">
            <label className="form-label required">店名</label>
            <input
              type="text"
              className="form-input"
              placeholder="例: カフェ・ド・リュミエール"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* ステータス & お気に入り */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">ステータス</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segment-btn ${status === 'visited' ? 'active status-visited' : ''}`}
                  onClick={() => setStatus('visited')}
                >
                  ☕ 訪問済み
                </button>
                <button
                  type="button"
                  className={`segment-btn ${status === 'want_to_go' ? 'active status-want_to_go' : ''}`}
                  onClick={() => setStatus('want_to_go')}
                >
                  ✨ 行きたい
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">お気に入り</label>
              <button
                type="button"
                className={`fav-toggle-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                {isFavorite ? '❤️ お気に入りに登録中' : '🤍 お気に入りに追加'}
              </button>
            </div>
          </div>

          {/* 店舗状態 & 利用タイプ */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">店舗状態</label>
              <select
                className="form-select"
                value={shopStatus}
                onChange={(e) => setShopStatus(e.target.value as ShopCondition)}
              >
                <option value="open">営業中</option>
                <option value="closed">閉店</option>
                <option value="moved">移転</option>
                <option value="unknown">不明</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">利用タイプ</label>
              <select
                className="form-select"
                value={useType}
                onChange={(e) => setUseType(e.target.value as UseType)}
              >
                <option value="sweets">スイーツ・軽食</option>
                <option value="meal">食事</option>
                <option value="both">両方</option>
              </select>
            </div>
          </div>

          {/* エリア選択 & インライン追加 */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">エリア</label>
              {!isAddingArea && (
                <button
                  type="button"
                  className="link-action-btn"
                  onClick={() => setIsAddingArea(true)}
                >
                  + 新規エリア追加
                </button>
              )}
            </div>
            {isAddingArea ? (
              <div className="inline-add-row">
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="新しいエリア名（例: 仙台駅周辺）"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateArea}
                >
                  追加
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingArea(false)}
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <select
                className="form-select"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">エリアを選択してください</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 用途（複数選択） & インライン追加 */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">用途（複数選択可）</label>
              {!isAddingPurpose && (
                <button
                  type="button"
                  className="link-action-btn"
                  onClick={() => setIsAddingPurpose(true)}
                >
                  + 新規用途追加
                </button>
              )}
            </div>
            {isAddingPurpose && (
              <div className="inline-add-row" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="用途名（例: 夫と行きたい）"
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreatePurpose}
                >
                  追加
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingPurpose(false)}
                >
                  キャンセル
                </button>
              </div>
            )}
            <div className="purpose-select-chips">
              {purposes.map((p) => {
                const selected = selectedPurposeIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`purpose-toggle-chip ${selected ? 'selected' : ''}`}
                    onClick={() => handlePurposeToggle(p.id)}
                  >
                    {selected ? '✓ ' : '+ '}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 住所 & 緯度経度取得 */}
          <div className="form-group">
            <label className="form-label">住所</label>
            <div className="inline-add-row">
              <input
                type="text"
                className="form-input"
                placeholder="例: 宮城県仙台市青葉区一番町..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGeocode}
                disabled={isGeocoding || !address}
                title="OpenStreetMap Nominatimから緯度経度を取得"
              >
                {isGeocoding ? '取得中...' : '📍 座標取得'}
              </button>
            </div>
            {geocodeMessage && (
              <p className={`form-hint ${lat ? 'hint-success' : 'hint-warn'}`}>
                {geocodeMessage}
              </p>
            )}
            {lat && lng && (
              <div className="coord-preview">
                <span>緯度: {lat.toFixed(5)}</span>
                <span>経度: {lng.toFixed(5)}</span>
              </div>
            )}
          </div>

          {/* 駐車場 & 駐車場メモ */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">駐車場</label>
              <select
                className="form-select"
                value={parking}
                onChange={(e) => setParking(e.target.value as ParkingType)}
              >
                <option value="unknown">不明</option>
                <option value="yes">あり</option>
                <option value="no">なし</option>
                <option value="partner">提携あり</option>
                <option value="nearby">近隣コインパーキング</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">駐車場メモ</label>
              <input
                type="text"
                className="form-input"
                placeholder="例: 3台、店の裏、200円/30分"
                value={parkingMemo}
                onChange={(e) => setParkingMemo(e.target.value)}
              />
            </div>
          </div>

          {/* 店舗写真URL */}
          <div className="form-group">
            <label className="form-label">店舗写真 URL（画像リンク）</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            {photoUrl && (
              <div className="photo-preview-box">
                <img
                  src={photoUrl}
                  alt="プレビュー"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* 店舗メモ */}
          <div className="form-group">
            <label className="form-label">店舗メモ</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="雰囲気、予約の要否、おすすめメニューなどのメモ..."
              value={shopMemo}
              onChange={(e) => setShopMemo(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !name.trim()}
            >
              {submitting ? '保存中...' : initialData ? '更新する' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
