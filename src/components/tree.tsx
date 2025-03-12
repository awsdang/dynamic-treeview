import { ChevronDown, ChevronRight, Dock, Folder, User, GripVertical } from "lucide-react";
import { AddDialog, EditDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import { useCallback, useEffect, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface TreeProps {
  node: TreeNode;
  expandedNodes: Set<string>;
  level: number;
  onClick: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
  isExpanded: boolean;
  onNodeUpdate: (updatedNode: TreeNode) => void;
  index: number;
  droppableId: string;
}

export function Tree({
  node,
  expandedNodes,
  level,
  onClick,
  onToggle,
  isExpanded,
  onNodeUpdate,
  index,
  droppableId,
}: TreeProps) {
  const [childNodes, setChildNodes] = useState<TreeNode[]>([]);
  const [isAddDialogOpen, setAddDialog] = useState(false);
  const [isEditDialogOpen, setEditDialog] = useState(false);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  const { attributes, listeners, setNodeRef: setDraggableRef, transform } = useDraggable({
    id: node.id,
  });

  const { setNodeRef: setDroppableRef, isOver: isChildrenOver } = useDroppable({
    id: `${node.id}-children`,
    data: { index, nodeId: node.id },
  });

  const { setNodeRef: setNodeDroppableRef, isOver: isNodeOver } = useDroppable({
    id: node.id,
    data: { index, nodeId: node.id },
  });

  useEffect(() => {
    if (node.hasChild && childNodes.length === 0) {
      loadChildNodes(node.id);
    }
  }, [node.id, node.hasChild, node.childIds, childNodes.length]);

  const loadChildNodes = useCallback(
    async (id: string) => {
      setIsLoadingChildren(true);
      try {
        const children = await api.fetchChildNodes(id);
        setChildNodes(children);
        console.log(`Loaded children for ${id}:`, children);
        if (children.length > 0 && !node.childIds?.length) {
          onNodeUpdate({ ...node, childIds: children.map((child) => child.id) });
        }
      } catch (error) {
        console.error(`Failed to load children for ${id}:`, error);
      } finally {
        setIsLoadingChildren(false);
      }
    },
    [node, onNodeUpdate]
  );

  const handleNodeUpdate = useCallback(
    (updatedNode: TreeNode) => {
      onNodeUpdate(updatedNode);
      setEditDialog(false);
    },
    [onNodeUpdate]
  );

  const handleNodeAdd = useCallback(
    (newNode: TreeNode) => {
      setChildNodes((prev) => [...prev, newNode]);
      setAddDialog(false);
      onNodeUpdate({
        ...node,
        hasChild: true,
        childIds: [...(node.childIds || []), newNode.id],
      });
    },
    [node, onNodeUpdate]
  );

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };

  return (
    <div key={node.id} style={{ position: "relative" }}>
      <div
        ref={(el) => {
          setDraggableRef(el);
          setNodeDroppableRef(el);
        }}
        className="group flex items-center py-1.5 cursor-pointer select-none hover:bg-accent/50"
        style={{ ...style, backgroundColor: isNodeOver ? "#e6f7ff" : undefined }}
      >
        <div {...listeners} {...attributes} className="mr-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleToggleClick} type="button" variant="ghost">
          {node.hasChild &&
            (isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            ))}
        </Button>
        <div onClick={handleNodeClick} className="flex items-center gap-2 flex-1">
          {node.type === "employee" ? (
            <User className="h-4 w-4 text-blue-500 shrink-0" />
          ) : node.type === "section" ? (
            <Dock className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        <div className="flex gap-1">
          <EditDialog
            node={node}
            isOpen={isEditDialogOpen}
            setIsOpen={setEditDialog}
            onEdit={handleNodeUpdate}
          />
          {node.type !== "employee" && (
            <AddDialog
              node={node}
              isOpen={isAddDialogOpen}
              setIsOpen={setAddDialog}
              onAdd={handleNodeAdd}
            />
          )}
        </div>
      </div>

      {isExpanded && node.hasChild && (
        <div
          ref={setDroppableRef}
          className="flex flex-col gap-2"
          style={{
            marginLeft: `${level + 1}rem`,
            backgroundColor: isChildrenOver ? "#e6f7ff" : undefined,
          }}
        >
          {isLoadingChildren ? (
            <p className="text-sm text-muted-foreground">Loading children...</p>
          ) : childNodes.length > 0 ? (
            childNodes.map((childNode, childIndex) => (
              <Tree
                key={childNode.id}
                node={childNode}
                level={level + 1}
                expandedNodes={expandedNodes}
                isExpanded={expandedNodes.has(childNode.id)}
                onClick={onClick}
                onToggle={onToggle}
                index={childIndex}
                onNodeUpdate={onNodeUpdate}
                droppableId={`${node.id}-children`}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No children</p>
          )}
        </div>
      )}
    </div>
  );
}