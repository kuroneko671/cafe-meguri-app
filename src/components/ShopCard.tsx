import type { Shop } from '../types';
import { STATUS_LABELS, SHOP_CONDITION_LABELS, USE_TYPE_LABELS, RATING_LABELS } from '../types';
import { generateGoogleSearchUrl } from '../services/geocodingService';
import './ShopCard.css';

type ShopCardProps = {
  shop: Shop;
  onSelect: (shop: Shop) => void;
  onToggleFavorite: (e: React.MouseEvent, shopId: string, current: boolean) => void;
};

export const ShopCard = ({ shop, onSelect, onToggleFavorite }: ShopCardProps) => {
  // 最新の訪問記録（評価や訪問日）
  const latestVisit = shop.visits && shop.visits.length > 0 ? shop.visits[0] : null;
  const photoUrl =
    shop.photos && shop.photos.length > 0
      ? shop.photos[0].storage_path
      : 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80';

  const googleUrl = generateGoogleSearchUrl(shop.name, shop.address);

  return (
    <div className="shop-card" onClick={() => onSelect(shop)}>
      {/* サムネイル画像 */}
      <div className="shop-card-image-wrap">
        <img
          src={photoUrl}
          alt={shop.name}
          className="shop-card-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80';
          }}
        />
        {/* お気に入りボタン */}
        <button
          className={`favorite-btn ${shop.is_favorite ? 'is-active' : ''}`}
          onClick={(e) => onToggleFavorite(e, shop.id, shop.is_favorite)}
          title={shop.is_favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          aria-label="お気に入り"
        >
          {shop.is_favorite ? '❤️' : '🤍'}
        </button>

        {/* ステータスバッジ */}
        <div className="shop-badges-top">
          <span className={`status-badge status-${shop.status}`}>
            {STATUS_LABELS[shop.status]}
          </span>
          {shop.shop_status !== 'open' && (
            <span className={`condition-badge condition-${shop.shop_status}`}>
              {SHOP_CONDITION_LABELS[shop.shop_status]}
            </span>
          )}
        </div>
      </div>

      {/* カードコンテンツ */}
      <div className="shop-card-content">
        <div className="shop-card-header">
          <h3 className="shop-card-name" title={shop.name}>
            {shop.name}
          </h3>
        </div>

        {/* エリア & 利用タイプ */}
        <div className="shop-card-meta">
          {shop.area?.name && <span className="meta-tag area-tag">📍 {shop.area.name}</span>}
          <span className="meta-tag use-type-tag">🍴 {USE_TYPE_LABELS[shop.use_type]}</span>
        </div>

        {/* 用途タグ一覧 */}
        {shop.purposes && shop.purposes.length > 0 && (
          <div className="shop-card-purposes">
            {shop.purposes.slice(0, 2).map((p) => (
              <span key={p.id} className="purpose-pill">
                #{p.name}
              </span>
            ))}
            {shop.purposes.length > 2 && (
              <span className="purpose-pill more">+{shop.purposes.length - 2}</span>
            )}
          </div>
        )}

        {/* 評価 & 最終訪問日 */}
        <div className="shop-card-footer">
          <div className="visit-info">
            {latestVisit?.rating ? (
              <span className="rating-stars">{RATING_LABELS[latestVisit.rating]}</span>
            ) : (
              <span className="no-rating">未評価</span>
            )}
            {latestVisit?.visited_at && (
              <span className="last-visited-date">
                訪問: {latestVisit.visited_at.replace(/-/g, '/')}
              </span>
            )}
          </div>

          {/* Google検索ボタン */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="google-search-link-sm"
            onClick={(e) => e.stopPropagation()}
            title="Googleで店舗情報を検索"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Google検索
          </a>
        </div>
      </div>
    </div>
  );
};
