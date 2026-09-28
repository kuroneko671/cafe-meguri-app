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
import { MapComponent } from '../components/MapComponent';
import { ShopDetailModal } from '../components/ShopDetailModal';
import { ShopFormModal } from '../components/ShopFormModal';
import { VisitFormModal } from '../components/VisitFormModal';
import './MapPage.css';

export const MapPage = () => {
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
    shopStatus: '',
    useType: '',
    areaId: '',
    purposeId: '',
    personId: '',
    isFavorite: false,
  });

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

  const filteredShops = useMemo(() => {
    return filterShops(shops, filter);
  }, [shops, filter]);

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
    <div className="map-page-container">
      {/* ページヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">マップ検索</h1>
          <p className="page-subtitle">地図上から店舗を探す・位置を確認する</p>
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

      {/* 地図本体 */}
      {loading ? (
        <div className="loading-state">地図を初期化中...</div>
      ) : (
        <div className="map-content-area">
          <MapComponent
            shops={filteredShops}
            onSelectShop={(shop) => {
              setSelectedShop(shop);
              setIsDetailOpen(true);
            }}
          />
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
