/**
 * Sidebar — left panel furniture library.
 *
 * Contains search bar, category tabs, scrollable furniture grid,
 * favorites and recently used sections. Supports drag-to-add and click-to-add.
 */
import { useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import REGISTRY, {
  getFurnitureByCategory,
  searchFurniture,
} from '../../data/furnitureRegistry';
import { CATEGORIES, FLOORING_MATERIAL_OPTIONS, FLOORING_MATERIALS, WALL_MATERIAL_OPTIONS, WALL_MATERIALS } from '../../constants';
import SearchBar from '../ui/SearchBar';
import { useDragSource } from '../../hooks/useDragDrop';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette } from 'lucide-react';
import { getCatalogItem } from '../../utils/catalogUtils';
import FurnitureThumbnail from './FurnitureThumbnail';

/** Individual furniture card in the library grid. */
function FurnitureCard({ item, index }) {
  const addFurniture = useStore((s) => s.addFurniture);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isFavorite = favorites.includes(item.id);

  const dragProps = useDragSource(item.id);

  const handleClick = () => {
    addFurniture(item.id, [0, 0, 0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="group relative w-[calc(50%-5px)] aspect-square shrink-0 bg-white border border-slate-200 rounded-md cursor-pointer transition-all duration-300 overflow-hidden flex flex-col hover:border-[#c7a66a] hover:shadow-[0_8px_22px_rgba(199,166,106,0.16)] hover:-translate-y-0.5"
      onClick={handleClick}
      title={`Click to add ${item.name} or drag into room`}
      {...dragProps}
    >
      <div className="flex-1 flex items-center justify-center bg-[#e9e6df] relative overflow-hidden">
        <FurnitureThumbnail item={getCatalogItem(item) ?? item} />
      </div>
      <div className="py-1.5 px-2 h-7 shrink-0 flex items-center justify-center bg-[#f4f1ea] border-t border-slate-200">
        <span className="text-[10px] font-medium text-slate-700 block overflow-hidden text-ellipsis whitespace-nowrap text-center w-full">{item.name}</span>
      </div>
      <button
        className={`absolute top-1 right-1 bg-white/80 text-slate-400 text-xs py-0.5 px-1 rounded transition-all backdrop-blur-[2px] opacity-0 group-hover:opacity-100 hover:text-amber-500 z-20 shadow-sm ${isFavorite ? 'text-amber-500! opacity-100!' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(item.id);
        }}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </motion.div>
  );
}

function getCategoryIcon(category) {
  const cat = CATEGORIES.find((c) => c.id === category);
  return cat ? cat.icon : '📦';
}

export default function Sidebar() {
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const favorites = useStore((s) => s.favorites);
  const recentlyUsed = useStore((s) => s.recentlyUsed);
  const [activeTab, setActiveTab] = useState('browse');
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const room = useStore((s) => s.room);
  const setRoomAppearance = useStore((s) => s.setRoomAppearance);
  const lightPreset = useStore((s) => s.lightPreset);
  const setLightPreset = useStore((s) => s.setLightPreset);

  // Filter furniture based on search + category
  const filteredItems = useMemo(() => {
    let items;
    if (searchQuery.trim()) {
      items = searchFurniture(searchQuery);
    } else {
      items = getFurnitureByCategory(selectedCategory);
    }
    return items;
  }, [searchQuery, selectedCategory]);

  // Favorites list
  const favoriteItems = useMemo(
    () => REGISTRY.filter((item) => favorites.includes(item.id)),
    [favorites]
  );

  // Recently used list
  const recentItems = useMemo(
    () =>
      recentlyUsed
        .map((id) => REGISTRY.find((item) => item.id === id))
        .filter(Boolean),
    [recentlyUsed]
  );

  const tabs = [
    { id: 'browse', label: 'Browse', icon: '🔍' },
    { id: 'favorites', label: 'Favorites', icon: '★' },
    { id: 'recent', label: 'Recent', icon: '🕐' }
  ];

  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-64 flex-none flex flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden z-40" 
      id="furniture-sidebar"
    >
      <div className="pt-5 px-4 pb-0 shrink-0">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4 tracking-tight">Furniture Library</h2>
        <div className="flex gap-1 bg-slate-100/70 border border-slate-200/60 rounded-md p-0.5 mb-4 shadow-sm relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-colors whitespace-nowrap z-10 ${activeTab === tab.id ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium hover:text-slate-900'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'browse' && (
        <>
          <SearchBar />

          {/* Category filters */}
          <div className="flex overflow-x-auto gap-2 px-4 pb-3 hide-scrollbar snap-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`flex items-center gap-1.5 border py-1.5 px-3 rounded-full transition-all whitespace-nowrap snap-start shrink-0 ${
                  selectedCategory === cat.id ? 'bg-slate-800 border-slate-800 text-white font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
                title={cat.label}
              >
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Furniture grid */}
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-wrap gap-3 content-start custom-scrollbar">
            {filteredItems.length > 0 ? (
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <FurnitureCard key={item.id} item={item} index={index} />
                ))}
              </AnimatePresence>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 p-8 text-slate-400 text-[13px] w-full">
                <span className="text-2xl">🔍</span>
                <span>No furniture found</span>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'favorites' && (
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-wrap gap-3 content-start custom-scrollbar">
          {favoriteItems.length > 0 ? (
            <AnimatePresence>
              {favoriteItems.map((item, index) => (
                <FurnitureCard key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 p-8 text-slate-400 text-[13px] w-full">
              <span className="text-2xl">⭐</span>
              <span>No favorites yet</span>
              <span className="text-[11px] text-slate-400 text-center">
                Click the star on any furniture to favorite it
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-wrap gap-3 content-start custom-scrollbar">
          {recentItems.length > 0 ? (
            <AnimatePresence>
              {recentItems.map((item, index) => (
                <FurnitureCard key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 p-8 text-slate-400 text-[13px] w-full">
              <span className="text-2xl">🕐</span>
              <span>No recent items</span>
              <span className="text-[11px] text-slate-400 text-center">
                Add furniture to your room to see them here
              </span>
            </div>
          )}
        </div>
      )}

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600"
          onClick={() => setAppearanceOpen((open) => !open)}
          aria-expanded={appearanceOpen}
        >
          <span className="flex items-center gap-2"><Palette className="size-3.5" aria-hidden="true" /> Room Appearance</span>
          <ChevronDown className={`size-3.5 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {appearanceOpen && (
          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            <div className="col-span-3 grid grid-cols-2 gap-1.5">
              {FLOORING_MATERIAL_OPTIONS.map((materialId) => {
                const material = FLOORING_MATERIALS[materialId];
                const active = room.floorMaterial === materialId;
                return (
                  <button
                    key={materialId}
                    type="button"
                    onClick={() => setRoomAppearance({ floorMaterial: materialId, floorColor: material.color })}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${active ? 'border-[#c7a66a] bg-[#c7a66a]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    aria-pressed={active}
                  >
                    <span className="size-6 shrink-0 rounded-sm border border-black/10" style={{ backgroundColor: material.color }} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-semibold text-slate-700">{material.label}</span>
                      <span className="block text-[9px] text-slate-400">{material.price ? `+₹${material.price.toLocaleString('en-IN')}` : 'Included'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="col-span-3 border-t border-slate-200 pt-2">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>Wall material</span>
                <span className="text-[9px] font-medium text-slate-400">Finish</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {WALL_MATERIAL_OPTIONS.map((materialId) => {
                  const material = WALL_MATERIALS[materialId];
                  const active = room.wallMaterial === materialId;
                  return (
                    <button
                      key={materialId}
                      type="button"
                      onClick={() => setRoomAppearance({ wallMaterial: materialId, wallColor: material.color })}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${active ? 'border-[#c7a66a] bg-[#c7a66a]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      aria-pressed={active}
                    >
                      <span className="size-6 shrink-0 rounded-sm border border-black/10" style={{ backgroundColor: material.color }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-semibold text-slate-700">{material.label}</span>
                        <span className="block text-[9px] text-slate-400">{material.finish}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="col-span-3 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
              <span>Custom wall tone</span>
              <input
                type="color"
                value={room.wallColor || '#d8d2c6'}
                onChange={(event) => setRoomAppearance({ wallColor: event.target.value, wallMaterial: 'warmPaint' })}
                className="h-6 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                aria-label="Custom wall tone"
              />
            </label>
          </div>
        )}
      </div>

      {/* Item count */}
      <div className="py-3 px-4 border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-500 shrink-0 flex justify-center">
        {activeTab === 'browse' && (
          <span>{filteredItems.length} items available</span>
        )}
        {activeTab === 'favorites' && (
          <span>{favoriteItems.length} saved favorites</span>
        )}
        {activeTab === 'recent' && (
          <span>{recentItems.length} recently used</span>
        )}
      </div>
    </motion.aside>
  );
}
