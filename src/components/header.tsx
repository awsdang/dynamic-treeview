import { Loader2 } from "lucide-react"



export default function Header({isSyncing}:{isSyncing:boolean}) {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-row">
      <div className="container flex items-center justify-between py-4 mx-auto">
            <span className="mx-4 font-bold sm:inline-block">Department Tree</span>
      </div>
      {isSyncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
    </header>
  )
}

