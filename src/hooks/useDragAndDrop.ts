import { useCallback } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import * as treeUtils from "../lib/treeUtils";

export function useDragAndDrop(
  tree: TreeNode[],
  setTree: (tree: TreeNode[]) => void,
  setIsSyncing: (syncing: boolean) => void
) {
  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedNodeId = active.id as string;
    const destDroppableId = over.id as string;

    const draggedNode = treeUtils.findNodeById(tree, draggedNodeId);
    if (!draggedNode) return;

    let destParentId: string | null = null;
    if (destDroppableId === "root") {
      destParentId = null;
    } else if (destDroppableId.includes("-children")) {
      destParentId = destDroppableId.split("-children")[0];
    } else {
      const destNode = treeUtils.findNodeById(tree, destDroppableId);
      if (destNode) {
        destParentId = destNode.hasChild ? destNode.id : treeUtils.findParentId(tree, destNode.id);
      }
    }

    const sourceParentId = treeUtils.findParentId(tree, draggedNodeId);
    if (sourceParentId === destParentId) return;

    const destParent = destParentId ? treeUtils.findNodeById(tree, destParentId) : null;
    let validMove = false;
    if (draggedNode.type === "department") {
      validMove = destParentId === null;
    } else if (draggedNode.type === "section") {
      validMove = destParentId !== null && destParent?.type === "department";
    } else if (draggedNode.type === "employee") {
      validMove = destParentId !== null && destParent?.type === "section";
    }

    if (!validMove) {
      console.error("Invalid move:", draggedNode.type, "to", destParentId);
      return;
    }

    setTree(treeUtils.moveNodeInTree(tree, draggedNodeId, destParentId));
    setIsSyncing(true);
    try {
      await api.moveNode(draggedNodeId, destParentId || "root");
      if (draggedNode.type === "department") {
        const rootNodes = await api.fetchRootNodes();
        setTree(treeUtils.mergeTreeWithFetched(tree, rootNodes));
      } else {
        if (sourceParentId) {
          const oldParentWithChildren = await api.fetchNodesWithChildren(sourceParentId);
          const updatedTree = treeUtils.updateChildrenById(tree, sourceParentId, oldParentWithChildren.children || []);
          setTree(updatedTree);
        }
        if (destParentId) {
          const newParentWithChildren = await api.fetchNodesWithChildren(destParentId);
          const updatedTree = treeUtils.updateChildrenById(tree, destParentId, newParentWithChildren.children || []);
          setTree(updatedTree);
        }
      }
    } catch (error) {
      console.error("Drag sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [tree, setTree, setIsSyncing]);

  return { onDragEnd };
}