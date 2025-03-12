import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { TreeNode } from "@/types/tree"
import { api } from "@/services/api"
import { NodeDetails } from "@/components/nodeDetails"
import { Tree } from "@/components/tree"






function App() {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())


  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setSelectedNode(null)
  }



  const handleNodeUpdate = (updatedNode: TreeNode) => {
    setTree(prevData => {
        return prevData.map(node => {
            if (node.id === updatedNode.id) {
                return { ...updatedNode };
            }
            return node;
        });
    });
};


  useEffect(() => {
    loadRootNodes();
  }, []);

  async function loadRootNodes() {
    const rootNodes = await api.fetchRootNodes();
    setTree(rootNodes)
  }

  function handleClick(node: TreeNode) {
    setSelectedNode(node)
  }


  const performSearch = async () => {
    if (searchQuery.trim() === "") {
      setIsSearching(false)
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const results = await api.searchNodes(searchQuery)
      setSearchResults(results)

      // Auto-expand parent nodes of search results
      const parentsToExpand = new Set<string>()
      results.forEach((node) => {
        if (node.parentId) {
          parentsToExpand.add(node.parentId)
        }
      })

      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev)
        parentsToExpand.forEach((id) => newExpanded.add(id))
        return newExpanded
      })
    } catch (error) {
      console.error("Search failed:", error)
    }
  }


  const toggleNode = async (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id)

    if (isExpanded) {
      // Collapse node
      const newExpanded = new Set(expandedNodes)
      newExpanded.delete(node.id)
      setExpandedNodes(newExpanded)
    } else {
      // Expand node
      setExpandedNodes(new Set([...expandedNodes, node.id]))
    }

    // Select the node to show details
    setSelectedNode(node)
  }

  return (
    <>
      <div className="min-h-screen bg-background p-8 max-w-6xl mx-auto ">
        <div className="flex items-center justify-between mb-6 ">
          <h1 className="text-3xl font-bold">Department Tree</h1>
        </div>
        <div>
          <ResizablePanelGroup direction="horizontal" className="min-h-[80vh] border rounded-md"
          >
            <ResizablePanel defaultSize={60}>
              <div className="flex items-center justify-center p-6 border-b">
                <div className="relative w-full">
                  <div className="flex flex-row w-full gap-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      onChange={(e) => { setSearchQuery(e.target.value) }}
                      value={searchQuery}
                      placeholder="Search departments and sections..."
                      className="pl-8 focus:ring-none focus:border-none"
                    />

                    <Button onClick={async () => await performSearch()}>
                      Search
                    </Button>


                  </div>
                  {isSearching && (
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>{searchResults.length} results found</span>
                      <Button onClick={clearSearch}>
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isSearching ?
                (searchResults && searchResults.length > 0 && searchResults.map((node) => (
                  <div>
                    <Tree key={node.id} expandedNodes={expandedNodes} level={0} onClick={handleClick} onToggle={toggleNode} node={node} isExpanded={expandedNodes.has(node.id)}  onNodeUpdate={handleNodeUpdate}/>
                  </div>
                )))
                :
                (tree && tree.length > 0 && tree.map((node) => (
                  <div>
                    <Tree key={node.id} expandedNodes={expandedNodes} level={0} onClick={handleClick} onToggle={toggleNode} node={node} isExpanded={expandedNodes.has(node.id)} onNodeUpdate={handleNodeUpdate}/>
                  </div>
                )))
              }


            </ResizablePanel>
            <ResizableHandle withHandle className="bg-black" />
            <ResizablePanel defaultSize={40}>
              <NodeDetails node={selectedNode} />
            </ResizablePanel >
          </ResizablePanelGroup >
        </div>
      </div>
    </>
  )
}

export default App
