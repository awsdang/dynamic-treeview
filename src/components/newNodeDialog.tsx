import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TreeNode } from "@/types/tree"
import { PlusCircle } from "lucide-react"

export function DialogContainer({node}: {node: TreeNode}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button  variant="ghost"   className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add new item to {node.name}</DialogTitle>
                    <DialogDescription>
                        Add a new item to the selected node. Fill in the fields below and click "Save changes" to save.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" value="Enter name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                            Type
                        </Label>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="department">Department</SelectItem>
                                    <SelectItem value="section">Section</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Add</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}