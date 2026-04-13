"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import BoardColumn from "./BoardColumn";
import CardDetailDrawer from "./CardDetailDrawer";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CustomField {
  id: string;
  field: { id: string; name: string };
  value: string | null;
}

interface CardData {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  labels: { label: Label }[];
  customFields: CustomField[];
  _count: { comments: number; notes: number };
}

interface ListData {
  id: string;
  name: string;
  color: string | null;
  position: number;
  cards: CardData[];
}

interface BoardData {
  id: string;
  name: string;
  lists: ListData[];
}

interface BoardViewProps {
  board: BoardData;
  userRole: string;
}

export default function BoardView({ board, userRole }: BoardViewProps) {
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Collect all unique labels
  const allLabels = useMemo(() => {
    const map = new Map<string, Label>();
    for (const list of board.lists) {
      for (const card of list.cards) {
        for (const cl of card.labels) {
          map.set(cl.label.id, cl.label);
        }
      }
    }
    return Array.from(map.values());
  }, [board.lists]);

  // Filter cards
  const filteredLists = useMemo(() => {
    return board.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const matchesSearch =
          !search ||
          card.title.toLowerCase().includes(search.toLowerCase()) ||
          card.description?.toLowerCase().includes(search.toLowerCase());

        const matchesLabel =
          !labelFilter ||
          card.labels.some((cl) => cl.label.id === labelFilter);

        return matchesSearch && matchesLabel;
      }),
    }));
  }, [board.lists, search, labelFilter]);

  return (
    <>
      {/* Filter Bar */}
      <div className="px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap bg-[#fafaf8] border-b border-[#e8e6df]">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b4b2a9]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#d3d1c7] bg-white text-xs text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#888780]" />
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="text-xs border border-[#d3d1c7] rounded-lg px-2 py-1.5 bg-white text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20"
          >
            <option value="">All labels</option>
            {allLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {(search || labelFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setLabelFilter("");
            }}
            className="text-xs text-[#3266ad] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 sm:p-6 min-h-[calc(100vh-12rem)]">
          {filteredLists.map((list) => (
            <BoardColumn
              key={list.id}
              list={list}
              onCardClick={(cardId) => setSelectedCardId(cardId)}
            />
          ))}
        </div>
      </div>

      {/* Card Detail Drawer */}
      {selectedCardId && (
        <CardDetailDrawer
          cardId={selectedCardId}
          userRole={userRole}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </>
  );
}
