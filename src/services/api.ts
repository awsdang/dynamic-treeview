import type { TreeNode } from "../types/tree";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const NUM_DEPARTMENTS = 15;
const MIN_SECTIONS_PER_DEPT = 2;
const MAX_SECTIONS_PER_DEPT = 15;
const SUBSECTION_PROBABILITY = 0.0;
const MIN_SUBSECTIONS = 2;
const MAX_SUBSECTIONS = 15;
const MIN_EMPLOYEES_PER_SECTION = 5;
const MAX_EMPLOYEES_PER_SECTION = 15;

export const generateId = () => Math.random().toString(36).substring(2, 10);

const createMeta = () => ({
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  resourceLinks: [] as string[],
  userNote: "",
});

let departmentsCache: TreeNode[] = [];
const sectionsCache: Map<string, TreeNode[]> = new Map();
const employeesCache: Map<string, TreeNode[]> = new Map();

const generateEmployees = (parentId: string, parentName: string, count: number): TreeNode[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: generateId(),
    name: `Employee ${index + 1}`,
    type: "employee",
    hasChild: false,
    status: Math.random() < 0.5 ? "active" : "inactive",
    ...createMeta(),
    details: {
      description: `Employee under section ${parentId} | ${parentName}`,
      employeeCount: 1,
      head: {
        id: generateId(),
        firstName: `First${index + 1}`,
        lastName: `Last${index + 1}`,
        email: `employee${index + 1}@example.com`,
        phone: `555-01${String(index + 1).padStart(2, "0")}`,
        idNumber: 1000 + index,
      },
    },
  }));
};

const generateSections = (
  parentId: string,
  parentName: string,
  count: number,
  depth: number = 0
): TreeNode[] => {
  const sections = Array.from({ length: count }).map((_, index) => {
    const canHaveSubsections = depth < 3;
    const hasSubsections = canHaveSubsections && Math.random() < SUBSECTION_PROBABILITY;
    const section: TreeNode = {
      id: generateId(),
      name: `Section ${index + 1}`,
      type: "section",
      status: hasSubsections ? "active" : "inactive",
      hasChild: true,
      ...createMeta(),
      details: {
        description: `Section under department ${parentId} | ${parentName}`,
        employeeCount: 0,
      },
    };

    if (hasSubsections) {
      const subsectionCount =
        Math.floor(Math.random() * (MAX_SUBSECTIONS - MIN_SUBSECTIONS + 1)) + MIN_SUBSECTIONS;
      const subsections = generateSections(section.id, section.name, subsectionCount, depth + 1);
      sectionsCache.set(section.id, subsections);
      section.details!.employeeCount = subsections.reduce(
        (sum, sub) => sum + (sub.details?.employeeCount || 0),
        0
      );
      section.childIds = subsections.map((s) => s.id);
    } else {
      const employeesCount =
        Math.floor(Math.random() * (MAX_EMPLOYEES_PER_SECTION - MIN_EMPLOYEES_PER_SECTION + 1)) +
        MIN_EMPLOYEES_PER_SECTION;
      const employees = generateEmployees(section.id, section.name, employeesCount);
      employeesCache.set(section.id, employees);
      section.details!.employeeCount = employees.length;
      section.childIds = employees.map((e) => e.id);
    }
    return section;
  });
  return sections;
};

const generateDepartments = (count: number): TreeNode[] => {
  const departments = Array.from({ length: count }).map((_, index) => {
    const department: TreeNode = {
      id: generateId(),
      name: `Department ${index + 1}`,
      type: "department",
      hasChild: true,
      status: Math.random() < 0.7 ? "active" : "inactive",
      ...createMeta(),
      details: {
        description: `Department ${index + 1}`,
        employeeCount: 0,
        head: {
          id: generateId(),
          firstName: `DeptHead${index + 1}`,
          lastName: `Last${index + 1}`,
          email: `dept${index + 1}@example.com`,
          phone: `555-00${String(index + 1).padStart(2, "0")}`,
          idNumber: 5000 + index,
        },
      },
    };

    const sections = generateSections(
      department.id,
      department.name,
      Math.floor(Math.random() * (MAX_SECTIONS_PER_DEPT - MIN_SECTIONS_PER_DEPT + 1)) +
        MIN_SECTIONS_PER_DEPT
    );
    sectionsCache.set(department.id, sections);
    department.details!.employeeCount = sections.reduce(
      (sum, sect) => sum + (sect.details?.employeeCount || 0),
      0
    );
    department.childIds = sections.map((s) => s.id);
    return department;
  });
  return departments;
};

const initializeCache = () => {
  if (departmentsCache.length === 0) {
    departmentsCache = generateDepartments(NUM_DEPARTMENTS);
  }
};

const findParentId = (nodeId: string): string | null => {
  for (const [parentId, sections] of sectionsCache) {
    if (sections.some((s) => s.id === nodeId)) return parentId;
  }
  for (const [parentId, employees] of employeesCache) {
    if (employees.some((e) => e.id === nodeId)) return parentId;
  }
  return null;
};

export const api = {
  async fetchRootNodes(): Promise<TreeNode[]> {
    initializeCache();
    await delay(500);
    return departmentsCache.map(node => ({ ...node, children: undefined }));
  },

  async fetchChildNodes(parentId: string): Promise<TreeNode[]> {
    initializeCache();
    await delay(300);
    const children = sectionsCache.get(parentId) || employeesCache.get(parentId) || [];
    return children.map(node => ({ ...node, children: undefined }));
  },

  /** 
   * New method to fetch a node by ID with its immediate children included.
   * @param nodeId The ID of the node to fetch.
   * @returns The node with its immediate children, or throws an error if not found.
   */
  async fetchNodesWithChildren(nodeId: string): Promise<TreeNode> {
    initializeCache();
    await delay(350);

    // Check departments (root level)
    const department = departmentsCache.find(d => d.id === nodeId);
    if (department) {
      const children = sectionsCache.get(department.id) || [];
      return { ...department, children: children.map(child => ({ ...child, children: undefined })) };
    }

    // Check sections
    for (const [_, sections] of sectionsCache) {
      const section = sections.find(s => s.id === nodeId);
      if (section) {
        const children = sectionsCache.get(section.id) || employeesCache.get(section.id) || [];
        return { ...section, children: children.map(child => ({ ...child, children: undefined })) };
      }
    }

    // Check employees (though employees typically have no children)
    for (const [_, employees] of employeesCache) {
      const employee = employees.find(e => e.id === nodeId);
      if (employee) {
        return { ...employee, children: [] }; // Employees have no children
      }
    }

    throw new Error(`Node with ID ${nodeId} not found`);
  },

  async searchNodes(query: string): Promise<TreeNode[]> {
    initializeCache();
    await delay(300);
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase();
    const allNodes = [
      ...departmentsCache,
      ...Array.from(sectionsCache.values()).flat(),
      ...Array.from(employeesCache.values()).flat(),
    ];
    return allNodes.filter((node) => node.name.toLowerCase().includes(normalizedQuery))
      .map(node => ({ ...node, children: undefined }));
  },

  async addNode(
    parentId: string,
    nodeData: Omit<TreeNode, "id" | "hasChild">
  ): Promise<TreeNode> {
    initializeCache();
    await delay(400);

    const newId = generateId();
    const newNode: TreeNode = {
      ...nodeData,
      id: newId,
      hasChild: nodeData.type === "employee" ? false : true,
      ...createMeta(),
    };

    if (nodeData.type === "department") {
      departmentsCache.push(newNode);
    } else if (nodeData.type === "section") {
      const parentSections = sectionsCache.get(parentId) || [];
      sectionsCache.set(parentId, [...parentSections, newNode]);
      const parent =
        departmentsCache.find((d) => d.id === parentId) ||
        Array.from(sectionsCache.values())
          .flat()
          .find((s) => s.id === parentId);
      if (parent) {
        parent.childIds = [...(parent.childIds || []), newId];
        parent.details!.employeeCount =
          (parent.details!.employeeCount || 0) + (newNode.details?.employeeCount || 0);
      }
    } else if (nodeData.type === "employee") {
      const parentEmployees = employeesCache.get(parentId) || [];
      newNode.details = { ...newNode.details, employeeCount: 1 };
      employeesCache.set(parentId, [...parentEmployees, newNode]);
      const parent = Array.from(sectionsCache.values())
        .flat()
        .find((s) => s.id === parentId);
      if (parent) {
        parent.childIds = [...(parent.childIds || []), newId];
        parent.details!.employeeCount = (parent.details!.employeeCount || 0) + 1;
      }
    }

    return { ...newNode, children: undefined };
  },

  async editNode(nodeId: string, updates: Partial<TreeNode>): Promise<TreeNode> {
    initializeCache();
    await delay(400);

    let node: TreeNode | undefined;
    const deptIndex = departmentsCache.findIndex((d) => d.id === nodeId);
    if (deptIndex >= 0) {
      node = departmentsCache[deptIndex];
      departmentsCache[deptIndex] = { ...node, ...updates, childIds: node.childIds };
      return { ...departmentsCache[deptIndex], children: undefined };
    }

    for (const [parentId, sections] of sectionsCache.entries()) {
      const sectionIndex = sections.findIndex((s) => s.id === nodeId);
      if (sectionIndex >= 0) {
        node = sections[sectionIndex];
        sections[sectionIndex] = { ...node, ...updates, childIds: node.childIds };
        return { ...sections[sectionIndex], children: undefined };
      }
    }

    for (const [parentId, employees] of employeesCache.entries()) {
      const employeeIndex = employees.findIndex((e) => e.id === nodeId);
      if (employeeIndex >= 0) {
        node = employees[employeeIndex];
        employees[employeeIndex] = { ...node, ...updates };
        return { ...employees[employeeIndex], children: undefined };
      }
    }

    throw new Error(`Node with ID ${nodeId} not found`);
  },

  async moveNode(nodeId: string, newParentId: string): Promise<void> {
    initializeCache();
    await delay(400);

    if (newParentId === "root") {
      newParentId = "";
    }

    let node: TreeNode | undefined;
    let nodeType: string | undefined;

    const deptIndex = departmentsCache.findIndex((d) => d.id === nodeId);
    if (deptIndex >= 0) {
      node = departmentsCache[deptIndex];
      nodeType = "department";
    }

    if (!node) {
      for (const sections of sectionsCache.values()) {
        const foundIdx = sections.findIndex((s) => s.id === nodeId);
        if (foundIdx >= 0) {
          node = sections[foundIdx];
          nodeType = "section";
          break;
        }
      }
    }

    if (!node) {
      for (const employees of employeesCache.values()) {
        const foundIdx = employees.findIndex((e) => e.id === nodeId);
        if (foundIdx >= 0) {
          node = employees[foundIdx];
          nodeType = "employee";
          break;
        }
      }
    }

    if (!node || !nodeType) {
      console.error(`Node with ID ${nodeId} not found for moving`);
      return;
    }

    if (nodeType === "department" && newParentId !== "") {
      console.error("Departments can only exist at the root level");
      return;
    }
    
    if (nodeType === "section" && newParentId) {
      const destParent = departmentsCache.find((d) => d.id === newParentId);
      if (!destParent) {
        console.error("Sections can only be moved under departments");
        return;
      }
    }
    
    if (nodeType === "employee" && newParentId) {
      const allSections = Array.from(sectionsCache.values()).flat();
      const destParent = allSections.find((s) => s.id === newParentId);
      if (!destParent) {
        console.error("Employees can only be moved under sections");
        return;
      }
    }

    const oldParentId = findParentId(nodeId);
    if (oldParentId === newParentId) {
      return;
    }

    if (oldParentId) {
      if (nodeType === "section") {
        const oldParentSections = sectionsCache.get(oldParentId) || [];
        sectionsCache.set(
          oldParentId,
          oldParentSections.filter((s) => s.id !== nodeId)
        );
        
        const oldParent = departmentsCache.find((d) => d.id === oldParentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds?.filter((id) => id !== nodeId) || [];
          oldParent.details!.employeeCount = 
            (oldParent.details!.employeeCount || 0) - (node.details?.employeeCount || 0);
        }
      } else if (nodeType === "employee") {
        const oldParentEmployees = employeesCache.get(oldParentId) || [];
        employeesCache.set(
          oldParentId,
          oldParentEmployees.filter((e) => e.id !== nodeId)
        );
        
        const allSections = Array.from(sectionsCache.values()).flat();
        const oldParent = allSections.find((s) => s.id === oldParentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds?.filter((id) => id !== nodeId) || [];
          oldParent.details!.employeeCount = (oldParent.details!.employeeCount || 0) - 1;
        }
      }
    } else if (nodeType === "department") {
      departmentsCache = departmentsCache.filter((d) => d.id !== nodeId);
    }

    if (newParentId === "") {
      if (nodeType === "department") {
        departmentsCache.push(node);
      }
    } else if (nodeType === "section") {
      const newParentSections = sectionsCache.get(newParentId) || [];
      sectionsCache.set(newParentId, [...newParentSections, { ...node, parentId: newParentId }]);
      
      const destParent = departmentsCache.find((d) => d.id === newParentId);
      if (destParent) {
        destParent.childIds = [...(destParent.childIds || []), nodeId];
        destParent.details!.employeeCount = 
          (destParent.details!.employeeCount || 0) + (node.details?.employeeCount || 0);
      }
      
      node.parentId = newParentId;
    } else if (nodeType === "employee") {
      const newParentEmployees = employeesCache.get(newParentId) || [];
      employeesCache.set(newParentId, [...newParentEmployees, { ...node, parentId: newParentId }]);
      
      const allSections = Array.from(sectionsCache.values()).flat();
      const destParent = allSections.find((s) => s.id === newParentId);
      if (destParent) {
        destParent.childIds = [...(destParent.childIds || []), nodeId];
        destParent.details!.employeeCount = (destParent.details!.employeeCount || 0) + 1;
        
        const deptId = findParentId(destParent.id);
        if (deptId) {
          const dept = departmentsCache.find(d => d.id === deptId);
          if (dept) {
            dept.details!.employeeCount = (dept.details!.employeeCount || 0) + 1;
          }
        }
      }
      
      node.parentId = newParentId;
    }
  },

  async reorderNodes(parentId: string | null, newOrder: string[]): Promise<void> {
    initializeCache();
    await delay(400);

    if (parentId === null) {
      const newDepartments = newOrder.map(id => 
        departmentsCache.find(d => d.id === id)!
      ).filter(Boolean);
      departmentsCache = newDepartments;
    } else {
      const allNodes = await api.getAllNodes();
      const parentNode = allNodes.find(node => node.id === parentId);
      if (!parentNode) {
        console.error(`Parent node ${parentId} not found`);
        return;
      }

      if (parentNode.type === "department") {
        const currentSections = sectionsCache.get(parentId) || [];
        const reorderedSections = newOrder.map(id => 
          currentSections.find(s => s.id === id)!
        ).filter(Boolean);
        sectionsCache.set(parentId, reorderedSections);
        parentNode.childIds = reorderedSections.map(s => s.id);
      } else if (parentNode.type === "section") {
        const currentEmployees = employeesCache.get(parentId) || [];
        const reorderedEmployees = newOrder.map(id => 
          currentEmployees.find(e => e.id === id)!
        ).filter(Boolean);
        employeesCache.set(parentId, reorderedEmployees);
        parentNode.childIds = reorderedEmployees.map(e => e.id);
      }
    }
  },

  async getAllNodes(): Promise<TreeNode[]> {
    initializeCache();
    await delay(300);
    return [
      ...departmentsCache,
      ...Array.from(sectionsCache.values()).flat(),
      ...Array.from(employeesCache.values()).flat(),
    ].map(node => ({ ...node, children: undefined }));
  },

  async updateNode(nodeId: string, updates: Partial<TreeNode>): Promise<TreeNode> {
    initializeCache();
    await delay(400);
    
    let node: TreeNode | undefined;
    const deptIndex = departmentsCache.findIndex((d) => d.id === nodeId);
    if (deptIndex >= 0) {
      node = departmentsCache[deptIndex];
      departmentsCache[deptIndex] = { ...node, ...updates };
      return { ...departmentsCache[deptIndex], children: undefined };
    }

    for (const [parentId, sections] of sectionsCache.entries()) {
      const sectionIndex = sections.findIndex((s) => s.id === nodeId);
      if (sectionIndex >= 0) {
        node = sections[sectionIndex];
        sections[sectionIndex] = { ...node, ...updates };
        return { ...sections[sectionIndex], children: undefined };
      }
    }

    for (const [parentId, employees] of employeesCache.entries()) {
      const employeeIndex = employees.findIndex((e) => e.id === nodeId);
      if (employeeIndex >= 0) {
        node = employees[employeeIndex];
        employees[employeeIndex] = { ...node, ...updates };
        return { ...employees[employeeIndex], children: undefined };
      }
    }

    throw new Error(`Node with ID ${nodeId} not found`);
  },
};

export type { TreeNode };