import { useState } from 'react';
import type { Shop } from '../types';
import { STATUS_LABELS, SHOP_CONDITION_LABELS, USE_TYPE_LABELS, PARKING_LABELS, RATING_LABELS } from '../types';
import { generateGoogleSearchUrl } from '../services/geocodingService';
import './ShopDetailModal.css';

type ShopDetailModalProps = {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onEditShop: (shop: Shop) => void;
  onDeleteShop: (shopId: string) => void;
  onToggleFavorite: (e: React.MouseEvent, shopId: string, current: boolean) => void;
  onOpenAddVisit: (shop: Shop) => void;
  onDeleteVisit: (visitId: string, shopId: string) => void;
};

export const ShopDetailModal = ({
  shop,
  isOpen,
  onClose,
  onEditShop,
  onDeleteShop,
  onToggleFavorite,
  onOpenAddVisit,
  onDeleteVisit,
}: ShopDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'visits'>('info');

  if (!isOpen || !shop) return null;

  const googleSearchUrl = generateGoogleSearchUrl(shop.name, shop.address);
  const visits = shop.visits || [];

  // 全写真（店舗写真 + 訪問写真）
  const allPhotos: string[] = [
    ...(shop.photos || []).map((p) => p.storage_path),
    ...visits.flatMap((v) => (v.photos || []).map((p) => p.storage_path)),
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window shop-detail-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="shop-detail-hero">
          {allPhotos.length > 0 ? (
            <img src={allPhotos[0]} alt={shop.name} className="shop-detail-hero-img" />
          ) : (
            <div className="shop-detail-hero-placeholder">☕</div>
          )}
          <div className="shop-detail-hero-overlay">
            <div className="shop-detail-hero-top">
              <button
                className={`detail-fav-btn ${shop.is_favorite ? 'is-fav' : ''}`}
                onClick={(e) => onToggleFavorite(e, shop.id, shop.is_favorite)}
                title="お気に入り"
              >
                {shop.is_favorite ? '❤️' : '🤍'}
              </button>
              <button className="detail-close-btn" onClick={onClose} aria-label="閉じる">
                ✕
              </button>
            </div>
            <div className="shop-detail-hero-title-wrap">
              <div className="shop-detail-badges">
                <span className={`status-badge status-${shop.status}`}>
                  {STATUS_LABELS[shop.status]}
                </span>
                <span className={`condition-badge condition-${shop.shop_status}`}>
                  {SHOP_CONDITION_LABELS[shop.shop_status]}
                </span>
                <span className="meta-tag use-type-tag">
                  🍴 {USE_TYPE_LABELS[shop.use_type]}
                </span>
              </div>
              <h2 className="shop-detail-name">{shop.name}</h2>
            </div>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="shop-detail-tabs">
          <button
            className={`detail-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 店舗情報
          </button>
          <button
            className={`detail-tab ${activeTab === 'visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('visits')}
          >
            📝 訪問記録 ({visits.length})
          </button>
        </div>

        {/* モーダルコンテンツ */}
        <div className="modal-body shop-detail-body">
          {activeTab === 'info' ? (
            <div className="shop-info-tab-content">
              {/* Google検索ボタン */}
              <div className="google-action-box">
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="google-search-big-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Googleで「{shop.name}」を検索
                  <span className="external-icon">↗</span>
                </a>
                <p className="google-hint">営業時間・最新メニュー・定休日などを確認できます</p>
              </div>

              {/* 用途タグ */}
              {shop.purposes && shop.purposes.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">用途・目的</h4>
                  <div className="detail-tag-list">
                    {shop.purposes.map((p) => (
                      <span key={p.id} className="purpose-pill-lg">
                        #{p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* エリア・住所・地図情報 */}
              <div className="detail-section">
                <h4 className="detail-section-title">場所・アクセス</h4>
                <div className="detail-info-grid">
                  <div className="info-row">
                    <span className="info-label">エリア:</span>
                    <span className="info-val">{shop.area?.name || '未設定'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">住所:</span>
                    <span className="info-val">{shop.address || '未設定'}</span>
                  </div>
                  {shop.lat && shop.lng && (
                    <div className="info-row">
                      <span className="info-label">座標:</span>
                      <span className="info-val">
                        緯度 {shop.lat.toFixed(4)}, 経度 {shop.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 駐車場情報 */}
              <div className="detail-section">
                <h4 className="detail-section-title">駐車場</h4>
                <div className="detail-info-grid">
                  <div className="info-row">
                    <span className="info-label">駐車場:</span>
                    <span className="info-val">
                      {shop.parking ? PARKING_LABELS[shop.parking] : '不明'}
                    </span>
                  </div>
                  {shop.parking_memo && (
                    <div className="info-row">
                      <span className="info-label">駐車場メモ:</span>
                      <span className="info-val">{shop.parking_memo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 店舗メモ */}
              {shop.shop_memo && (
                <div className="detail-section">
                  <h4 className="detail-section-title">店舗メモ</h4>
                  <p className="shop-memo-text">{shop.shop_memo}</p>
                </div>
              )}

              {/* 写真ギャラリー */}
              {allPhotos.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">写真 ({allPhotos.length}枚)</h4>
                  <div className="detail-photo-gallery">
                    {allPhotos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gallery-thumb-link"
                      >
                        <img src={url} alt={`写真 ${i + 1}`} className="gallery-thumb-img" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 訪問記録タブ */
            <div className="shop-visits-tab-content">
              <div className="visits-header-action">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onOpenAddVisit(shop)}
                >
                  ＋ 訪問記録を追加する
                </button>
              </div>

              {visits.length === 0 ? (
                <div className="empty-visits-box">
                  <p className="empty-visits-icon">📝</p>
                  <p>まだ訪問記録がありません</p>
                  <p className="empty-visits-sub">「行きたい」店舗に訪問したら記録を残しましょう！</p>
                </div>
              ) : (
                <div className="visits-timeline">
                  {visits.map((visit) => (
                    <div key={visit.id} className="visit-card">
                      <div className="visit-card-top">
                        <div className="visit-date-badge">
                          📅 {visit.visited_at ? visit.visited_at.replace(/-/g, '/') : '訪問日未記録'}
                        </div>
                        {visit.rating && (
                          <div className="visit-rating-badge">
                            {RATING_LABELS[visit.rating]}
                          </div>
                        )}
                        <button
                          className="visit-del-btn"
                          title="訪問記録を削除"
                          onClick={() => {
                            if (window.confirm('この訪問記録を削除しますか？')) {
                              onDeleteVisit(visit.id, shop.id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      {/* 食べたもの・価格 */}
                      {visit.food_eaten && (
                        <div className="visit-row">
                          <span className="visit-label">🍴 食べたもの:</span>
                          <span className="visit-text">{visit.food_eaten}</span>
                        </div>
                      )}
                      {visit.price && (
                        <div className="visit-row">
                          <span className="visit-label">💰 価格:</span>
                          <span className="visit-text">{visit.price.toLocaleString()} 円</span>
                        </div>
                      )}

                      {/* 同行者・運転者 */}
                      {(visit.companions?.length || visit.driver) && (
                        <div className="visit-row">
                          <span className="visit-label">👥 人物:</span>
                          <span className="visit-text">
                            {visit.companions && visit.companions.length > 0 && (
                              <span>同行者: {visit.companions.map((c) => c.name).join(', ')} </span>
                            )}
                            {visit.driver && <span>(運転: {visit.driver.name})</span>}
                          </span>
                        </div>
                      )}

                      {/* 接客・店員の雰囲気 */}
                      {visit.staff_impression && (
                        <div className="visit-row">
                          <span className="visit-label">😊 店員の雰囲気:</span>
                          <span className="visit-text">{visit.staff_impression}</span>
                        </div>
                      )}

                      {/* 感想 */}
                      {visit.my_impression && (
                        <div className="visit-row impression-box">
                          <p className="impression-text">{visit.my_impression}</p>
                        </div>
                      )}

                      {/* また行きたいバッジ */}
                      {visit.want_to_revisit && (
                        <div className="revisit-badge">✨ また行きたい！</div>
                      )}

                      {/* 訪問写真 */}
                      {visit.photos && visit.photos.length > 0 && (
                        <div className="visit-photos-row">
                          {visit.photos.map((vp) => (
                            <img
                              key={vp.id}
                              src={vp.storage_path}
                              alt="訪問写真"
                              className="visit-photo-thumb"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッターアクション */}
        <div className="modal-footer shop-detail-footer">
          <button
            type="button"
            className="btn btn-danger-ghost"
            onClick={() => {
              if (window.confirm(`「${shop.name}」を削除しますか？`)) {
                onDeleteShop(shop.id);
                onClose();
              }
            }}
          >
            店舗を削除
          </button>
          <div className="footer-right-btns">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onEditShop(shop);
              }}
            >
              ✏️ 編集する
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenAddVisit(shop)}
            >
              ＋ 訪問記録を追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
