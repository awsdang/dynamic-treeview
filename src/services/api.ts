import type { TreeNode } from "../types/tree";

// Simulated network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuration for data generation
const NUM_DEPARTMENTS = 20;
const MIN_SECTIONS_PER_DEPT = 2;
const MAX_SECTIONS_PER_DEPT = 12;
const SUBSECTION_PROBABILITY = 0.0;
const MIN_SUBSECTIONS = 2;
const MAX_SUBSECTIONS = 12;
const MIN_EMPLOYEES_PER_SECTION = 5;
const MAX_EMPLOYEES_PER_SECTION = 25;

// Utility to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// Helper to generate timestamp and additional fields
const createMeta = () => ({
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  resourceLinks: [] as string[],
  userNote: "",
});

// Caches for storing generated nodes
let departmentsCache: TreeNode[] = [];
const sectionsCache: Map<string, TreeNode[]> = new Map();
const employeesCache: Map<string, TreeNode[]> = new Map();

// Generate employees (leaf nodes)
const generateEmployees = (parentId: string, parentName: string, count: number): TreeNode[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: generateId(),
    name: `Employee ${index + 1}`,
    type: "employee",
    hasChild: false,
    status: Math.random() < 0.5 ? "active" : "inactive",
    parentId,
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

// Generate sections (some with subsections or employees)
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
      parentId,
      ...createMeta(),
      details: {
        description: `Section under ${parentId} | ${parentName}`,
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

// Generate departments
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

// Initialize caches (called once)
const initializeCache = () => {
  if (departmentsCache.length === 0) {
    departmentsCache = generateDepartments(NUM_DEPARTMENTS);
  }
};

// Find parent of a node (for move operations)
const findParentId = (nodeId: string): string | null => {
  for (const [parentId, sections] of sectionsCache) {
    if (sections.some((s) => s.id === nodeId)) return parentId;
  }
  for (const [parentId, employees] of employeesCache) {
    if (employees.some((e) => e.id === nodeId)) return parentId;
  }
  return null;
};

// API implementation
export const api = {
  async fetchRootNodes(): Promise<TreeNode[]> {
    initializeCache();
    await delay(500);
    return departmentsCache;
  },

  async fetchChildNodes(parentId: string): Promise<TreeNode[]> {
    initializeCache();
    await delay(300);
    return sectionsCache.get(parentId) || employeesCache.get(parentId) || [];
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
    return allNodes.filter((node) => node.name.toLowerCase().includes(normalizedQuery));
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
      parentId,
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

    return newNode;
  },

  async editNode(nodeId: string, updates: Partial<TreeNode>): Promise<TreeNode> {
    initializeCache();
    await delay(400);

    let node: TreeNode | undefined;
    const deptIndex = departmentsCache.findIndex((d) => d.id === nodeId);
    if (deptIndex >= 0) {
      node = departmentsCache[deptIndex];
      departmentsCache[deptIndex] = { ...node, ...updates, childIds: node.childIds };
      return departmentsCache[deptIndex];
    }

    for (const [parentId, sections] of sectionsCache.entries()) {
      const sectionIndex = sections.findIndex((s) => s.id === nodeId);
      if (sectionIndex >= 0) {
        node = sections[sectionIndex];
        sections[sectionIndex] = { ...node, ...updates, childIds: node.childIds };
        return sections[sectionIndex];
      }
    }

    for (const [parentId, employees] of employeesCache.entries()) {
      const employeeIndex = employees.findIndex((e) => e.id === nodeId);
      if (employeeIndex >= 0) {
        node = employees[employeeIndex];
        employees[employeeIndex] = { ...node, ...updates };
        return employees[employeeIndex];
      }
    }

    throw new Error(`Node with ID ${nodeId} not found`);
  },

  async updateNode(nodeId: string, updates: Partial<TreeNode>): Promise<TreeNode> {
    return api.editNode(nodeId, updates);
  },

  async moveNode(nodeId: string, newParentId: string | "root"): Promise<void> {
    initializeCache();
    await delay(400);

    const oldParentId = findParentId(nodeId);
    if (oldParentId === newParentId) return;

    let node: TreeNode | undefined;
    let isEmployee = false;

    // Find the node in sections or employees
    for (const sections of sectionsCache.values()) {
      node = sections.find((s) => s.id === nodeId);
      if (node) break;
    }
    if (!node) {
      for (const employees of employeesCache.values()) {
        node = employees.find((e) => e.id === nodeId);
        if (node) {
          isEmployee = true;
          break;
        }
      }
    }
    if (!node) {
      node = departmentsCache.find((d) => d.id === nodeId);
    }
    if (!node) return;

    // Remove from old parent
    if (oldParentId) {
      if (isEmployee) {
        const oldEmployees = employeesCache.get(oldParentId)!;
        employeesCache.set(oldParentId, oldEmployees.filter((e) => e.id !== nodeId));
        const oldParent = Array.from(sectionsCache.values())
          .flat()
          .find((s) => s.id === oldParentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds?.filter((id) => id !== nodeId) || [];
          oldParent.details!.employeeCount = (oldParent.details!.employeeCount || 0) - 1;
        }
      } else {
        const oldSections = sectionsCache.get(oldParentId)!;
        sectionsCache.set(oldParentId, oldSections.filter((s) => s.id !== nodeId));
        const oldParent =
          departmentsCache.find((d) => d.id === oldParentId) ||
          Array.from(sectionsCache.values())
            .flat()
            .find((s) => s.id === oldParentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds?.filter((id) => id !== nodeId) || [];
          oldParent.details!.employeeCount =
            (oldParent.details!.employeeCount || 0) - (node.details?.employeeCount || 0);
        }
      }
    } else {
      departmentsCache = departmentsCache.filter((d) => d.id !== nodeId);
    }

    // Add to new parent
    if (newParentId === "root") {
      node.parentId = undefined;
      departmentsCache.push(node);
    } else {
      node.parentId = newParentId;
      if (isEmployee) {
        const newEmployees = employeesCache.get(newParentId) || [];
        employeesCache.set(newParentId, [...newEmployees, node]);
        const newParent = Array.from(sectionsCache.values())
          .flat()
          .find((s) => s.id === newParentId);
        if (newParent) {
          newParent.childIds = [...(newParent.childIds || []), nodeId];
          newParent.details!.employeeCount = (newParent.details!.employeeCount || 0) + 1;
        }
      } else {
        const newSections = sectionsCache.get(newParentId) || [];
        sectionsCache.set(newParentId, [...newSections, node]);
        const newParent =
          departmentsCache.find((d) => d.id === newParentId) ||
          Array.from(sectionsCache.values())
            .flat()
            .find((s) => s.id === newParentId);
        if (newParent) {
          newParent.childIds = [...(newParent.childIds || []), nodeId];
          newParent.details!.employeeCount =
            (newParent.details!.employeeCount || 0) + (node.details?.employeeCount || 0);
        }
      }
    }
  },

  async getAllNodes(): Promise<TreeNode[]> {
    initializeCache();
    await delay(100);
    return [
      ...departmentsCache,
      ...Array.from(sectionsCache.values()).flat(),
      ...Array.from(employeesCache.values()).flat(),
    ];
  },
};

export type { TreeNode };