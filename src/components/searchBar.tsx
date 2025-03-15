import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  performSearch: () => void;
  isSearching: boolean;
  searchResults: any[];
  clearSearch: () => void;
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  performSearch,
  isSearching,
  searchResults,
  clearSearch
}: SearchBarProps) {
  return (
    <div className="flex items-center justify-center p-6 border-b">
      <div className="relative w-full">
        <div className="flex flex-row w-full gap-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            placeholder="Search departments and sections..."
            className="pl-8 focus:ring-none focus:border-none"
          />
          <Button onClick={performSearch}>Search</Button>
        </div>
        {isSearching && (
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{searchResults.length} results found</span>
            <Button onClick={clearSearch}>Clear</Button>
          </div>
        )}
      </div>
    </div>
  );
}