import { useState, useCallback } from "react";
import { TreeNode } from "@/types/tree";
import { api } from "@/services/api";

export function useSearch(tree: TreeNode[]) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  }, []);

  const performSearch = useCallback(async () => {
    if (searchQuery.trim() === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchNodes(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery]);

  return {
    isSearching,
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    performSearch
  };
}