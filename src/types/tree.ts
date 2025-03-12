export interface TreeNode {
  id: string;
  name: string;
  type: "department" | "section" | "employee";
  hasChild: boolean;
  status?: "active" | "inactive";
  childIds?: string[];
  parentId?: string;
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
}