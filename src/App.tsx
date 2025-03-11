import { Search, Users } from "lucide-react"
import { Input } from "./components/ui/input"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"



export function NodeDetails() {
  return (
    <div className="p-4 h-full">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Name</CardTitle>
            <Badge >Type</Badge>
          </div>
          <CardDescription>ID: </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground mt-1">description abcdefgh</p>
            </div>

            <Separator />

            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                97 employees
              </span>
            </div>

            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Parent</h3>
                <p className="text-sm text-muted-foreground mt-1">ID: 13254778</p>
              </div>
            </>

            <Separator />

            <div>
              <h3 className="text-sm font-medium">Metadata</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Has Children</p>
                  <p className="text-xs text-muted-foreground">Yes</p>
                </div>
              </div>
            </div>
            <Separator />

            <div>
              <h3 className="text-sm font-medium">Department Head Info</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-muted col-span-2 p-2 rounded-md">
                  <p className="text-xs font-medium">Full Name</p>
                  <p className="text-xs text-muted-foreground">abc abcd</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">asedd@gmail.com</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-xs font-medium">Phone</p>
                  <p className="text-xs text-muted-foreground">64584</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ResizableContainer() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[80vh] border rounded-md"
    >
      <ResizablePanel defaultSize={60}>
        <div className="flex items-center justify-center p-6 border-b">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search departments and sections..."
              className="pl-8 focus:ring-none focus:border-none"
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-black" />
      <ResizablePanel defaultSize={40}>
        <NodeDetails />
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
