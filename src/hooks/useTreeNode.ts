import { useState, useEffect, useCallback } from "react";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";

export function useTreeNode(
  node: TreeNode,
  isExpanded: boolean,
  onSetChildren: (nodeId: string, children: TreeNode[]) => void,
  onNodeUpdate: (updatedNode: TreeNode) => void
) {
  const [isAddDialogOpen, setAddDialog] = useState(false);
  const [isEditDialogOpen, setEditDialog] = useState(false);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

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

  return {
    isAddDialogOpen,
    setAddDialog,
    isEditDialogOpen,
    setEditDialog,
    isLoadingChildren,
    loadChildNodes,
    handleNodeUpdate,
    handleNodeAdd,
  };
}