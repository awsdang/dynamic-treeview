import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddDialog } from "./addDialog";
import { EditDialog } from "./editDialog";
import { TreeNode } from "@/types/tree";

interface TreeNodeControlsProps {
  node: TreeNode;
  index: number;
  siblingsCount: number;
  onReorder: (nodeId: string, direction: "up" | "down") => void;
  isAddDialogOpen: boolean;
  setAddDialog: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setEditDialog: (open: boolean) => void;
  handleNodeUpdate: (updatedNode: TreeNode) => void;
  handleNodeAdd: (newNode: TreeNode) => void;
}

export function TreeNodeControls({
  node,
  index,
  siblingsCount,
  onReorder,
  isAddDialogOpen,
  setAddDialog,
  isEditDialogOpen,
  setEditDialog,
  handleNodeUpdate,
  handleNodeAdd,
}: TreeNodeControlsProps) {
  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder(node.id, "up");
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder(node.id, "down");
  };

  return (
    <>
      
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
    </>
  );
}