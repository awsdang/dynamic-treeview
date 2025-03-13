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
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";

function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());


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
          parentId = findParentId(parentId) || '';
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
    
    setIsMoving(true);
    const draggedNodeId = active.id as string;
    const destDroppableId = over.id as string;
  
    const allNodes = await api.getAllNodes();
    const draggedNode = allNodes.find((node) => node.id === draggedNodeId);
    if (!draggedNode) {
      setIsMoving(false);
      return;
    }
  
    const sourceParentId = findParentId(draggedNodeId);
    let destParentId: string | null = null;
  
    // Determine drop target
    if (destDroppableId === "root") {
      destParentId = null;
    } else if (destDroppableId.includes("-children")) {
      destParentId = destDroppableId.split("-children")[0];
    } else {
      const destNode = allNodes.find(node => node.id === destDroppableId);
      if (destNode) {
        if (destNode.hasChild) {
          destParentId = destNode.id;
        } else {
          destParentId = findParentId(destNode.id);
        }
      }
    }
  
    // Validate move
    let validMove = false;
    if (draggedNode.type === "department") {
      if (destParentId === null) validMove = true;
    } else if (draggedNode.type === "section") {
      if (destParentId !== null) {
        const destParent = allNodes.find(node => node.id === destParentId);
        if (destParent && destParent.type === "department") validMove = true;
      }
    } else if (draggedNode.type === "employee") {
      if (destParentId !== null) {
        const destParent = allNodes.find(node => node.id === destParentId);
        if (destParent && destParent.type === "section") validMove = true;
      }
    }
  
    if (!validMove) {
      console.error("Invalid move:", draggedNode.type, "to", destParentId);
      setIsMoving(false);
      return;
    }
  
    try {
      if (sourceParentId === destParentId) {
        // Do nothing if it's the same parent - no reordering allowed
        setIsMoving(false);
        return;
      }
  
      // Moving to different parent
      await api.moveNode(draggedNodeId, destParentId || "root");
      const rootNodes = await api.fetchRootNodes();
      setTree(rootNodes);
    } catch (error) {
      console.error("Drag operation failed:", error);
    } finally {
      setIsMoving(false);
    }
  };


  const handleReorder = async (nodeId: string, direction: 'up' | 'down') => {
    const allNodes = await api.getAllNodes();
    setIsMoving(true);
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return;

    const parentId = findParentId(nodeId);
    const siblings = parentId === null 
      ? [...tree]
      : await api.fetchChildNodes(parentId);

    const currentIndex = siblings.findIndex(n => n.id === nodeId);
    if (currentIndex === -1) return;

    // Calculate new index
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(siblings.length - 1, currentIndex + 1);

    if (currentIndex === newIndex) return;

    // Reorder siblings
    const reorderedSiblings = [...siblings];
    const [movedNode] = reorderedSiblings.splice(currentIndex, 1);
    reorderedSiblings.splice(newIndex, 0, movedNode);

    // Update API and tree state
    try {
      if (parentId === null) {
        setTree(reorderedSiblings);
        await api.reorderNodes(null, reorderedSiblings.map(n => n.id));
      } else {
        await api.reorderNodes(parentId, reorderedSiblings.map(n => n.id));
        const rootNodes = await api.fetchRootNodes();
        setTree(rootNodes);
      }
      setIsMoving(false);
    } catch (error) {
      console.error("Reorder failed:", error);
    }
  };

  useEffect(() => {
    console.log("Tree state updated:", tree);
  }, [tree, isMoving]);


  
  return (
    <div className="min-h-screen bg-background p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Department Tree</h1>
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
                    droppableId="search-results"
                    onReorder={handleReorder}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No results found</p>
              )
            ) : !isMoving && tree.length > 0 ? (
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
                    droppableId="root"
                    onReorder={handleReorder}
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
