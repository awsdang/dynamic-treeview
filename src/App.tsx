import { Loader2 } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect } from "react";
import { useTree } from "@/hooks/useTree";
import { useSearch } from "@/hooks/useSearch";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useNodeOperations } from "@/hooks/useNodeOperations";
import { useReorder } from "@/hooks/useReorder";
import { SearchBar } from "@/components/searchBar";
import Tree from "@/components/tree";
import { NodeDetails } from "@/components/nodeDetails";
import * as treeUtils from "@/lib/treeUtils";
import Header from "./components/header";

function App() {
  const {
    tree,
    setTree,
    selectedNode,
    setSelectedNode,
    expandedNodes,
    setExpandedNodes,
    isSyncing,
    setIsSyncing,
    toggleNode,
    handleClick,
  } = useTree();

  const {
    isSearching,
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    performSearch,
  } = useSearch();

  const { onDragEnd } = useDragAndDrop(tree, setTree, setIsSyncing);
  const { handleNodeUpdate, handleSetChildren } = useNodeOperations(
    tree,
    setTree,
    selectedNode,
    setSelectedNode,
    setIsSyncing
  );
  const { handleReorder } = useReorder(tree, setTree, setIsSyncing);

  useEffect(() => {
    if (isSearching) {
      const parentsToExpand = new Set<string>();
      searchResults.forEach((node) => {
        let parentId = node.parentId;
        while (parentId) {
          parentsToExpand.add(parentId);
          parentId = treeUtils.findParentId(tree, parentId) || '';
        }
      });
      setExpandedNodes(prev => new Set([...prev, ...parentsToExpand]));
    }
  }, [isSearching, searchResults, tree, setExpandedNodes]);
  
  return (
    <div className="min-h-screen bg-background">
      <Header isSyncing={isSyncing}></Header>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[80vh] border-l rounded-md max-w-7xl mx-auto">
          <ResizablePanel defaultSize={60}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              performSearch={performSearch}
              isSearching={isSearching}
              searchResults={searchResults}
              clearSearch={clearSearch}
            />
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
          <ResizableHandle withHandle className="bg-gray-200" />
          <ResizablePanel defaultSize={40}>
            <NodeDetails node={selectedNode} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DndContext>
    </div>
  );
}

export default App;