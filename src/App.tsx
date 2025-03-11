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
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const clearSearch = () => {
    setIsSearching(false)
  }

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
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    onChange={(e) => setIsSearching(e.target.value.length > 0)}
                    placeholder="Search departments and sections..."
                    className="pl-8 focus:ring-none focus:border-none"
                  />
                  {isSearching && (
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>152 results found</span>
                      <Button variant="ghost" size="sm" onClick={clearSearch}>
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Tree onClick={handleClick} onToggle={toggleNode} tree={tree} />
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
