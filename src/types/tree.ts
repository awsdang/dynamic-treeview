export interface TreeNode {
    id: string;
    name: string;
    parentId?: string;
    type: 'department' | 'section' | 'employee';
    childIds?: string[];
    hasChild?: boolean;
    details?: Details
    createdAt?: string;
    lastUpdated?: string;
    status: "active" | "inactive";
  }

  interface Details {
    description?: string;
    employeeCount?: number;
    resourceLinks?: string[];
    userNote?: string;
    head?: HeadInfo;
    [key: string]: unknown
  }

 interface HeadInfo {
    id:string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: number;
 }
  
