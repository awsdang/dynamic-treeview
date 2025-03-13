import { ChevronDown, ChevronUp, ChevronRight, Dock, Folder, User, GripVertical, Loader2 } from "lucide-react";
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
  onReorder: (nodeId: string, direction: "up" | "down") => void;
  onSetChildren: (nodeId: string, children: TreeNode[]) => void;
  siblingsCount:number
}

export default function Tree({
  node,
  expandedNodes,
  level,
  onClick,
  onToggle,
  isExpanded,
  onNodeUpdate,
  index,
  onReorder,
  onSetChildren,
  siblingsCount
}: TreeProps) {
  const [isAddDialogOpen, setAddDialog] = useState(false);
  const [isEditDialogOpen, setEditDialog] = useState(false);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { index, type: node.type, parentId: node.parentId },
  });

  const {
    setNodeRef: setDroppableRef,
    isOver: isChildrenOver,
  } = useDroppable({
    id: `${node.id}-children`,
    data: { index, nodeId: node.id },
  });

  const {
    setNodeRef: setNodeDroppableRef,
    isOver: isNodeOver,
  } = useDroppable({
    id: node.id,
    data: { index, nodeId: node.id },
  });

  useEffect(() => {
    if (node.hasChild && isExpanded && !node.children) {
      loadChildNodes();
    }
  }, [node.id, node.hasChild, isExpanded]);

  const loadChildNodes = useCallback(async () => {
    setIsLoadingChildren(true);
    try {
      const children = await api.fetchChildNodes(node.id);
      onSetChildren(node.id, children);
    } catch (error) {
      console.error(`Failed to load children for ${node.id}:`, error);
    } finally {
      setIsLoadingChildren(false);
    }
  }, [node.id, onSetChildren]);

  const handleNodeUpdate = useCallback(
    (updatedNode: TreeNode) => {
      onNodeUpdate(updatedNode);
      setEditDialog(false);
    },
    [onNodeUpdate]
  );

  const handleNodeAdd = useCallback(
    async (newNode: TreeNode) => {
      try {
        const updatedChildren = [...(node.children || []), newNode];
        onSetChildren(node.id, updatedChildren);
        setAddDialog(false);
        await api.addNode(node.id, newNode);
      } catch (error) {
        console.error("Failed to add node:", error);
        onSetChildren(node.id, node.children || []);
      }
    },
    [node, onSetChildren]
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReorder(node.id, "up");
    },
    [node.id, onReorder]
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReorder(node.id, "down");
    },
    [node.id, onReorder]
  );

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node);
    },
    [node, onToggle]
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(node);
    },
    [node, onClick]
  );

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: 0.7,
      zIndex: 10,
      transition: "none",
    }
    : {
      transition: "background-color 0.2s ease",
      opacity: isDragging ? 0.5 : 1,
      backgroundColor: isNodeOver ? "#e6f7ff" : undefined,
    };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={(el) => {
          setDraggableRef(el);
          setNodeDroppableRef(el);
        }}
        className="group flex items-center py-1.5 cursor-pointer select-none hover:bg-accent/50"
        style={style}
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

        {index > 0 && (
          <Button variant="ghost" onClick={handleMoveUp}>
            <ChevronUp className="h-6 w-6 opacity-0 group-hover:opacity-100" />
          </Button>
        )}
        {index < siblingsCount - 1 && (
          <Button variant="ghost" onClick={handleMoveDown}>
            <ChevronDown className="h-6 w-6 opacity-0 group-hover:opacity-100" />
          </Button>
        )}
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
            minHeight: "20px",
            backgroundColor: isChildrenOver ? "#e6f7ff" : undefined,
            border: isChildrenOver ? "1px dashed #1890ff" : "none",
          }}
        >
          {isLoadingChildren ? (
             <div className="flex flex-row mx-2 gap-1 items-center">
             <Loader2 className="h-4 w-4 animate-spin" />
             <p className="text-sm text-muted-foreground">Loading...</p>
             </div>
          ) : node.children && node.children.length > 0 ? (
            node.children.map((childNode, childIndex) => (
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
                onReorder={onReorder}
                onSetChildren={onSetChildren}
                siblingsCount={(node.children as any).length}
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