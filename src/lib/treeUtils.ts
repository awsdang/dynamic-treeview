import { TreeNode } from "@/types/tree";

export const mergeTreeWithFetched = (currentTree: TreeNode[], fetchedTree: TreeNode[]): TreeNode[] => {
  return fetchedTree.map(fetchedNode => {
    const existingNode = currentTree.find(node => node.id === fetchedNode.id);
    if (existingNode && existingNode.children) {
      return { ...fetchedNode, children: existingNode.children };
    }
    return fetchedNode;
  });
};

export const updateTreeNode = (updatedNode: TreeNode, currentTree: TreeNode[]): TreeNode[] => {
  return currentTree.map(node => {
    if (node.id === updatedNode.id) {
      return { ...node, ...updatedNode };
    }
    if (node.children) {
      return { ...node, children: updateTreeNode(updatedNode, node.children) };
    }
    return node;
  });
};

export const updateChildrenById = (nodes: TreeNode[], nodeId: string, newChildren: TreeNode[]): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      const existingChildren = node.children || [];
      const mergedChildren = newChildren.map(newChild => {
        const existingChild = existingChildren.find(c => c.id === newChild.id);
        return existingChild && existingChild.children
          ? { ...newChild, children: existingChild.children }
          : newChild;
      });
      return { ...node, children: mergedChildren };
    }
    if (node.children) {
      return { ...node, children: updateChildrenById(node.children, nodeId, newChildren) };
    }
    return node;
  });
};

export const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const findParentId = (nodes: TreeNode[], nodeId: string): string | null => {
  const findParent = (nodes: TreeNode[], parentId: string | null): string | null => {
    parentId = parentId || null;
    for (const node of nodes) {
      if (node.children && node.children.some(child => child.id === nodeId)) {
        return node.id;
      }
      if (node.children) {
        const found = findParent(node.children, node.id);
        if (found) return found;
      }
    }
    return null;
  };
  return findParent(nodes, null);
};

export const updateNodeChildren = (nodes: TreeNode[], nodeId: string, children: TreeNode[]): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, nodeId, children) };
    }
    return node;
  });
};

export const moveNodeInTree = (nodes: TreeNode[], nodeId: string, newParentId: string | null): TreeNode[] => {
  const removeNode = (nodes: TreeNode[]): { nodes: TreeNode[], removed: TreeNode | null } => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        const removed = nodes[i];
        return { nodes: nodes.filter(n => n.id !== nodeId), removed };
      }
      if (nodes[i].children) {
        const result = removeNode(nodes[i].children || []);
        if (result.removed) {
          return { 
            nodes: nodes.map(n => n.id === nodes[i].id ? { ...n, children: result.nodes } : n), 
            removed: result.removed 
          };
        }
      }
    }
    return { nodes, removed: null };
  };

  const { nodes: updatedNodes, removed } = removeNode(nodes);
  if (!removed) return nodes;

  if (newParentId === null) {
    return [...updatedNodes, removed];
  } else {
    const addToParent = (nodes: TreeNode[], parentId: string): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), removed] };
        }
        if (node.children) {
          return { ...node, children: addToParent(node.children, parentId) };
        }
        return node;
      });
    };
    return addToParent(updatedNodes, newParentId);
  }
};

export const findNodeChildren = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node.children || [];
    }
    if (node.children) {
      const found = findNodeChildren(node.children, nodeId);
      if (found.length > 0) return found;
    }
  }
  return [];
};

export const reorderNodesLocally = (
  tree: TreeNode[], 
  nodeId: string, 
  direction: 'up' | 'down',
  findParentIdFn: (nodes: TreeNode[], nodeId: string) => string | null,
  findNodeChildrenFn: (nodes: TreeNode[], nodeId: string) => TreeNode[],
  updateNodeChildrenFn: (nodes: TreeNode[], nodeId: string, children: TreeNode[]) => TreeNode[]
): TreeNode[] => {
  const parentId = findParentIdFn(tree, nodeId);
  const siblings = parentId === null ? tree : findNodeChildrenFn(tree, parentId);

  const currentIndex = siblings.findIndex(n => n.id === nodeId);
  if (currentIndex === -1) return tree;

  const newIndex = direction === 'up'
    ? Math.max(0, currentIndex - 1)
    : Math.min(siblings.length - 1, currentIndex + 1);

  if (currentIndex === newIndex) return tree;

  const reorderedSiblings = [...siblings];
  const [movedNode] = reorderedSiblings.splice(currentIndex, 1);
  reorderedSiblings.splice(newIndex, 0, movedNode);

  if (parentId === null) {
    return reorderedSiblings;
  } else {
    return updateNodeChildrenFn(tree, parentId, reorderedSiblings);
  }
};