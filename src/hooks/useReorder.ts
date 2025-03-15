import { useCallback } from "react";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import * as treeUtils from "../lib/treeUtils";

export function useReorder(
  tree: TreeNode[],
  setTree: (tree: TreeNode[] | ((prev: TreeNode[]) => TreeNode[])) => void,
  setIsSyncing: (syncing: boolean) => void
) {
  const handleReorder = useCallback((nodeId: string, direction: 'up' | 'down') => {
    const newLocalTree = treeUtils.reorderNodesLocally(
      tree,
      nodeId,
      direction,
      treeUtils.findParentId,
      treeUtils.findNodeChildren,
      treeUtils.updateNodeChildren
    );
    setTree(newLocalTree);
    setIsSyncing(true);

    const parentId = treeUtils.findParentId(newLocalTree, nodeId);
    const siblings = parentId === null
      ? newLocalTree
      : treeUtils.findNodeChildren(newLocalTree, parentId);
    const newOrder = siblings.map(n => n.id);

    api.reorderNodes(parentId, newOrder)
      .then(async () => {
        if (parentId === null) {
          const rootNodes = await api.fetchRootNodes();
          setTree((prev: TreeNode[]) => treeUtils.mergeTreeWithFetched(prev, rootNodes));
        } else {
          const parentWithChildren = await api.fetchNodesWithChildren(parentId);
          setTree((prev: TreeNode[]) => treeUtils.updateChildrenById(prev, parentId, parentWithChildren.children || []));
        }
      })
      .catch(error => {
        console.error("Reorder sync failed:", error);
      })
      .finally(() => setIsSyncing(false));
  }, [tree, setTree, setIsSyncing]);

  return { handleReorder };
}