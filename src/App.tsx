import { api } from './services/api';
import { useEffect } from 'react';

function App() {


  useEffect(() => {
    // Load initial data when component mounts
    loadRootNodes();
    
  }, []);
  async function loadRootNodes() {
    const rootNodes = await api.fetchRootNodes();
    console.log(rootNodes); // Display departments
    expandNode(rootNodes[0].id);
    searchTree(rootNodes[0].name);
  }
  
  async function expandNode(parentId: string) {
    const children = await api.fetchChildNodes(parentId);
    console.log(children); // Display sections or subsections
  }
  
  async function searchTree(query: string) {
    const results = await api.searchNodes(query);
    console.log(results); // Display matching nodes
    expandNode(results[2].id);
  }
  

  return (
    <>
    <div className='bg-black text-white'>hello world</div>
    </>
  )
}

export default App
