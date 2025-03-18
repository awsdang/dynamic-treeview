
import { Users } from "lucide-react"
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TreeNode } from "../types/tree"
import { useState, useEffect } from "react"

function formatDate(date?: string) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
}

export function NodeDetails({ node }: { node: TreeNode | null }) {
    const [scrollDelta, setScrollDelta] = useState(0);
    const height = `${scrollDelta}px`;
    useEffect(() => {
        let lastScrollY = window.scrollY;
      
        const handleScroll = () => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;
          setScrollDelta(prev => (prev + delta) > 0 ? (prev + delta) : 0);
          lastScrollY = currentScrollY;
        };
      
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }, []);

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
        <>
        <div style={{height:height}}></div>
        <div className="p-4">
            <Card className="">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{node.name}</CardTitle>
                        <Badge >{node.type.toUpperCase()}</Badge>
                    </div>
                    <CardDescription>ID: {node.id}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 ">
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
                        {node.parentId &&
                            <>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium">Parent</h3>
                                    <p className="text-sm text-muted-foreground mt-1">ID: {node.parentId}</p>
                                </div>
                            </>
                        }
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
                        {node.details?.head &&
                            <>
                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium">{node.type === 'department' ? "Department Head Info" : node.type === 'section' ? "Section Head Info" : "Employee Info"}</h3>
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
                            </>
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    )
}