import { useCallback } from "react";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import * as treeUtils from "../lib/treeUtils";

export function useNodeOperations(
  tree: TreeNode[],
  setTree: (tree: TreeNode[]) => void,
  selectedNode: TreeNode | null,
  setSelectedNode: (node: TreeNode | null) => void,
  setIsSyncing: (syncing: boolean) => void
) {
  const handleNodeUpdate = useCallback(
    (updatedNode: TreeNode) => {
      setTree(treeUtils.updateTreeNode(updatedNode, tree));
      if (selectedNode?.id === updatedNode.id) {
        setSelectedNode(updatedNode);
      }
      setIsSyncing(true);
      api.editNode(updatedNode.id, updatedNode)
        .then(() => api.fetchNodesWithChildren(updatedNode.id))
        .then(fetchedNode => {
          const updatedTree = treeUtils.updateTreeNode(fetchedNode, tree);
          setTree(updatedTree);
        })
        .catch(error => {
          console.error("Failed to sync node update:", error);
        })
        .finally(() => setIsSyncing(false));
    },
    [tree, setTree, setSelectedNode, setIsSyncing]
  );

  const handleSetChildren = useCallback(
    (nodeId: string, children: TreeNode[]) => {
      setTree(treeUtils.updateNodeChildren(tree, nodeId, children));
    },
    [tree, setTree]
  );

  return { handleNodeUpdate, handleSetChildren };
}