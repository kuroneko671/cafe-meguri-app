import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Area, Purpose, Person } from '../types';
import {
  fetchAreas,
  createArea,
  deleteArea,
  fetchPurposes,
  createPurpose,
  deletePurpose,
  fetchPersons,
  createPerson,
  updatePerson,
  deletePerson,
} from '../services/masterDataService';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchShops } from '../services/shopService';
import './SettingsPage.css';

export const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const userId = user?.id || 'local-user';

  const [activeSection, setActiveSection] = useState<'areas' | 'purposes' | 'persons' | 'data' | 'system'>('areas');

  const [areas, setAreas] = useState<Area[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  // 入力フォーム状態
  const [newAreaName, setNewAreaName] = useState('');
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonFrequent, setNewPersonFrequent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [exportJson, setExportJson] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aData, pData, perData] = await Promise.all([
        fetchAreas(userId),
        fetchPurposes(userId),
        fetchPersons(userId),
      ]);
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

  // エリア管理
  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    const res = await createArea(newAreaName, userId);
    setAreas((prev) => [...prev, res]);
    setNewAreaName('');
  };

  const handleDeleteArea = async (id: string) => {
    if (window.confirm('このエリアを削除しますか？')) {
      await deleteArea(id, userId);
      setAreas((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // 用途管理
  const handleAddPurpose = async () => {
    if (!newPurposeName.trim()) return;
    const res = await createPurpose(newPurposeName, userId);
    setPurposes((prev) => [...prev, res]);
    setNewPurposeName('');
  };

  const handleDeletePurpose = async (id: string) => {
    if (window.confirm('この用途を削除しますか？')) {
      await deletePurpose(id, userId);
      setPurposes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // 人物管理
  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    const res = await createPerson(newPersonName, newPersonFrequent, userId);
    setPersons((prev) => [...prev, res]);
    setNewPersonName('');
    setNewPersonFrequent(false);
  };

  const handleToggleFrequent = async (person: Person) => {
    await updatePerson(person.id, { is_frequent: !person.is_frequent }, userId);
    setPersons((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, is_frequent: !p.is_frequent } : p))
    );
  };

  const handleDeletePerson = async (id: string) => {
    if (window.confirm('この人物を削除しますか？')) {
      await deletePerson(id, userId);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // データエクスポート
  const handleExportData = async () => {
    const shops = await fetchShops(userId);
    const data = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      areas,
      purposes,
      persons,
      shops,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    setExportJson(jsonStr);

    // ダウンロードトリガー
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafe_app_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">設定・マスター管理</h1>
          <p className="page-subtitle">エリア・用途・人物などの管理とデータ設定</p>
        </div>
      </div>

      {/* サブナビゲーション */}
      <div className="settings-nav">
        <button
          type="button"
          className={`settings-nav-btn ${activeSection === 'areas' ? 'active' : ''}`}
          onClick={() => setActiveSection('areas')}
        >
          📍 エリア管理 ({areas.length})
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeSection === 'purposes' ? 'active' : ''}`}
          onClick={() => setActiveSection('purposes')}
        >
          🏷️ 用途管理 ({purposes.length})
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeSection === 'persons' ? 'active' : ''}`}
          onClick={() => setActiveSection('persons')}
        >
          👥 人物管理 ({persons.length})
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeSection === 'data' ? 'active' : ''}`}
          onClick={() => setActiveSection('data')}
        >
          💾 データバックアップ
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeSection === 'system' ? 'active' : ''}`}
          onClick={() => setActiveSection('system')}
        >
          ⚙️ システム & アカウント
        </button>
      </div>

      {/* コンテンツ本体 */}
      <div className="settings-content-card">
        {loading ? (
          <div className="loading-state">設定を読み込み中...</div>
        ) : activeSection === 'areas' ? (
          /* エリア管理 */
          <div className="settings-section">
            <h3 className="settings-sec-title">📍 エリアの管理</h3>
            <p className="settings-sec-desc">
              店舗の登録・絞り込みに使用するエリアを自由に追加・削除できます。
            </p>

            <div className="settings-add-box">
              <input
                type="text"
                className="form-input"
                placeholder="新しいエリア名（例: 仙台駅東口、泉中央）"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddArea}
                disabled={!newAreaName.trim()}
              >
                ＋ エリアを追加
              </button>
            </div>

            <div className="master-items-list">
              {areas.map((area) => (
                <div key={area.id} className="master-item-row">
                  <span className="master-item-name">📍 {area.name}</span>
                  <button
                    type="button"
                    className="master-item-del-btn"
                    onClick={() => handleDeleteArea(area.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeSection === 'purposes' ? (
          /* 用途管理 */
          <div className="settings-section">
            <h3 className="settings-sec-title">🏷️ 用途の管理</h3>
            <p className="settings-sec-desc">
              「夫と行きたい」「友達とカフェ」「作業したい」など、店舗の目的に合わせて設定できます。
            </p>

            <div className="settings-add-box">
              <input
                type="text"
                className="form-input"
                placeholder="新しい用途名（例: デートにおすすめ、夜カフェ）"
                value={newPurposeName}
                onChange={(e) => setNewPurposeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPurpose()}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddPurpose}
                disabled={!newPurposeName.trim()}
              >
                ＋ 用途を追加
              </button>
            </div>

            <div className="master-items-list">
              {purposes.map((purpose) => (
                <div key={purpose.id} className="master-item-row">
                  <span className="master-item-name">🏷️ #{purpose.name}</span>
                  <button
                    type="button"
                    className="master-item-del-btn"
                    onClick={() => handleDeletePurpose(purpose.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeSection === 'persons' ? (
          /* 人物管理 */
          <div className="settings-section">
            <h3 className="settings-sec-title">👥 人物の管理</h3>
            <p className="settings-sec-desc">
              同行者や運転者として選択する人物を登録します。「よく行く」に設定するとトップ画面から1タップで絞り込めます。
            </p>

            <div className="settings-add-box">
              <input
                type="text"
                className="form-input"
                placeholder="人物の名前（例: 夫、ともぴー、友人A）"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newPersonFrequent}
                  onChange={(e) => setNewPersonFrequent(e.target.checked)}
                />
                よく行く（ホームに表示）
              </label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddPerson}
                disabled={!newPersonName.trim()}
              >
                ＋ 人物を追加
              </button>
            </div>

            <div className="master-items-list">
              {persons.map((person) => (
                <div key={person.id} className="master-item-row">
                  <div className="person-info-row">
                    <span className="master-item-name">👤 {person.name}</span>
                    <button
                      type="button"
                      className={`frequent-toggle-btn ${person.is_frequent ? 'active' : ''}`}
                      onClick={() => handleToggleFrequent(person)}
                    >
                      {person.is_frequent ? '⭐ よく行く (ホーム表示中)' : '☆ 通常'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="master-item-del-btn"
                    onClick={() => handleDeletePerson(person.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeSection === 'data' ? (
          /* データバックアップ */
          <div className="settings-section">
            <h3 className="settings-sec-title">💾 データのバックアップとエクスポート</h3>
            <p className="settings-sec-desc">
              登録した店舗情報、訪問記録、エリア、用途、人物のすべてのデータをJSON形式でバックアップ・ダウンロードできます。
            </p>

            <div className="backup-action-box">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportData}
              >
                📥 データをJSONファイルとしてダウンロード
              </button>
            </div>

            {exportJson && (
              <div className="json-preview-wrap">
                <p className="json-preview-title">エクスポートデータプレビュー:</p>
                <textarea
                  readOnly
                  className="form-textarea json-textarea"
                  value={exportJson}
                  rows={8}
                />
              </div>
            )}
          </div>
        ) : (
          /* システム & アカウント */
          <div className="settings-section">
            <h3 className="settings-sec-title">⚙️ システム & アカウント</h3>

            <div className="system-status-box">
              <div className="status-row">
                <span className="status-label">Supabase 接続状況:</span>
                <span
                  className={`status-pill ${
                    isSupabaseConfigured ? 'status-pill-green' : 'status-pill-amber'
                  }`}
                >
                  {isSupabaseConfigured
                    ? '🟢 Supabase クラウド接続中'
                    : '🟡 ローカルストレージ動作モード'}
                </span>
              </div>
              {!isSupabaseConfigured && (
                <p className="status-note">
                  `.env` にSupabaseの接続URLとAnon Keyを設定すると、自動的にクラウドデータベース同期に切り替わります。
                </p>
              )}
            </div>

            <div className="user-profile-box">
              <h4 className="box-title">ログインユーザー</h4>
              <p className="user-email-text">
                📧 {user?.email || 'ログイン中ユーザー'}
              </p>
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={async () => {
                  if (window.confirm('ログアウトしますか？')) {
                    await signOut();
                  }
                }}
              >
                🚪 ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
