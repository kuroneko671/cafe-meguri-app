import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Shop, Person } from '../types';
import { fetchShops, toggleFavorite } from '../services/shopService';
import { fetchPersons } from '../services/masterDataService';
import { ShopCard } from '../components/ShopCard';
import { ShopDetailModal } from '../components/ShopDetailModal';
import { ShopFormModal } from '../components/ShopFormModal';
import { VisitFormModal } from '../components/VisitFormModal';
import { createShop, updateShop, deleteShop } from '../services/shopService';
import { createVisit, deleteVisit } from '../services/visitService';
import { fetchAreas, fetchPurposes } from '../services/masterDataService';
import type { Area, Purpose, ShopInput } from '../types';
import type { VisitInput } from '../services/visitService';
import './HomePage.css';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || 'local-user';

  const [shops, setShops] = useState<Shop[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [shopsData, personsData, areasData, purposesData] = await Promise.all([
        fetchShops(userId),
        fetchPersons(userId),
        fetchAreas(userId),
        fetchPurposes(userId),
      ]);
      setShops(shopsData);
      setPersons(personsData);
      setAreas(areasData);
      setPurposes(purposesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // お気に入りトグル
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

  // 店舗登録・更新
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

  // 店舗削除
  const handleDeleteShop = async (shopId: string) => {
    await deleteShop(shopId, userId);
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    setIsDetailOpen(false);
    setSelectedShop(null);
  };

  // 訪問記録保存
  const handleSaveVisit = async (input: VisitInput) => {
    await createVisit(input, userId);
    await loadData();
    setIsVisitFormOpen(false);
  };

  // 訪問記録削除
  const handleDeleteVisit = async (visitId: string, shopId: string) => {
    await deleteVisit(visitId, shopId, userId);
    await loadData();
    if (selectedShop) {
      const updated = shops.find((s) => s.id === shopId);
      if (updated) {
        setSelectedShop({
          ...updated,
          visits: (updated.visits || []).filter((v) => v.id !== visitId),
        });
      }
    }
  };

  // 統計情報
  const visitedCount = shops.filter((s) => s.status === 'visited').length;
  const wantToGoCount = shops.filter((s) => s.status === 'want_to_go').length;
  const favoriteCount = shops.filter((s) => s.is_favorite).length;

  // 最近の店舗 (最大6件)
  const recentShops = shops.slice(0, 6);

  // よく使う人物（is_frequent = true）
  const frequentPersons = persons.filter((p) => p.is_frequent);

  return (
    <div className="home-container">
      {/* メインヒーローバナー */}
      <div className="home-banner">
        <div className="home-banner-content">
          <span className="home-banner-tag">Café & Restaurant Log</span>
          <h1 className="home-banner-title">美味しいカフェ・お店の思い出を記録しよう</h1>
          <p className="home-banner-desc">
            訪れた素敵なお店と、これから行きたいお店を一元管理。
          </p>
          <div className="home-banner-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingShop(null);
                setIsShopFormOpen(true);
              }}
            >
              ＋ 新しい店舗を登録
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/map')}
            >
              🗺️ 地図で探す
            </button>
          </div>
        </div>
      </div>

      {/* 統計カード行 */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/shops')}>
          <div className="stat-icon-wrap" style={{ background: 'var(--color-primary-100)' }}>
            🏪
          </div>
          <div className="stat-info">
            <span className="stat-val">{shops.length}</span>
            <span className="stat-lbl">全登録店舗</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/shops?status=visited')}>
          <div className="stat-icon-wrap" style={{ background: 'hsl(142, 60%, 92%)' }}>
            ☕
          </div>
          <div className="stat-info">
            <span className="stat-val" style={{ color: 'var(--color-success)' }}>
              {visitedCount}
            </span>
            <span className="stat-lbl">訪問済み</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/shops?status=want_to_go')}>
          <div className="stat-icon-wrap" style={{ background: 'hsl(38, 92%, 92%)' }}>
            ✨
          </div>
          <div className="stat-info">
            <span className="stat-val" style={{ color: 'var(--color-accent-amber)' }}>
              {wantToGoCount}
            </span>
            <span className="stat-lbl">行きたい店</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/shops?favorite=true')}>
          <div className="stat-icon-wrap" style={{ background: 'hsl(350, 90%, 94%)' }}>
            ❤️
          </div>
          <div className="stat-info">
            <span className="stat-val" style={{ color: 'hsl(350, 75%, 55%)' }}>
              {favoriteCount}
            </span>
            <span className="stat-lbl">お気に入り</span>
          </div>
        </div>
      </div>

      {/* SPEC.md要件: よく使う絞り込み（ワンタップ検索） */}
      <div className="quick-filter-section">
        <h2 className="section-title">よく使う絞り込み</h2>
        <div className="quick-filter-chips">
          {frequentPersons.map((p) => (
            <button
              key={p.id}
              type="button"
              className="quick-chip-btn"
              onClick={() => navigate(`/shops?personId=${p.id}`)}
            >
              👥 {p.name}と行った店
            </button>
          ))}
          <button
            type="button"
            className="quick-chip-btn"
            onClick={() => navigate('/shops?favorite=true')}
          >
            ❤️ お気に入りの店
          </button>
          <button
            type="button"
            className="quick-chip-btn"
            onClick={() => navigate('/shops?status=want_to_go')}
          >
            ✨ 行きたいお店リスト
          </button>
          <button
            type="button"
            className="quick-chip-btn"
            onClick={() => navigate('/shops?useType=sweets')}
          >
            🍰 スイーツ・カフェ巡り
          </button>
        </div>
      </div>

      {/* 最近登録・訪問した店舗 */}
      <div className="recent-section">
        <div className="section-header-row">
          <h2 className="section-title">登録店舗</h2>
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate('/shops')}
          >
            すべて見る ({shops.length}) →
          </button>
        </div>

        {loading ? (
          <div className="loading-state">読み込み中...</div>
        ) : recentShops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">☕</div>
            <p>まだ店舗が登録されていません</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsShopFormOpen(true)}
            >
              最初の店舗を登録する
            </button>
          </div>
        ) : (
          <div className="shop-cards-grid">
            {recentShops.map((shop) => (
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
        )}
      </div>

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
