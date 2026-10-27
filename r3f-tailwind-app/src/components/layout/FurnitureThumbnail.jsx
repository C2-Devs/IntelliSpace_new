import React from 'react';
import { useFurnitureThumbnail } from '../../utils/furnitureThumbnailService';

export default function FurnitureThumbnail({ item }) {
  const thumbnail = useFurnitureThumbnail(item);

  if (!item?.modelPath) {
    return <div className="size-8 animate-pulse rounded-full bg-slate-300/60" aria-hidden="true" />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-1 bg-[#e9e6df]" aria-label={`${item.name} preview`}>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={item.name}
          className="w-full h-full object-contain pointer-events-none transition-opacity duration-200"
          loading="lazy"
        />
      ) : (
        <div className="size-8 animate-pulse rounded-full bg-slate-300/60" aria-hidden="true" />
      )}
      <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded border border-slate-500/70 bg-slate-950/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
        Preview
      </span>
    </div>
  );
}
