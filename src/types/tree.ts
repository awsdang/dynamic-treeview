export interface TreeNode {
    id: string;
    name: string;
    type: 'department' | 'section' | 'employee';
    childIds: string[];
    details?: Details
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
  
