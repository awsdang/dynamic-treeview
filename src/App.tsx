import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";
import { NodeDetails } from "@/components/nodeDetails";
import { Tree } from "@/components/tree";
import { DndContext, pointerWithin, DragEndEvent } from "@dnd-kit/core";

function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log("Tree state updated:", tree);
  }, [tree]);

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setSelectedNode(null);
  };

  const handleNodeUpdate = (updatedNode: TreeNode) => {
    setTree((prevData) =>
      prevData.map((node) => (node.id === updatedNode.id ? { ...updatedNode } : node))
    );
    if (selectedNode?.id === updatedNode.id) setSelectedNode(updatedNode);
  };

  useEffect(() => {
    loadRootNodes();
  }, []);

  async function loadRootNodes() {
    const rootNodes = await api.fetchRootNodes();
    setTree(rootNodes);
    console.log("Loaded root nodes:", rootNodes);
  }

  function handleClick(node: TreeNode) {
    console.log("Selected node:", node);
    setSelectedNode(node);
  }

  const performSearch = async () => {
    if (searchQuery.trim() === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchNodes(searchQuery);
      setSearchResults(results);
      console.log("Search results:", results);

      const parentsToExpand = new Set<string>();
      results.forEach((node) => {
        let parentId = node.parentId;
        while (parentId) {
          parentsToExpand.add(parentId);
          parentId = findParentId(parentId);
        }
      });
      setExpandedNodes((prev) => new Set([...prev, ...parentsToExpand]));
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const toggleNode = async (node: TreeNode) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
    }
    setExpandedNodes(newExpanded);
    setSelectedNode(node);
    console.log(`Toggled ${node.id}, new expanded:`, Array.from(newExpanded));
  };

  const findParentId = (nodeId: string): string | null => {
    const allNodes = flattenTree(tree);
    return allNodes.find((node) => node.childIds?.includes(nodeId))?.id || null;
  };

  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    nodes.forEach((node) => {
      result.push(node);
      if (node.childIds) {
        const children = tree.filter((n) => node.childIds!.includes(n.id));
        result.push(...flattenTree(children));
      }
    });
    return result;
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedNodeId = active.id as string;
    const destDroppableId = over.id as string;

    const allNodes = await api.getAllNodes(); // Fetch all nodes for accuracy
    const draggedNode = allNodes.find((node) => node.id === draggedNodeId);
    if (!draggedNode) return;

    const sourceParentId = findParentId(draggedNodeId);
    const destParentId =
      destDroppableId === "root"
        ? null
        : destDroppableId.includes("-children")
        ? destDroppableId.split("-children")[0]
        : destDroppableId;

    console.log(`Dragging ${draggedNodeId} (${draggedNode.type}) from ${sourceParentId} to ${destParentId}`);

    if (sourceParentId === destParentId) {
      // Reordering within the same parent
      const siblings = sourceParentId
        ? await api.fetchChildNodes(sourceParentId)
        : tree.filter((node) => !findParentId(node.id));
      const sourceIndex = siblings.findIndex((node) => node.id === draggedNodeId);
      const destIndex = over.data.current?.index ?? siblings.length - 1;

      if (sourceIndex === destIndex) return;

      const reorderedSiblings = Array.from(siblings);
      const [movedNode] = reorderedSiblings.splice(sourceIndex, 1);
      reorderedSiblings.splice(destIndex, 0, movedNode);

      if (sourceParentId) {
        await api.updateNode(sourceParentId, {
          childIds: reorderedSiblings.map((n) => n.id),
        });
        setTree((prev) =>
          prev.map((node) =>
            node.id === sourceParentId
              ? { ...node, childIds: reorderedSiblings.map((n) => n.id) }
              : node
          )
        );
      } else {
        setTree(reorderedSiblings);
      }
    } else {
      // Moving to a different parent
      await api.moveNode(draggedNodeId, destParentId || "root");

      // Update the tree state
      setTree((prev) => {
        let updatedTree = prev.map((node) => {
          if (node.id === sourceParentId) {
            return {
              ...node,
              childIds: node.childIds?.filter((id) => id !== draggedNodeId) || [],
            };
          }
          if (node.id === destParentId) {
            return {
              ...node,
              childIds: [...(node.childIds || []), draggedNodeId],
            };
          }
          return node;
        });

        if (!sourceParentId) {
          updatedTree = updatedTree.filter((node) => node.id !== draggedNodeId);
        }
        if (!destParentId) {
          updatedTree = [...updatedTree, { ...draggedNode, parentId: undefined }];
        }

        return updatedTree.filter((node) => !findParentId(node.id));
      });

      // Sync children for affected parents
      if (sourceParentId) {
        const sourceChildren = await api.fetchChildNodes(sourceParentId);
        setTree((prev) =>
          prev.map((node) =>
            node.id === sourceParentId
              ? { ...node, childIds: sourceChildren.map((n) => n.id) }
              : node
          )
        );
      }
      if (destParentId) {
        const destChildren = await api.fetchChildNodes(destParentId);
        setTree((prev) =>
          prev.map((node) =>
            node.id === destParentId
              ? { ...node, childIds: destChildren.map((n) => n.id) }
              : node
          )
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Department Tree</h1>
      </div>
      <DndContext collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
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
                    droppableId="search-results"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No results found</p>
              )
            ) : tree.length > 0 ? (
              tree
                .filter((node) => !findParentId(node.id))
                .map((node, index) => (
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
                    droppableId="root"
                  />
                ))
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
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