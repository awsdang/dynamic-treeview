import { ChevronDown, ChevronRight, Dock, Folder, User } from "lucide-react";
import { TreeNode } from "@/types/tree";
import { Button } from "./ui/button";

interface TreeNodeContentProps {
  node: TreeNode;
  isExpanded: boolean;
  onToggleClick: (e: React.MouseEvent) => void;
  onNodeClick: (e: React.MouseEvent) => void;
}

export function TreeNodeContent({
  node,
  isExpanded,
  onToggleClick,
  onNodeClick,
}: TreeNodeContentProps) {
  return (
    <>
      <Button onClick={onToggleClick} type="button" variant="ghost">
        {node.hasChild &&
          (isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ))}
      </Button>
      <div onClick={onNodeClick} className="flex items-center gap-2 flex-1">
        {node.type === "employee" ? (
          <User className="h-4 w-4 text-blue-500 shrink-0" />
        ) : node.type === "section" ? (
          <Dock className="h-4 w-4 text-blue-500 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-blue-500 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
    </>
  );
}