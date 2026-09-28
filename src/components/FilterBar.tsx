import type { ShopFilter, Area, Purpose, Person } from '../types';
import './FilterBar.css';

type FilterBarProps = {
  filter: ShopFilter;
  onChange: (newFilter: ShopFilter) => void;
  areas: Area[];
  purposes: Purpose[];
  persons: Person[];
  totalCount: number;
  filteredCount: number;
};

export const FilterBar = ({
  filter,
  onChange,
  areas,
  purposes,
  persons,
  totalCount,
  filteredCount,
}: FilterBarProps) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filter, searchText: e.target.value });
  };

  const handleStatusChange = (status: ShopFilter['status']) => {
    onChange({ ...filter, status: filter.status === status ? '' : status });
  };

  const handleFavoriteToggle = () => {
    onChange({ ...filter, isFavorite: !filter.isFavorite });
  };

  const handleSelectChange = (key: keyof ShopFilter, value: string) => {
    onChange({ ...filter, [key]: value });
  };

  const handleReset = () => {
    onChange({
      searchText: '',
      status: '',
      shopStatus: '',
      useType: '',
      areaId: '',
      purposeId: '',
      personId: '',
      isFavorite: false,
    });
  };

  const isFiltered =
    Boolean(filter.searchText) ||
    Boolean(filter.status) ||
    Boolean(filter.shopStatus) ||
    Boolean(filter.useType) ||
    Boolean(filter.areaId) ||
    Boolean(filter.purposeId) ||
    Boolean(filter.personId) ||
    filter.isFavorite;

  return (
    <div className="filter-bar-container">
      {/* 検索入力行 */}
      <div className="filter-search-row">
        <div className="filter-search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="店名・住所・食べたもの・メモで検索..."
            value={filter.searchText}
            onChange={handleTextChange}
          />
          {filter.searchText && (
            <button
              className="clear-search-btn"
              onClick={() => onChange({ ...filter, searchText: '' })}
              aria-label="検索文字クリア"
            >
              ✕
            </button>
          )}
        </div>

        {/* クイックステータス切り替え */}
        <div className="filter-quick-chips">
          <button
            type="button"
            className={`chip-btn ${filter.status === '' && !filter.isFavorite ? 'active' : ''}`}
            onClick={() => onChange({ ...filter, status: '', isFavorite: false })}
          >
            すべて
          </button>
          <button
            type="button"
            className={`chip-btn ${filter.status === 'visited' ? 'active status-visited' : ''}`}
            onClick={() => handleStatusChange('visited')}
          >
            ☕ 訪問済み
          </button>
          <button
            type="button"
            className={`chip-btn ${filter.status === 'want_to_go' ? 'active status-want_to_go' : ''}`}
            onClick={() => handleStatusChange('want_to_go')}
          >
            ✨ 行きたい
          </button>
          <button
            type="button"
            className={`chip-btn ${filter.isFavorite ? 'active is-fav' : ''}`}
            onClick={handleFavoriteToggle}
          >
            ❤️ お気に入り
          </button>
        </div>
      </div>

      {/* 詳細絞り込み行 */}
      <div className="filter-dropdowns-row">
        {/* エリア選択 */}
        <div className="filter-select-group">
          <label className="filter-label">エリア</label>
          <select
            className="filter-select"
            value={filter.areaId}
            onChange={(e) => handleSelectChange('areaId', e.target.value)}
          >
            <option value="">すべてのエリア</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* 用途選択 */}
        <div className="filter-select-group">
          <label className="filter-label">用途</label>
          <select
            className="filter-select"
            value={filter.purposeId}
            onChange={(e) => handleSelectChange('purposeId', e.target.value)}
          >
            <option value="">すべての用途</option>
            {purposes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 同行者・運転者選択 */}
        <div className="filter-select-group">
          <label className="filter-label">同行者・運転者</label>
          <select
            className="filter-select"
            value={filter.personId}
            onChange={(e) => handleSelectChange('personId', e.target.value)}
          >
            <option value="">指定なし</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_frequent ? '(よく行く)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 利用タイプ選択 */}
        <div className="filter-select-group">
          <label className="filter-label">利用タイプ</label>
          <select
            className="filter-select"
            value={filter.useType}
            onChange={(e) => handleSelectChange('useType', e.target.value)}
          >
            <option value="">すべて</option>
            <option value="meal">食事</option>
            <option value="sweets">スイーツ・軽食</option>
            <option value="both">両方</option>
          </select>
        </div>

        {/* 店舗状態 */}
        <div className="filter-select-group">
          <label className="filter-label">店舗状態</label>
          <select
            className="filter-select"
            value={filter.shopStatus}
            onChange={(e) => handleSelectChange('shopStatus', e.target.value)}
          >
            <option value="">すべて</option>
            <option value="open">営業中</option>
            <option value="closed">閉店</option>
            <option value="moved">移転</option>
            <option value="unknown">不明</option>
          </select>
        </div>

        {/* リセットボタン & 件数表示 */}
        <div className="filter-actions">
          {isFiltered && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
              クリア
            </button>
          )}
          <span className="count-badge">
            {filteredCount} / {totalCount} 件
          </span>
        </div>
      </div>
    </div>
  );
};
