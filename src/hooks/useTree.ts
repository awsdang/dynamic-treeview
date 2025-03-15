import { useState, useCallback, useEffect } from "react";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";

export function useTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const loadRootNodes = useCallback(async () => {
    try {
      const rootNodes = await api.fetchRootNodes();
      setTree(rootNodes);
    } catch (error) {
      console.error("Failed to load root nodes:", error);
    }
  }, []);

  useEffect(() => {
    loadRootNodes();
  }, [loadRootNodes]);

  const toggleNode = useCallback((node: TreeNode) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(node.id)) newExpanded.delete(node.id);
      else newExpanded.add(node.id);
      return newExpanded;
    });
    setSelectedNode(node);
  }, []);

  const handleClick = useCallback((node: TreeNode) => {
    setSelectedNode(node);
  }, []);

  return {
    tree,
    setTree,
    selectedNode,
    setSelectedNode,
    expandedNodes,
    setExpandedNodes,
    isSyncing,
    setIsSyncing,
    loadRootNodes,
    toggleNode,
    handleClick
  };
}