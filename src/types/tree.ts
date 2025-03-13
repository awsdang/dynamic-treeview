export interface TreeNode {
  id: string;
  name: string;
  type: "department" | "section" | "employee";
  hasChild: boolean;
  childIds?: string[];
  children?: TreeNode[]; // Added for nested structure
  status?: "active" | "inactive";
  createdAt?: string;
  lastUpdated?: string;
  resourceLinks?: string[];
  userNote?: string;
  details?: {
    description?: string;
    employeeCount?: number;
    head?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      idNumber: number;
    };
  };
  parentId?: string;
}