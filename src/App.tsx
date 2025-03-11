import { ChevronDown, ChevronRight, FileText, Folder, Search, Users } from "lucide-react"
import { Input } from "./components/ui/input"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"
import { DialogContainer } from "./components/newNodeDialog"
import { useEffect, useState } from "react"
import { Button } from "./components/ui/button"
import { TreeNode } from "./types/tree"
import { api } from "./services/api"



function formatDate(date?:string)  {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function NodeDetails({node}: {node: TreeNode | null}) {
  if (!node) {
    return (
      <div className="p-4 h-full">
        <Card className="h-full">
          <CardContent>
            <div className="flex items-center justify-center h-full"><div className="flex items-center justify-center h-full text-muted-foreground">
              Select a node to view details
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const formattedCreatedAt = formatDate(node.createdAt)
  const formattedlastUpdated = formatDate(node.lastUpdated)
  return (
    <div className="p-4 h-full">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{node.name}</CardTitle>
            <Badge >{node.type.toUpperCase()}</Badge>
          </div>
          <CardDescription>ID: {node.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground mt-1">{node.details?.description}</p>
            </div>
            <Separator />
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                {node.details?.employeeCount} employees
              </span>
            </div>
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Parent</h3>
                <p className="text-sm text-muted-foreground mt-1">ID: {node.parentId}</p>
              </div>
            </>
            <Separator />
            <div>
              <h3 className="text-sm font-medium">Metadata</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">{formattedCreatedAt}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">{formattedlastUpdated}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">{node.status}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Has Children</p>
                  <p className="text-xs text-muted-foreground">{node.hasChild === true ? 'True' : 'No'}</p>
                </div>
              </div>
            </div>
            <Separator />

            <div>
              <h3 className="text-sm font-medium">Department Head Info</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-muted col-span-2 p-2 rounded-md">
                  <p className="text-xs font-medium">Full Name</p>
                  <p className="text-xs text-muted-foreground">{node.details?.head?.firstName} {node.details?.head?.lastName}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{node.details?.head?.email}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Phone</p>
                  <p className="text-xs text-muted-foreground">{node.details?.head?.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export function Tree({tree, onClick}: {tree: TreeNode[], onClick: (node: TreeNode) => void}) {
  
  return (
    <>
    {tree && tree.length > 0 && tree.map((node) => (
      <div key={node.id} onClick={() => onClick(node)}>
      <div className={"group flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none hover:bg-accent/50"}>
        <button
          type="button"
          className={"flex h-4 w-4 items-center justify-center rounded-sm hover:bg-accent"}>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 flex-1">
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
          <DialogContainer node={node}/>
      </div>
      </div>
    ))}
    </>
  )
}

export function ResizableContainer() {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

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

  return (
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
        <Tree onClick={handleClick} tree={tree}/>
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-black" />
      <ResizablePanel defaultSize={40}>
        <NodeDetails node={selectedNode} />
      </ResizablePanel >
    </ResizablePanelGroup >
  )
}



function App() {


  // useEffect(() => {
  // Load initial data when component mounts
  // loadRootNodes();

  // }, []);
  // async function loadRootNodes() {
  //   const rootNodes = await api.fetchRootNodes();
  //   console.log(rootNodes); // Display departments
  // }

  // async function expandNode(parentId: string) {
  //   const children = await api.fetchChildNodes(parentId);
  //   console.log(children); // Display sections or subsections
  // }

  // async function searchTree(query: string) {
  //   const results = await api.searchNodes(query);
  //   console.log(results); // Display matching nodes
  // }

  // async function addNode(parentId: string, newNode: {id:string, name: string; type: "section" | "department" | "employee"; status: "active" | "inactive" }) {
  //   const added = await api.addNode(parentId, newNode);
  //   console.log('Node added:', added);
  // }

  // async function moveNode(nodeId: string, newParentId: string) {
  //   const moved = await api.moveNode(nodeId, newParentId);
  //   console.log('Node moved:', moved);
  // }

  return (
    <>
      <div className="min-h-screen bg-background p-8 max-w-6xl mx-auto ">
        <div className="flex items-center justify-between mb-6 ">
          <h1 className="text-3xl font-bold">Department Tree</h1>
        </div>

        <div>
          <ResizableContainer />
        </div>
      </div>
    </>
  )
}

export default App
