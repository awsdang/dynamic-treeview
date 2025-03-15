# Scalable Dynamic Tree View - Qi Card Developer Task

This repository contains a **React + TypeScript** application that implements a **scalable, dynamic tree view** to handle large datasets (1000+ nodes). It demonstrates lazy-loading, searching, drag-and-drop reordering, and adding/editing nodes, all while maintaining performance and a clean architecture.

---

## Table of Contents

1. [Overview] 
2. [Features] 
3. [Project Structure] 
4. [Key Components] 
5. [Implementation Details] 
    - [Lazy Loading] 
    - [Searching] 
    - [Drag-and-Drop] 
    - [Reordering] 
    - [Add & Edit Nodes] 
6. [How to Run] 
7. [Usage] 
8. [Commit History] 
9. [Possible Improvements] 
10. [License] 

---

## Overview

The goal of this project is to showcase a **high-performance, interactive tree view** that can handle large datasets (e.g., thousands of departments and sections). The application:

- Fetches data from a **mock API** (`api.ts`) that simulates more than 1000 nodes.
- Loads child nodes **lazily** only when a parent node is expanded.
- Allows **searching** through the node names and auto-expanding relevant branches.
- Provides **drag-and-drop** functionality to move nodes between different parents or reorder them under the same parent.
- Supports **adding** and **editing** nodes (departments, sections, employees) on the fly.

---

## Features

1. **Lazy Loading**
    
    Child nodes are fetched and rendered only when a node is expanded. This helps with performance when dealing with large data.
    
2. **Search and Filter**
    
    A search bar filters nodes by name. Matching nodes are shown, and their parent paths are auto-expanded.
    
3. **Drag-and-Drop Reordering**
    
    Nodes can be dragged within the same level or moved to other levels (e.g., sections under departments, employees under sections). This uses the `@dnd-kit/core` library.
    
4. **Add and Edit Nodes**
    
    Users can add sections under a department or employees under a section. Editing a node allows changing its name and description.
    
5. **Real-Time Sync Indicator**
    
    A small “Syncing…” message (with a spinner) appears whenever the app is syncing changes with the mock API.
    
6. **Department/Section/Employee Node Types**
    - **Department** nodes can only exist at the root level.
    - **Section** nodes must be under a department.
    - **Employee** nodes must be under a section.

---

## Project Structure

```
.
├── src
│   ├── App.tsx              # Main App component
│   ├── components
│   │   ├── dialogs          # Dialogs for adding/editing nodes
│   │   │   └── index.tsx
│   │   ├── nodeDetails.tsx  # Sidebar component to display node details
│   │   ├── tree.tsx         # Recursive Tree component
│   │   ├── ui               # Reusable UI components (buttons, inputs, etc.)
│   ├── services
│   │   └── api.ts           # Mock API for fetching/editing/moving/reordering nodes
│   ├── types
│   │   └── tree.ts          # TreeNode interface
│   └── main.tsx             # Entry point
├── public
├── package.json
├── tsconfig.json
└── README.md

```

---

## Key Components

### 1. `App.tsx`

- The **root** component managing the state of the entire tree.
- Fetches **root nodes** from the mock API on mount.
- Handles **searching** and expands parents of matched nodes.
- Listens for drag-and-drop events to move or reorder nodes.
- Displays the **NodeDetails** panel for a selected node.

### 2. `tree.tsx` (Tree Component)

- A **recursive** component that displays a single node and (conditionally) its children.
- Handles **lazy loading** of children when expanded.
- Integrates with `@dnd-kit/core` for **drag-and-drop**.
- Provides **add** and **edit** dialogs for each node.

### 3. `nodeDetails.tsx`

- A **sidebar** or detail view that shows metadata (description, status, creation date, last updated date, parent info, etc.) for the currently selected node.

### 4. `dialogs/index.tsx`

- Contains the **AddDialog** and **EditDialog** components.
- Uses **React Hook Form** + **Zod** for form validation.
- On submission, calls the mock API to create or edit a node.

### 5. `api.ts`

- A **mock API** that simulates data fetching and updates with artificial delays.
- **Generates** random data for departments, sections, and employees.
- Implements methods to **search**, **fetch**, **move**, and **reorder** nodes.

---

## Implementation Details

### Lazy Loading

- When a node with `hasChild = true` is expanded, an API call (`api.fetchChildNodes(parentId)`) fetches its children.
- The children are only stored in state once they’re fetched, preventing loading **all** children upfront.

### Searching

- The search bar triggers `api.searchNodes(query)`.
- Results are displayed, and relevant parent IDs are auto-expanded.
- If the query is cleared, the tree reverts to its default (unfiltered) state.

### Drag-and-Drop

- Uses `@dnd-kit/core` with `useDraggable` and `useDroppable`.
- On `onDragEnd`, the code determines if a node is being moved:
    - **Within the same parent** → reorder
    - **To a different parent** → update the parent relationship in state and call `api.moveNode()`
- Restricts movement based on node `type` (e.g., only “employee” → “section,” only “section” → “department”).

### Reordering

- When a node is moved **up** or **down**, the local state is updated first to reflect the new order.
- Then `api.reorderNodes(parentId, newOrder)` is called to persist the new order in the mock API.
- On success, we re-fetch the relevant parent’s children to ensure consistency.

### Add & Edit Nodes

- The **AddDialog** is shown when clicking the “+” icon. It creates a new **section** under a department or an **employee** under a section.
- The **EditDialog** is shown when clicking the “pencil” icon. It updates the node’s `name` and `details.description`.
- Both dialogs call the mock API methods (`api.addNode()` or `api.editNode()`) and then update the local tree state.

---

## How to Run

1. **Clone** this repository:
    
    ```
    git clone 
    cd dynamic-treeview
    
    ```
    
2. **Install dependencies**:

or
    
    ```
    npm install
    
    ```
    
    ```
    yarn
    
    ```
    
3. **Start the development server**:

or
    
    ```
    npm run dev
    
    ```
    
    ```
    yarn dev
    
    ```
    
4. **Open** your browser at http://localhost:5173 (or the port shown in your terminal).

---

## Usage

1. **Expanding a Node**
    - Click on the arrow (chevron) to expand or collapse.
    - Expanding triggers a lazy load of the child nodes (if they haven’t been loaded yet).
2. **Searching**
    - Type a department/section name in the search bar.
    - Matching nodes appear; parents are auto-expanded.
    - Clear the search to return to the full tree.
3. **Selecting a Node**
    - Click the node’s name to see its details on the right sidebar.
4. **Reordering**
    - Click the up/down icons to reorder siblings within the same parent.
5. **Drag-and-Drop**
    - Grab the handle icon (the “grip” on the left) and drop the node onto another valid parent or between siblings.
6. **Add / Edit**
    - Hover over a node to reveal action icons.
    - **Plus icon** → Add a sub-node (section or employee).
    - **Pencil icon** → Edit the current node’s name or description.

---

## Commit History

Below is the commit history reflecting the step-by-step development:

1. **11 Mar 2025 19:58** - *init vite-react-ts*
Initialized the project using Vite + React + TypeScript.
2. **11 Mar 2025 19:59** - *installing tailwind & removing boilerplate*
Set up Tailwind CSS and removed unnecessary boilerplate code.
3. **11 Mar 2025 20:00** - *add tree node types*
Created the `TreeNode` interface and basic type definitions.
4. **12 Mar 2025 18:58** - *interface enhancements*
Added styling enhancements and additional UI components.
5. **12 Mar 2025 18:59** - *fixing interface & create API with AI :)*
Implemented the mock `api.ts` with random data generation for departments, sections, and employees.
6. **12 Mar 2025 19:00** - *testing api functionalities & fixing api params*
Tested and refined the API endpoints for better reliability.
7. **13 Mar 2025 17:15** - *api description update*
Updated docstrings and inline comments in the API.
8. **13 Mar 2025 17:16** - *layout draft phase 1 - finishing details*
Created the layout structure: main tree on the left, details on the right.
9. **13 Mar 2025 17:17** - *finishing node details & first layer of node tree*
Completed the `NodeDetails` component to show metadata of a selected node.
10. **13 Mar 2025 17:18** - *refactoring the code to small components*
Split the code into `Tree`, `NodeDetails`, and `dialogs`.
11. **13 Mar 2025 17:19** - *finishing basic tree structure*
Implemented basic expand/collapse logic and lazy loading for children.
12. **13 Mar 2025 17:20** - *finishing addNodes & editNodes*
Added `AddDialog` and `EditDialog` for dynamic node creation and editing.
13. **13 Mar 2025 17:21** - *adding draggable (bugged)*
Began implementing drag-and-drop with `@dnd-kit/core`.
14. **13 Mar 2025 17:22** - *trying to fix drag & drop dev still bugged*
Debugged drag events and updated state management for dropping nodes.
15. **13 Mar 2025 17:23** - *finishing moving nodes between parents & reordering nodes*
Finalized logic to move nodes across different parents and reorder siblings.
16. **13 Mar 2025 17:24** - *refactoring the whole code so that reorder works*
Refined reorder logic, ensuring correct indices and sibling updates.
17. **13 Mar 2025 17:25** - *ui upgrades*
Added final UI polish, improved the user experience and visuals.# Untitled