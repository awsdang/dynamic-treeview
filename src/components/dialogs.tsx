import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
  import {
    useForm
  } from "react-hook-form"
  import {
    zodResolver
  } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { TreeNode } from "@/types/tree"
import { PencilLine, PlusCircle } from "lucide-react"
import * as z from "zod"
import { api } from "@/services/api"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"


const addFormSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1)
});

const editFormSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1)
});



export function AddDialog({ node, isOpen, setIsOpen, onAdd }: { node: TreeNode,isOpen:boolean,setIsOpen:(value:boolean)=>void, onAdd: (newNode: TreeNode) => void }) { 

    const form = useForm < z.infer < typeof addFormSchema >> ({
        resolver: zodResolver(addFormSchema),
      })
    
      async function onSubmit(values: z.infer < typeof addFormSchema > ) {
        const newNode = await api.addNode(node.id, {
            name: values.name,
            type: node.type === 'department' ? 'section' : 'employee',
            status: 'active',
            details: {
                description: values.description
            }
        })
        onAdd(newNode)
        setIsOpen(false)
      }


    
    return (
        <Dialog open={isOpen} onOpenChange={()=>{setIsOpen(!isOpen); form.reset()}}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100">
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
                <div className="w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter Node Name Here"

                                            type=""
                                            {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter Description Here"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className='w-full'>Add</Button>
                    </form>
                </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function EditDialog({ node, isOpen, setIsOpen, onEdit }: { node: TreeNode,isOpen:boolean,setIsOpen:(value:boolean)=>void, onEdit: (updatedNode: TreeNode) => void }) {

    const form = useForm < z.infer < typeof editFormSchema >> ({
        resolver: zodResolver(editFormSchema),
      })

    const [prevNodeId, setPrevNodeId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && node.id !== prevNodeId) {
            form.reset({
                name: node.name,
                description: node.details?.description || ""
            });
            setPrevNodeId(node.id);
        }
    }, [isOpen, node, form, prevNodeId]);
    
      async function onSubmit(values: z.infer < typeof editFormSchema > ) {
        const updatedNode = await api.editNode(node.id, {
            name: values.name,
            status: 'active',
            details: {
                description: values.description
            }
        })
        setIsOpen(false)
        onEdit(updatedNode)
      }
    
    return (
        <Dialog open={isOpen} onOpenChange={()=>{setIsOpen(!isOpen); form.reset()}}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <PencilLine className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Item: {node.name}</DialogTitle>
                    <DialogDescription>
                        Edit the selected item. Fill in the fields below and click "Save changes" to save.
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter Node Name Here"
                                            type=""
                                            {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter Description Here"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className='w-full'>Save changes</Button>
                    </form>
                </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

