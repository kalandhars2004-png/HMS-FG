'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Check, Plus, Loader2, Pill } from '@/components/ui/LucideIcon';

interface CategoryComboboxProps {
  value: string;
  onChange: (categoryId: string, categoryName: string) => void;
  categories: any[];
  loading?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onAddNew?: () => void;
}

const RECENT_KEY = 'recentCategories';

function getRecentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentIds(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 5)));
  } catch {}
}

export default function CategoryCombobox({
  value,
  onChange,
  categories,
  loading = false,
  placeholder = 'Select a category...',
  required: _required,
  error,
  onAddNew,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCategory = useMemo(
    () => categories.find(c => String(c.id) === String(value)),
    [categories, value]
  );

  const recentIds = useMemo(() => getRecentIds(), [isOpen]);

  const { recentCategories, otherCategories } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? categories.filter(c => c.name?.toLowerCase().includes(q))
      : categories;
    const recent: any[] = [];
    const other: any[] = [];
    const set = new Set(recentIds);
    for (const c of filtered) {
      (set.has(String(c.id)) ? recent : other).push(c);
    }
    recent.sort(
      (a, b) => recentIds.indexOf(String(a.id)) - recentIds.indexOf(String(b.id))
    );
    return { recentCategories: recent, otherCategories: other };
  }, [categories, search, recentIds]);

  const sections = useMemo(() => {
    const items: Array<
      | { type: 'header'; label: string }
      | { type: 'item'; category: any }
    > = [];
    if (!search.trim() && recentCategories.length > 0) {
      items.push({ type: 'header', label: 'Recently Used' });
      recentCategories.forEach(c => items.push({ type: 'item', category: c }));
      if (otherCategories.length > 0) {
        items.push({ type: 'header', label: 'All Categories' });
      }
    }
    otherCategories.forEach(c => items.push({ type: 'item', category: c }));
    return items;
  }, [recentCategories, otherCategories, search]);

  const itemCount = sections.filter(s => s.type === 'item').length;
  const hasSearch = search.trim().length > 0;
  const noResults = hasSearch && itemCount === 0;

  useEffect(() => {
    setFocusedIndex(-1);
  }, [search, isOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      ) as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (category: any) => {
      const catId = String(category.id);
      const recent = getRecentIds();
      saveRecentIds([catId, ...recent.filter(id => id !== catId)]);
      onChange(catId, category.name);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(i => Math.min(i + 1, itemCount - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < itemCount) {
            const items = sections.filter(s => s.type === 'item');
            handleSelect(items[focusedIndex].category);
          }
          break;
      }
    },
    [isOpen, itemCount, sections, focusedIndex, handleSelect]
  );

  let catCounter = -1;

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => !isOpen && setIsOpen(true)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm cursor-pointer transition-all duration-200 ${
          isOpen
            ? 'border-[#0F9291] shadow-[0_0_0_3px_rgba(15,146,145,0.1)]'
            : error
              ? 'border-red-300'
              : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search categories..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
            autoFocus
          />
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {selectedCategory ? (
              <>
                <Pill className="w-4 h-4 text-[#0F9291] shrink-0" />
                <span className="text-gray-900 truncate">
                  {selectedCategory.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 truncate">{placeholder}</span>
            )}
          </div>
        )}

        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>

      {error && !isOpen && (
        <p className="text-xs text-red-500 mt-1.5 px-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl z-[1050] animate-slideDown overflow-hidden">
          <div
            ref={listRef}
            className="max-h-64 overflow-auto py-1"
          >
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading categories...
              </div>
            )}

            {!loading &&
              sections.map(section => {
                if (section.type === 'header') {
                  return (
                    <div
                      key={section.label}
                      className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {section.label}
                    </div>
                  );
                }

                catCounter++;
                const cat = section.category;
                const isFocused = catCounter === focusedIndex;
                const isSelected = String(cat.id) === String(value);

                return (
                  <div
                    key={cat.id}
                    data-index={catCounter}
                    onClick={() => handleSelect(cat)}
                    onMouseEnter={() => setFocusedIndex(catCounter)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 ${
                      isSelected ? 'bg-[#0F9291]/5' : ''
                    } ${
                      isFocused && !isSelected
                        ? 'bg-[#F0FDF9]'
                        : 'hover:bg-[#F0FDF9]'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 shrink-0">
                      <Pill className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {cat.name}
                      </span>
                      {cat.status && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                            String(cat.status).toLowerCase() === 'active'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          {cat.status}
                        </span>
                      )}
                    </div>

                    {cat.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0F9291] shrink-0" />
                    )}
                  </div>
                );
              })}

            {!loading && noResults && (
              <div className="flex flex-col items-center py-8 text-center px-4">
                <Search className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-1">
                  No categories found
                </p>
                <p className="text-xs text-gray-400">
                  Try a different search term
                </p>
              </div>
            )}

            {!loading && !hasSearch && itemCount === 0 && categories.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center px-4">
                <Pill className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  No categories available
                </p>
              </div>
            )}
          </div>

          {!loading && noResults && onAddNew && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  onAddNew();
                  setIsOpen(false);
                  setSearch('');
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[#0F9291] hover:bg-[#0F9291]/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
