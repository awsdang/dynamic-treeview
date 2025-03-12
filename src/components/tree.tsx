import { ChevronDown, ChevronRight, Dock, Folder, User } from "lucide-react"
import { AddDialog, EditDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import { TreeNode } from "@/types/tree"
import { api } from "@/services/api"
import { use, useCallback, useEffect, useState } from "react"


interface Tree {
    node: TreeNode,
    expandedNodes: Set<string>,
    level: number,
    onClick: (node: TreeNode) => void,
    onToggle: (node: TreeNode) => void
    isExpanded: boolean;
    onNodeUpdate: (updatedNode: TreeNode) => void
}



export function Tree({ node, expandedNodes, level, onClick, onToggle, isExpanded, onNodeUpdate }: Tree) {
    const [childNodes, setChildNodes] = useState<TreeNode[]>([])
    const [isAddDialogOpen, setAddDialog] = useState(false)
    const [isEditDialogOpen, setEditDialog] = useState(false)

    useEffect(() => {
        if (isExpanded && node.hasChild && childNodes.length === 0) {
            loadChildNodes(node.id)
        }
    }, [isExpanded, node.id, node.hasChild, childNodes.length])

    async function loadChildNodes(id: string) {
        const children = await api.fetchChildNodes(id)
        setChildNodes(children)
    }

    const handleNodeUpdate = useCallback((updatedNode: TreeNode) => {
        onNodeUpdate(updatedNode) // Propagate update to parent
        setEditDialog(false) // Close dialog after successful update
    }, [onNodeUpdate])

    const handleNodeAdd = useCallback((newNode: TreeNode) => {
        setChildNodes(prev => [...prev, newNode])
        setAddDialog(false)
    }, [])

    return (
        <>
            <div key={node.id} className="flex flex-col">
                <div className={"group flex items-center py-1.5 cursor-pointer select-none hover:bg-accent/50"}>
                    <Button onClick={() => onToggle(node)}
                        type="button"
                        variant={'ghost'}>
                        {node.hasChild && (
                            isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> :
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />)}
                    </Button>
                    <div onClick={() => onClick(node)} className="flex items-center gap-2 flex-1">
                        {node.type === 'employee' ?
                            <User className="h-4 w-4 text-blue-500 shrink-0" /> :
                            node.type === 'section' ?
                                <Dock className="h-4 w-4 text-blue-500 shrink-0" /> :
                                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                        }
                        <span className="truncate">{node.name}</span>
                    </div>
                    <EditDialog node={node} key={node.id} isOpen={isAddDialogOpen} setIsOpen={setAddDialog} onEdit={handleNodeUpdate} />
                    {node.type !== 'employee' &&
                    <AddDialog node={node} key={node.id} isOpen={isEditDialogOpen} setIsOpen={setEditDialog} onAdd={handleNodeAdd} />
                    }
                     
                </div>

                {isExpanded && node.hasChild && <div className={`flex flex-col  gap-2`} style={{ marginLeft: (level + 1) + 'rem' }}>
                    {
                        childNodes.map((childNode) => (
                            <Tree
                                key={childNode.id}
                                node={childNode}
                                level={level + 1}
                                expandedNodes={expandedNodes}
                                isExpanded={expandedNodes.has(childNode.id)}
                                onClick={onClick}
                                onToggle={onToggle}
                                onNodeUpdate={onNodeUpdate}
                            />
                        ))
                    }
                </div>

                }
            </div>
        </>
    )
}
