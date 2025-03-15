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
import { PencilLine } from "lucide-react";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface EditDialogProps {
  node: TreeNode;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onEdit: (updatedNode: TreeNode) => void;
}

export function EditDialog({ node, isOpen, setIsOpen, onEdit }: EditDialogProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: node.name,
      description: node.details?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: node.name,
      description: node.details?.description || "",
    });
  }, [node, form]);

  const onSubmit = async (values: EditFormValues) => {
    const updatedNode: TreeNode = {
      ...node,
      name: values.name,
      details: { ...node.details, description: values.description },
    };
    onEdit(updatedNode);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) form.reset(); }}>
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
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}