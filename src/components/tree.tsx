import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useTreeNode } from "@/hooks/useTreeNode";
import { TreeNode } from "@/types/tree";
import { TreeNodeContent } from "./treeNodeContent";
import { TreeNodeControls } from "./treeNodeControls";
import { TreeChildren } from "./treeChildren";
import { GripVertical } from "lucide-react";

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
  siblingsCount: number;
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
  siblingsCount,
}: TreeProps) {
  const {
    isAddDialogOpen,
    setAddDialog,
    isEditDialogOpen,
    setEditDialog,
    isLoadingChildren,
    handleNodeUpdate,
    handleNodeAdd,
  } = useTreeNode(node, isExpanded, onSetChildren, onNodeUpdate);

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

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };

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
        <div {...listeners} {...attributes} className="ml-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <TreeNodeContent
          node={node}
          isExpanded={isExpanded}
          onToggleClick={handleToggleClick}
          onNodeClick={handleNodeClick}
        />
        <TreeNodeControls
          node={node}
          index={index}
          siblingsCount={siblingsCount}
          onReorder={onReorder}
          isAddDialogOpen={isAddDialogOpen}
          setAddDialog={setAddDialog}
          isEditDialogOpen={isEditDialogOpen}
          setEditDialog={setEditDialog}
          handleNodeUpdate={handleNodeUpdate}
          handleNodeAdd={handleNodeAdd}
        />
      </div>
      <div ref={setDroppableRef}>
        <TreeChildren
          node={node}
          isExpanded={isExpanded}
          level={level}
          expandedNodes={expandedNodes}
          isLoadingChildren={isLoadingChildren}
          onClick={onClick}
          onToggle={onToggle}
          onNodeUpdate={onNodeUpdate}
          onReorder={onReorder}
          onSetChildren={onSetChildren}
          isOver={isChildrenOver}
        />
      </div>
    </div>
  );
}