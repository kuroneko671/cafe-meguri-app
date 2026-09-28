import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Shop, ShopFilter, Area, Purpose, Person, ShopInput } from '../types';
import {
  fetchShops,
  createShop,
  updateShop,
  deleteShop,
  toggleFavorite,
  filterShops,
} from '../services/shopService';
import { fetchAreas, fetchPurposes, fetchPersons } from '../services/masterDataService';
import { createVisit, deleteVisit } from '../services/visitService';
import type { VisitInput } from '../services/visitService';
import { FilterBar } from '../components/FilterBar';
import { ShopCard } from '../components/ShopCard';
import { ShopDetailModal } from '../components/ShopDetailModal';
import { ShopFormModal } from '../components/ShopFormModal';
import { VisitFormModal } from '../components/VisitFormModal';
import './ShopsPage.css';

type SortOption = 'created_desc' | 'visited_desc' | 'rating_desc' | 'name_asc';

export const ShopsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = user?.id || 'local-user';

  const [shops, setShops] = useState<Shop[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルター状態
  const [filter, setFilter] = useState<ShopFilter>({
    searchText: searchParams.get('q') || '',
    status: (searchParams.get('status') as any) || '',
    shopStatus: (searchParams.get('shopStatus') as any) || '',
    useType: (searchParams.get('useType') as any) || '',
    areaId: searchParams.get('areaId') || '',
    purposeId: searchParams.get('purposeId') || '',
    personId: searchParams.get('personId') || '',
    isFavorite: searchParams.get('favorite') === 'true',
  });

  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // モーダル状態
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [targetShopForVisit, setTargetShopForVisit] = useState<Shop | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, aData, pData, perData] = await Promise.all([
        fetchShops(userId),
        fetchAreas(userId),
        fetchPurposes(userId),
        fetchPersons(userId),
      ]);
      setShops(sData);
      setAreas(aData);
      setPurposes(pData);
      setPersons(perData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // URLパラメータの同期
  useEffect(() => {
    const qStatus = searchParams.get('status');
    const qFav = searchParams.get('favorite');
    const qPerson = searchParams.get('personId');
    const qUse = searchParams.get('useType');
    const qArea = searchParams.get('areaId');

    if (qStatus || qFav || qPerson || qUse || qArea) {
      setFilter((prev) => ({
        ...prev,
        status: (qStatus as any) || prev.status,
        isFavorite: qFav === 'true' ? true : prev.isFavorite,
        personId: qPerson || prev.personId,
        useType: (qUse as any) || prev.useType,
        areaId: qArea || prev.areaId,
      }));
    }
  }, [searchParams]);

  // フィルタリング & ソート
  const filteredShops = useMemo(() => {
    const filtered = filterShops(shops, filter);

    return filtered.sort((a, b) => {
      if (sortOption === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name, 'ja');
      }
      if (sortOption === 'rating_desc') {
        const rA = a.visits && a.visits.length > 0 ? a.visits[0].rating || 0 : 0;
        const rB = b.visits && b.visits.length > 0 ? b.visits[0].rating || 0 : 0;
        return rB - rA;
      }
      if (sortOption === 'visited_desc') {
        const vA = a.visits && a.visits.length > 0 ? a.visits[0].visited_at || '' : '';
        const vB = b.visits && b.visits.length > 0 ? b.visits[0].visited_at || '' : '';
        return vB.localeCompare(vA);
      }
      return 0;
    });
  }, [shops, filter, sortOption]);

  const handleToggleFavorite = async (e: React.MouseEvent, shopId: string, current: boolean) => {
    e.stopPropagation();
    await toggleFavorite(shopId, current, userId);
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, is_favorite: !current } : s))
    );
    if (selectedShop && selectedShop.id === shopId) {
      setSelectedShop((prev) => (prev ? { ...prev, is_favorite: !current } : null));
    }
  };

  const handleSaveShop = async (input: ShopInput) => {
    if (editingShop) {
      const updated = await updateShop(editingShop.id, input, userId);
      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedShop(updated);
    } else {
      const created = await createShop(input, userId);
      setShops((prev) => [created, ...prev]);
    }
    setEditingShop(null);
  };

  const handleDeleteShop = async (shopId: string) => {
    await deleteShop(shopId, userId);
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    setIsDetailOpen(false);
    setSelectedShop(null);
  };

  const handleSaveVisit = async (input: VisitInput) => {
    await createVisit(input, userId);
    await loadData();
    setIsVisitFormOpen(false);
  };

  const handleDeleteVisit = async (visitId: string, shopId: string) => {
    await deleteVisit(visitId, shopId, userId);
    await loadData();
  };

  return (
    <div className="shops-page-container">
      {/* ページヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">店舗一覧</h1>
          <p className="page-subtitle">登録されたカフェ・飲食店の記録と検索</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingShop(null);
            setIsShopFormOpen(true);
          }}
        >
          ＋ 新規店舗を登録
        </button>
      </div>

      {/* 検索・絞り込みフィルター */}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        areas={areas}
        purposes={purposes}
        persons={persons}
        totalCount={shops.length}
        filteredCount={filteredShops.length}
      />

      {/* 表示切替 & ソートバー */}
      <div className="shops-controls-row">
        <div className="sort-controls">
          <label className="sort-label">並び替え:</label>
          <select
            className="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="created_desc">登録日が新しい順</option>
            <option value="visited_desc">訪問日が新しい順</option>
            <option value="rating_desc">評価が高い順</option>
            <option value="name_asc">店舗名順 (五十音)</option>
          </select>
        </div>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="グリッド表示"
          >
            🔲
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="リスト表示"
          >
            ☰
          </button>
        </div>
      </div>

      {/* 店舗リスト表示 */}
      {loading ? (
        <div className="loading-state">店舗データを読み込み中...</div>
      ) : filteredShops.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">☕</div>
          <p className="empty-state-text">該当する店舗が見つかりませんでした</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setFilter({
                searchText: '',
                status: '',
                shopStatus: '',
                useType: '',
                areaId: '',
                purposeId: '',
                personId: '',
                isFavorite: false,
              })
            }
          >
            フィルターをクリア
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="shop-cards-grid">
          {filteredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onSelect={(s) => {
                setSelectedShop(s);
                setIsDetailOpen(true);
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* リストテーブル表示 */
        <div className="shops-list-view">
          {filteredShops.map((shop) => {
            const latestVisit = shop.visits && shop.visits.length > 0 ? shop.visits[0] : null;
            return (
              <div
                key={shop.id}
                className="shop-list-item"
                onClick={() => {
                  setSelectedShop(shop);
                  setIsDetailOpen(true);
                }}
              >
                <button
                  type="button"
                  className="list-fav-btn"
                  onClick={(e) => handleToggleFavorite(e, shop.id, shop.is_favorite)}
                >
                  {shop.is_favorite ? '❤️' : '🤍'}
                </button>
                <div className="shop-list-info">
                  <div className="shop-list-title-row">
                    <span className="shop-list-name">{shop.name}</span>
                    <span className={`status-badge status-${shop.status}`}>
                      {shop.status === 'visited' ? '訪問済み' : '行きたい'}
                    </span>
                  </div>
                  <div className="shop-list-sub">
                    {shop.area?.name && <span>📍 {shop.area.name}</span>}
                    {shop.address && <span className="list-address">({shop.address})</span>}
                  </div>
                </div>
                <div className="shop-list-meta">
                  {latestVisit?.rating && (
                    <span className="rating-stars">
                      {'★'.repeat(latestVisit.rating)}
                    </span>
                  )}
                  {latestVisit?.visited_at && (
                    <span className="list-date">
                      {latestVisit.visited_at.replace(/-/g, '/')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 店舗詳細モーダル */}
      <ShopDetailModal
        shop={selectedShop}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedShop(null);
        }}
        onEditShop={(shop) => {
          setIsDetailOpen(false);
          setEditingShop(shop);
          setIsShopFormOpen(true);
        }}
        onDeleteShop={handleDeleteShop}
        onToggleFavorite={handleToggleFavorite}
        onOpenAddVisit={(shop) => {
          setTargetShopForVisit(shop);
          setIsVisitFormOpen(true);
        }}
        onDeleteVisit={handleDeleteVisit}
      />

      {/* 店舗登録・編集モーダル */}
      <ShopFormModal
        isOpen={isShopFormOpen}
        onClose={() => {
          setIsShopFormOpen(false);
          setEditingShop(null);
        }}
        onSubmit={handleSaveShop}
        initialData={editingShop}
        areas={areas}
        purposes={purposes}
        userId={userId}
        onAreaCreated={(newArea) => setAreas((prev) => [...prev, newArea])}
        onPurposeCreated={(newPurpose) => setPurposes((prev) => [...prev, newPurpose])}
      />

      {/* 訪問記録追加モーダル */}
      {targetShopForVisit && (
        <VisitFormModal
          isOpen={isVisitFormOpen}
          onClose={() => {
            setIsVisitFormOpen(false);
            setTargetShopForVisit(null);
          }}
          shopId={targetShopForVisit.id}
          shopName={targetShopForVisit.name}
          persons={persons}
          userId={userId}
          onSubmit={handleSaveVisit}
          onPersonCreated={(newPerson) => setPersons((prev) => [...prev, newPerson])}
        />
      )}
    </div>
  );
};
