"use client";

import { useState, type ReactNode } from "react";
import { MessageSquare, StickyNote, Plus, X, Loader2, GripVertical } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

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
  canEdit: boolean;
  onCardClick: (cardId: string) => void;
  onCardCreated: () => void;
  droppablePlaceholder?: ReactNode;
}

export default function BoardColumn({
  list,
  canEdit,
  onCardClick,
  onCardCreated,
  droppablePlaceholder,
}: BoardColumnProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateCard() {
    if (!newCardTitle.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newCardTitle.trim(), listId: list.id }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCardTitle("");
        setShowAddCard(false);
        onCardCreated();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col max-h-[calc(100vh-14rem)]">
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
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2 min-h-[60px]">
        {list.cards.length === 0 && !showAddCard ? (
          <div className="text-xs text-[#b4b2a9] text-center py-8 italic">
            No cards
          </div>
        ) : (
          list.cards.map((card, index) => (
            <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!canEdit}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={`bg-white rounded-lg border p-3 transition-all group ${
                    snapshot.isDragging
                      ? "border-[#3266ad] shadow-lg ring-2 ring-[#3266ad]/20 rotate-[2deg]"
                      : "border-[#d3d1c7] hover:border-[#888780] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-1">
                    {/* Drag handle */}
                    {canEdit && (
                      <div
                        {...provided.dragHandleProps}
                        className="mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#f5f4f0] transition cursor-grab active:cursor-grabbing flex-shrink-0"
                      >
                        <GripVertical className="w-3 h-3 text-[#b4b2a9]" />
                      </div>
                    )}
                    {!canEdit && <div {...provided.dragHandleProps} />}

                    {/* Card content — clickable */}
                    <button
                      onClick={() => onCardClick(card.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
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
                  </div>
                </div>
              )}
            </Draggable>
          ))
        )}
        {droppablePlaceholder}
      </div>

      {/* Add Card Section */}
      {canEdit && (
        <div className="px-1 pb-2 flex-shrink-0">
          {showAddCard ? (
            <div className="bg-white rounded-lg border border-[#d3d1c7] p-2 space-y-2">
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCard();
                  if (e.key === "Escape") {
                    setShowAddCard(false);
                    setNewCardTitle("");
                  }
                }}
                placeholder="Enter card title..."
                autoFocus
                className="w-full px-2.5 py-1.5 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateCard}
                  disabled={!newCardTitle.trim() || creating}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a18] text-white text-xs rounded-lg hover:bg-[#2a2a28] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {creating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add Card
                </button>
                <button
                  onClick={() => {
                    setShowAddCard(false);
                    setNewCardTitle("");
                  }}
                  className="p-1.5 rounded hover:bg-[#f5f4f0] transition"
                >
                  <X className="w-4 h-4 text-[#888780]" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-[#888780] hover:text-[#1a1a18] hover:bg-[#f5f4f0] rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add a card
            </button>
          )}
        </div>
      )}
    </div>
  );
}
