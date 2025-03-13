import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import { NodeDetails } from "@/components/nodeDetails";
import Tree from "@/components/tree";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";

function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setSelectedNode(null);
  }, []);

  const mergeTreeWithFetched = useCallback((currentTree: TreeNode[], fetchedTree: TreeNode[]): TreeNode[] => {
    return fetchedTree.map(fetchedNode => {
      const existingNode = currentTree.find(node => node.id === fetchedNode.id);
      if (existingNode && existingNode.children) {
        return { ...fetchedNode, children: existingNode.children };
      }
      return fetchedNode;
    });
  }, []);

  const updateTreeNode = useCallback((updatedNode: TreeNode, currentTree: TreeNode[]): TreeNode[] => {
    return currentTree.map(node => {
      if (node.id === updatedNode.id) {
        return { ...node, ...updatedNode };
      }
      if (node.children) {
        return { ...node, children: updateTreeNode(updatedNode, node.children) };
      }
      return node;
    });
  }, []);

  const updateChildrenById = useCallback((nodes: TreeNode[], nodeId: string, newChildren: TreeNode[]): TreeNode[] => {
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
  }, []);

  const handleNodeUpdate = useCallback(
    (updatedNode: TreeNode) => {
      setTree(prev => updateTreeNode(updatedNode, prev));
      setSelectedNode(prev => (prev?.id === updatedNode.id ? updatedNode : prev));
      setIsSyncing(true);
      api.editNode(updatedNode.id, updatedNode)
        .then(() => api.fetchNodesWithChildren(updatedNode.id))
        .then(fetchedNode => {
          setTree(prev => updateTreeNode(fetchedNode, prev));
        })
        .catch(error => {
          console.error("Failed to sync node update:", error);
        })
        .finally(() => setIsSyncing(false));
    },
    [updateTreeNode]
  );

  useEffect(() => {
    loadRootNodes();
  }, []);

  const loadRootNodes = useCallback(async () => {
    try {
      const rootNodes = await api.fetchRootNodes();
      setTree(rootNodes);
    } catch (error) {
      console.error("Failed to load root nodes:", error);
    }
  }, []);

  const handleClick = useCallback((node: TreeNode) => {
    setSelectedNode(node);
  }, []);

  const performSearch = useCallback(async () => {
    if (searchQuery.trim() === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchNodes(searchQuery);
      setSearchResults(results);
      const parentsToExpand = new Set<string>();
      results.forEach((node) => {
        let parentId = node.parentId;
        while (parentId) {
          parentsToExpand.add(parentId);
          parentId = findParentId(parentId) || '';
        }
      });
      setExpandedNodes(prev => new Set([...prev, ...parentsToExpand]));
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery]);

  const toggleNode = useCallback((node: TreeNode) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(node.id)) {
        newExpanded.delete(node.id);
      } else {
        newExpanded.add(node.id);
      }
      return newExpanded;
    });
    setSelectedNode(node);
  }, []);

  const findParentId = useCallback((nodeId: string): string | null => {
    const findParent = (nodes: TreeNode[], parentId: string | null): string | null => {
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
    return findParent(tree, null);
  }, [tree]);

  const findNodeById = useCallback((nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const updateNodeChildren = useCallback((nodes: TreeNode[], nodeId: string, children: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateNodeChildren(node.children, nodeId, children) };
      }
      return node;
    });
  }, []);

  const handleSetChildren = useCallback((nodeId: string, children: TreeNode[]) => {
    setTree(prev => updateNodeChildren(prev, nodeId, children));
  }, [updateNodeChildren]);

  const moveNodeInTree = useCallback((nodes: TreeNode[], nodeId: string, newParentId: string | null): TreeNode[] => {
    const removeNode = (nodes: TreeNode[]): { nodes: TreeNode[], removed: TreeNode | null } => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === nodeId) {
          const removed = nodes[i];
          return { nodes: nodes.filter(n => n.id !== nodeId), removed };
        }
        if (nodes[i].children) {
          const result = removeNode(nodes[i].children || []);
          if (result.removed) {
            return { nodes: nodes.map(n => n.id === nodes[i].id ? { ...n, children: result.nodes } : n), removed: result.removed };
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
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedNodeId = active.id as string;
    const destDroppableId = over.id as string;

    const draggedNode = findNodeById(tree, draggedNodeId);
    if (!draggedNode) return;

    let destParentId: string | null = null;
    if (destDroppableId === "root") {
      destParentId = null;
    } else if (destDroppableId.includes("-children")) {
      destParentId = destDroppableId.split("-children")[0];
    } else {
      const destNode = findNodeById(tree, destDroppableId);
      if (destNode) {
        destParentId = destNode.hasChild ? destNode.id : findParentId(destNode.id);
      }
    }

    const sourceParentId = findParentId(draggedNodeId);
    if (sourceParentId === destParentId) return;

    const destParent = destParentId ? findNodeById(tree, destParentId) : null;
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

    setTree(prev => moveNodeInTree(prev, draggedNodeId, destParentId));
    setIsSyncing(true);
    try {
      await api.moveNode(draggedNodeId, destParentId || "root");
      if (draggedNode.type === "department") {
        const rootNodes = await api.fetchRootNodes();
        setTree(prev => mergeTreeWithFetched(prev, rootNodes));
      } else {
        const oldParentId = sourceParentId;
        const newParentId = destParentId;

        if (oldParentId) {
          const oldParentWithChildren = await api.fetchNodesWithChildren(oldParentId);
          setTree(prev => updateChildrenById(prev, oldParentId, oldParentWithChildren.children || []));
        }
        if (newParentId) {
          const newParentWithChildren = await api.fetchNodesWithChildren(newParentId);
          setTree(prev => updateChildrenById(prev, newParentId, newParentWithChildren.children || []));
        }
      }
    } catch (error) {
      console.error("Drag sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [findNodeById, findParentId, moveNodeInTree, mergeTreeWithFetched, updateChildrenById]);

  const findNodeChildren = useCallback((nodes: TreeNode[], nodeId: string): TreeNode[] => {
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
  }, []);

  const reorderNodesLocally = useCallback((nodeId: string, direction: 'up' | 'down'): TreeNode[] => {
    const parentId = findParentId(nodeId);
    const siblings = parentId === null ? tree : findNodeChildren(tree, parentId);

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
      return updateNodeChildren(tree, parentId, reorderedSiblings);
    }
  }, [tree, findParentId, findNodeChildren, updateNodeChildren]);

  const findParentIdFromTree = (nodes: TreeNode[], nodeId: string): string | null => {
    for (const node of nodes) {
      if (node.children && node.children.some(child => child.id === nodeId)) {
        return node.id;
      }
      if (node.children) {
        const found = findParentIdFromTree(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleReorder = useCallback((nodeId: string, direction: 'up' | 'down') => {
    // Compute the new tree state based on the reorder operation.
    const newLocalTree = reorderNodesLocally(nodeId, direction);
    // Update state immediately with the new order.
    setTree(newLocalTree);
    setIsSyncing(true);


    // Derive the parentId and siblings from the updated tree.
    const parentId = findParentIdFromTree(newLocalTree, nodeId);
    const siblings = parentId === null
      ? newLocalTree
      : findNodeChildren(newLocalTree, parentId);
    const newOrder = siblings.map(n => n.id);

    api.reorderNodes(parentId, newOrder)
      .then(async () => {
        if (parentId === null) {
          const rootNodes = await api.fetchRootNodes();
          setTree(prev => mergeTreeWithFetched(prev, rootNodes));
        } else {
          const parentWithChildren = await api.fetchNodesWithChildren(parentId);
          setTree(prev => updateChildrenById(prev, parentId, parentWithChildren.children || []));
        }
      })
      .catch(error => {
        console.error("Reorder sync failed:", error);
      })
      .finally(() => setIsSyncing(false));
  }, [reorderNodesLocally, mergeTreeWithFetched, updateChildrenById, findNodeChildren]);

  return (
    <div className="min-h-screen bg-background p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Department Tree</h1>
        {isSyncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[80vh] border rounded-md">
          <ResizablePanel defaultSize={60}>
            <div className="flex items-center justify-center p-6 border-b">
              <div className="relative w-full">
                <div className="flex flex-row w-full gap-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                    placeholder="Search departments and sections..."
                    className="pl-8 focus:ring-none focus:border-none"
                  />
                  <Button onClick={performSearch}>Search</Button>
                </div>
                {isSearching && (
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>{searchResults.length} results found</span>
                    <Button onClick={clearSearch}>Clear</Button>
                  </div>
                )}
              </div>
            </div>
            {isSearching ? (
              searchResults.length > 0 ? (
                searchResults.map((node, index) => (
                  <Tree
                    key={node.id}
                    expandedNodes={expandedNodes}
                    level={0}
                    onClick={handleClick}
                    onToggle={toggleNode}
                    node={node}
                    isExpanded={expandedNodes.has(node.id)}
                    onNodeUpdate={handleNodeUpdate}
                    index={index}
                    onReorder={handleReorder}
                    onSetChildren={handleSetChildren}
                    siblingsCount={searchResults.length}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No results found</p>
              )
            ) : tree.length > 0 ? (
              tree.map((node, index) => (
                <Tree
                  key={node.id}
                  expandedNodes={expandedNodes}
                  level={0}
                  onClick={handleClick}
                  onToggle={toggleNode}
                  node={node}
                  isExpanded={expandedNodes.has(node.id)}
                  onNodeUpdate={handleNodeUpdate}
                  index={index}
                  onReorder={handleReorder}
                  onSetChildren={handleSetChildren}
                  siblingsCount={tree.length}
                />
              ))
            ) : (
              <div className="flex flex-row mx-2 gap-1 items-center">
               <Loader2 className="h-4 w-4 animate-spin" />
               <p className="text-sm text-muted-foreground">Loading...</p>
               </div>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-black" />
          <ResizablePanel defaultSize={40}>
            <NodeDetails node={selectedNode} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DndContext>
    </div>
  );
}

export default App;