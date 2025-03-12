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
    console.log(`Toggled ${node.id, newExpanded}`);
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

    // Get all nodes to properly validate moves
    const allNodes = await api.getAllNodes();
    const draggedNode = allNodes.find((node) => node.id === draggedNodeId);
    if (!draggedNode) return;

    const sourceParentId = findParentId(draggedNodeId);
    let destParentId: string | null = null;
    
    // Determine the destination parent ID
    if (destDroppableId === "root") {
      destParentId = null; // Root level
    } else if (destDroppableId.includes("-children")) {
      // Dropping into a parent's children container
      destParentId = destDroppableId.split("-children")[0];
    } else {
      // If dropping onto another node, we need to determine if it's a sibling or potential parent
      const destNode = allNodes.find(node => node.id === destDroppableId);
      if (destNode) {
        if (destNode.hasChild) {
          // Dropping onto a parent-capable node (department or section)
          destParentId = destNode.id;
        } else {
          // Dropping onto a sibling, so we share the same parent
          destParentId = findParentId(destNode.id);
        }
      }
    }

    // Validate move based on node types
    let validMove = false;
    if (draggedNode.type === "department") {
      // Departments can only be at the root level
      if (destParentId === null) validMove = true;
    } else if (draggedNode.type === "section") {
      // Sections must be under a department
      if (destParentId !== null) {
        const destParent = allNodes.find(node => node.id === destParentId);
        if (destParent && destParent.type === "department") {
          validMove = true;
        }
      }
    } else if (draggedNode.type === "employee") {
      // Employees must be under a section
      if (destParentId !== null) {
        const destParent = allNodes.find(node => node.id === destParentId);
        if (destParent && destParent.type === "section") {
          validMove = true;
        }
      }
    }

    if (!validMove) {
      console.error("Invalid move:", draggedNode.type, "cannot be moved to", destParentId);
      return;
    }

    console.log(`Moving ${draggedNode.name} (${draggedNode.type}) from ${sourceParentId} to ${destParentId || "root"}`);

    // Handle reordering within the same parent
    if (sourceParentId === destParentId) {
      // Reordering logic
      let siblings;
      if (sourceParentId === null) {
        // Root level nodes (departments)
        siblings = tree.filter(node => node.type === "department");
      } else {
        // Children nodes
        siblings = await api.fetchChildNodes(sourceParentId);
      }

      const sourceIndex = siblings.findIndex(node => node.id === draggedNodeId);
      let destIndex = siblings.length - 1; // Default to end
      
      if (!destDroppableId.includes("-children")) {
        // If dropping onto a specific node, insert at that position
        destIndex = siblings.findIndex(node => node.id === destDroppableId);
        if (destIndex === -1) {
          destIndex = over.data.current?.index ?? siblings.length - 1;
        }
      }
      
      if (sourceIndex === destIndex) return; // No change needed
      
      const reorderedSiblings = [...siblings];
      const [movedNode] = reorderedSiblings.splice(sourceIndex, 1);
      reorderedSiblings.splice(destIndex > sourceIndex ? destIndex : destIndex + 1, 0, movedNode);
      
      if (sourceParentId === null) {
        setTree(reorderedSiblings);
      } else {
        await api.updateNode(sourceParentId, {
          childIds: reorderedSiblings.map(n => n.id)
        });
        
        // Refresh the tree to reflect changes
        const rootNodes = await api.fetchRootNodes();
        setTree(rootNodes);
      }
    } else {
      // Moving to a different parent
      await api.moveNode(draggedNodeId, destParentId || "root");
      
      // Refresh the tree to show the updated structure
      const rootNodes = await api.fetchRootNodes();
      setTree(rootNodes);
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
