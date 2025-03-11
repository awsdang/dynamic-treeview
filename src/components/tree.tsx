import { ChevronRight, FileText, Folder, Users } from "lucide-react"
import { DialogContainer } from "@/components/newNodeDialog"
import { Button } from "@/components/ui/button"
import { TreeNode } from "@/types/tree"


interface Tree {
    tree: TreeNode[],
    onClick: (node: TreeNode) => void,
    onToggle: (node: TreeNode) => void
}



export function Tree({ tree, onClick, onToggle }: Tree) {
    return (
        <>
            {tree && tree.length > 0 && tree.map((node) => (
                <div key={node.id}>
                    <div className={"group flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none hover:bg-accent/50"}>
                        <Button onClick={() => onToggle(node)}
                            type="button"
                            variant={'ghost'}>
                            {node.hasChild &&
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                        <div onClick={() => onClick(node)} className="flex items-center gap-2 flex-1">
                            {node.type === 'employee' ? <Users className="h-4 w-4 text-blue-500 shrink-0" /> : node.type === 'section' ? <FileText className="h-4 w-4 text-blue-500 shrink-0" /> :
                                <Folder className="h-4 w-4 text-blue-500 shrink-0" />}
                            <span className="truncate">{node.name}</span>
                        </div>
                        <DialogContainer node={node} />
                    </div>
                </div>
            ))}
        </>
    )
}
