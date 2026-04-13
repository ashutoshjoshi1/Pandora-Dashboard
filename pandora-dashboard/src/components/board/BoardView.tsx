"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // Local optimistic state for lists/cards during drag
  const [localLists, setLocalLists] = useState<ListData[] | null>(null);

  const canEdit = userRole === "admin" || userRole === "editor";

  // Use localLists (optimistic) if available, otherwise server data
  const listsSource = localLists ?? board.lists;

  // Collect all unique labels
  const allLabels = useMemo(() => {
    const map = new Map<string, Label>();
    for (const list of listsSource) {
      for (const card of list.cards) {
        for (const cl of card.labels) {
          map.set(cl.label.id, cl.label);
        }
      }
    }
    return Array.from(map.values());
  }, [listsSource]);

  // Filter cards
  const filteredLists = useMemo(() => {
    return listsSource.map((list) => ({
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
  }, [listsSource, search, labelFilter]);

  function handleCardCreated() {
    router.refresh();
  }

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      // Build optimistic update
      const newLists = listsSource.map((list) => ({
        ...list,
        cards: [...list.cards],
      }));

      const sourceList = newLists.find((l) => l.id === source.droppableId);
      const destList = newLists.find((l) => l.id === destination.droppableId);

      if (!sourceList || !destList) return;

      const [movedCard] = sourceList.cards.splice(source.index, 1);
      if (!movedCard) return;

      destList.cards.splice(destination.index, 0, movedCard);

      // Reindex positions
      sourceList.cards.forEach((c, i) => (c.position = i));
      destList.cards.forEach((c, i) => (c.position = i));

      setLocalLists(newLists);

      try {
        await fetch("/api/cards/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: draggableId,
            sourceListId: source.droppableId,
            destinationListId: destination.droppableId,
            newPosition: destination.index,
          }),
        });
        router.refresh();
      } catch {
        // Revert on failure
        setLocalLists(null);
      }
    },
    [listsSource, router]
  );

  // Reset local state when server data updates
  const boardListsKey = board.lists.map((l) => l.id + l.cards.length).join(",");
  useMemo(() => {
    setLocalLists(null);
  }, [boardListsKey]);

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

      {/* Board Columns with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 sm:p-6 min-h-[calc(100vh-12rem)]">
            {filteredLists.map((list) => (
              <Droppable key={list.id} droppableId={list.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-shrink-0 w-72 rounded-xl transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-[#e8e6df]/50 ring-2 ring-[#3266ad]/20"
                        : ""
                    }`}
                  >
                    <BoardColumn
                      list={list}
                      canEdit={canEdit}
                      onCardClick={(cardId) => setSelectedCardId(cardId)}
                      onCardCreated={handleCardCreated}
                      droppablePlaceholder={provided.placeholder}
                    />
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Card Detail Drawer */}
      {selectedCardId && (
        <CardDetailDrawer
          cardId={selectedCardId}
          userRole={userRole}
          boardLists={board.lists.map((l) => ({ id: l.id, name: l.name }))}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </>
  );
}
