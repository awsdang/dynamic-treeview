export interface TreeNode {
    id: string;
    name: string;
    type: 'department' | 'section' | 'employee';
    childIds: string[];
    hasChild?: boolean;
    details?: Details
    createdAt?: string;
    lastUpdated?: string;
    Status: "active" | "inactive";
  }

  interface Details {
    description?: string;
    employeeCount?: number;
    resource_link?: string[];
    userNote: string;
    head?: HeadInfo;
    [key: string]: unknown
  }

 interface HeadInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: number;
 }
  
