import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { TreeNode } from "@/types/tree";
import { PlusCircle } from "lucide-react";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "@/services/api";

const addFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type AddFormValues = z.infer<typeof addFormSchema>;

interface AddDialogProps {
  node: TreeNode;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onAdd: (newNode: TreeNode) => void;
}

export function AddDialog({ node, isOpen, setIsOpen, onAdd }: AddDialogProps) {
  const form = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: AddFormValues) => {
    const newNode: TreeNode = {
      id : generateId(),
      name: values.name,
      type: node.type === "department" ? "section" : "employee",
      status: "active",
      parentId: node.id,
      details: { description: values.description },
      hasChild: false // Default to false for new nodes
    };
    onAdd(newNode);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) form.reset(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new {node.type === "department" ? "Section" : "Employee"} to {node.name}</DialogTitle>
          <DialogDescription>
            Add a new item to the selected node. Fill in the fields below and click "Add" to save.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Node Name" {...field} />
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
                    <Textarea placeholder="Enter Description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Add</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}