import { Loader2 } from "lucide-react";
import { TreeNode } from "@/types/tree";
import Tree from "./tree";

interface TreeChildrenProps {
  node: TreeNode;
  isExpanded: boolean;
  level: number;
  expandedNodes: Set<string>;
  isLoadingChildren: boolean;
  onClick: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
  onNodeUpdate: (updatedNode: TreeNode) => void;
  onReorder: (nodeId: string, direction: "up" | "down") => void;
  onSetChildren: (nodeId: string, children: TreeNode[]) => void;
  isOver: boolean;
}

export function TreeChildren({
  node,
  isExpanded,
  level,
  expandedNodes,
  isLoadingChildren,
  onClick,
  onToggle,
  onNodeUpdate,
  onReorder,
  onSetChildren,
  isOver,
}: TreeChildrenProps) {
  if (!isExpanded || !node.hasChild) return null;

  return (
    <div
      className="flex flex-col gap-2"
      style={{
        marginLeft: `${level + 1}rem`,
        minHeight: "20px",
        backgroundColor: isOver ? "#e6f7ff" : undefined,
        border: isOver ? "1px dashed #1890ff" : "none",
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
            siblingsCount={node.children?.length || 0}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No children</p>
      )}
    </div>
  );
}