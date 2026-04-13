"use client";

import { MessageSquare, StickyNote } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CardData {
  id: string;
  title: string;
  description: string | null;
  labels: { label: Label }[];
  customFields: { field: { name: string }; value: string | null }[];
  _count: { comments: number; notes: number };
}

interface ListData {
  id: string;
  name: string;
  color: string | null;
  cards: CardData[];
}

interface BoardColumnProps {
  list: ListData;
  onCardClick: (cardId: string) => void;
}

export default function BoardColumn({ list, onCardClick }: BoardColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col max-h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-2 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.color || "#888780" }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f5e5a] truncate">
          {list.name}
        </h3>
        <span className="text-[10px] bg-[#e8e6df] text-[#888780] rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
          {list.cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-4">
        {list.cards.length === 0 ? (
          <div className="text-xs text-[#b4b2a9] text-center py-8 italic">
            No cards
          </div>
        ) : (
          list.cards.map((card) => (
            <button
              key={card.id}
              onClick={() => onCardClick(card.id)}
              className="w-full text-left bg-white rounded-lg border border-[#d3d1c7] p-3 hover:border-[#888780] hover:shadow-sm transition-all cursor-pointer group"
            >
              {/* Labels */}
              {card.labels.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {card.labels.map((cl) => (
                    <span
                      key={cl.label.id}
                      className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: cl.label.color + "20",
                        color: cl.label.color,
                      }}
                    >
                      {cl.label.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h4 className="text-sm font-medium text-[#1a1a18] leading-snug mb-1 group-hover:text-[#3266ad] transition">
                {card.title}
              </h4>

              {/* Description preview */}
              {card.description && (
                <p className="text-[11px] text-[#888780] line-clamp-2 mb-2">
                  {card.description}
                </p>
              )}

              {/* Custom fields preview */}
              {card.customFields.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {card.customFields
                    .filter((cf) => cf.value)
                    .slice(0, 3)
                    .map((cf) => (
                      <span
                        key={cf.field.name}
                        className="text-[9px] bg-[#f5f4f0] text-[#5f5e5a] px-1.5 py-0.5 rounded border border-[#e8e6df]"
                      >
                        {cf.field.name}: {cf.value}
                      </span>
                    ))}
                  {card.customFields.filter((cf) => cf.value).length > 3 && (
                    <span className="text-[9px] text-[#b4b2a9]">
                      +{card.customFields.filter((cf) => cf.value).length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              {(card._count.comments > 0 || card._count.notes > 0) && (
                <div className="flex gap-3 text-[10px] text-[#b4b2a9]">
                  {card._count.comments > 0 && (
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {card._count.comments}
                    </span>
                  )}
                  {card._count.notes > 0 && (
                    <span className="flex items-center gap-0.5">
                      <StickyNote className="w-3 h-3" />
                      {card._count.notes}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
