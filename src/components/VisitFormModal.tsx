import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Person } from '../types';
import type { VisitInput } from '../services/visitService';
import { createPerson } from '../services/masterDataService';
import './Modal.css';

type VisitFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  persons: Person[];
  userId: string;
  onSubmit: (data: VisitInput) => Promise<void>;
  onPersonCreated: (newPerson: Person) => void;
};

export const VisitFormModal = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  persons,
  userId,
  onSubmit,
  onPersonCreated,
}: VisitFormModalProps) => {
  const today = new Date().toISOString().split('T')[0];

  const [visitedAt, setVisitedAt] = useState<string>(today);
  const [rating, setRating] = useState<1 | 2 | 3 | null>(3);
  const [foodEaten, setFoodEaten] = useState('');
  const [price, setPrice] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [staffImpression, setStaffImpression] = useState('');
  const [myImpression, setMyImpression] = useState('');
  const [wantToRevisit, setWantToRevisit] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState('');

  // 新規人物の追加
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) return;
    const created = await createPerson(newPersonName, false, userId);
    onPersonCreated(created);
    setSelectedCompanionIds((prev) => [...prev, created.id]);
    setNewPersonName('');
    setIsAddingPerson(false);
  };

  const handleCompanionToggle = (pId: string) => {
    setSelectedCompanionIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const input: VisitInput = {
        shop_id: shopId,
        visited_at: visitedAt || null,
        rating,
        food_eaten: foodEaten.trim() || null,
        price: price ? parseInt(price, 10) : null,
        driver_id: driverId || null,
        staff_impression: staffImpression.trim() || null,
        my_impression: myImpression.trim() || null,
        want_to_revisit: wantToRevisit,
        companion_ids: selectedCompanionIds,
        photo_urls: photoUrl.trim() ? [photoUrl.trim()] : [],
      };
      await onSubmit(input);
      onClose();
    } catch (err: any) {
      console.error('VisitFormModal handleSubmit error:', err);
      alert(err.message || '訪問記録の登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">訪問記録を追加</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
              店舗: {shopName}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 訪問日 & 評価 */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">訪問日</label>
              <input
                type="date"
                className="form-input"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">評価</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segment-btn ${rating === 1 ? 'active' : ''}`}
                  onClick={() => setRating(1)}
                  style={rating === 1 ? { background: 'var(--color-accent-amber)', color: '#fff' } : {}}
                >
                  ★
                </button>
                <button
                  type="button"
                  className={`segment-btn ${rating === 2 ? 'active' : ''}`}
                  onClick={() => setRating(2)}
                  style={rating === 2 ? { background: 'var(--color-accent-amber)', color: '#fff' } : {}}
                >
                  ★★
                </button>
                <button
                  type="button"
                  className={`segment-btn ${rating === 3 ? 'active' : ''}`}
                  onClick={() => setRating(3)}
                  style={rating === 3 ? { background: 'var(--color-accent-amber)', color: '#fff' } : {}}
                >
                  ★★★
                </button>
                <button
                  type="button"
                  className={`segment-btn ${rating === null ? 'active' : ''}`}
                  onClick={() => setRating(null)}
                >
                  なし
                </button>
              </div>
            </div>
          </div>

          {/* 食べたもの & 価格 */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">食べたもの・注文内容</label>
              <input
                type="text"
                className="form-input"
                placeholder="例: チーズケーキ、アイスカフェラテ"
                value={foodEaten}
                onChange={(e) => setFoodEaten(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">価格（円）</label>
              <input
                type="number"
                className="form-input"
                placeholder="例: 1500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* 同行者（複数選択） & インライン追加 */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">同行者</label>
              {!isAddingPerson && (
                <button
                  type="button"
                  className="link-action-btn"
                  onClick={() => setIsAddingPerson(true)}
                >
                  + 新規人物追加
                </button>
              )}
            </div>
            {isAddingPerson && (
              <div className="inline-add-row" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="人物の名前（例: ともぴー、友人A）"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreatePerson}
                >
                  追加
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingPerson(false)}
                >
                  キャンセル
                </button>
              </div>
            )}
            <div className="purpose-select-chips">
              {persons.map((p) => {
                const selected = selectedCompanionIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`purpose-toggle-chip ${selected ? 'selected' : ''}`}
                    onClick={() => handleCompanionToggle(p.id)}
                  >
                    {selected ? '✓ ' : '+ '}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 運転者 */}
          <div className="form-group">
            <label className="form-label">運転者（任意）</label>
            <select
              className="form-select"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">運転者なし / 未設定</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 店員の雰囲気 */}
          <div className="form-group">
            <label className="form-label">店員の雰囲気・接客</label>
            <input
              type="text"
              className="form-input"
              placeholder="例: マスターがとても気さくで丁寧、静かで落ち着いた接客"
              value={staffImpression}
              onChange={(e) => setStaffImpression(e.target.value)}
            />
          </div>

          {/* 自分の感想 */}
          <div className="form-group">
            <label className="form-label">自分の感想・メモ</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="席の居心地、料理の味、また頼みたいものなど..."
              value={myImpression}
              onChange={(e) => setMyImpression(e.target.value)}
            />
          </div>

          {/* また行きたい & 訪問写真 */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">また行きたい？</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segment-btn ${wantToRevisit ? 'active status-visited' : ''}`}
                  onClick={() => setWantToRevisit(true)}
                >
                  ❤️ ぜひ行きたい
                </button>
                <button
                  type="button"
                  className={`segment-btn ${!wantToRevisit ? 'active' : ''}`}
                  onClick={() => setWantToRevisit(false)}
                >
                  どちらでも
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">訪問写真 URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '保存中...' : '記録を追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
