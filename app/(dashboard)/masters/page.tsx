import { getMasters } from "@/actions/masters"
import { Users } from "lucide-react"

import MasterSheetWrapper from "./components/MasterSheetWrapper"
import MasterCard from "./components/MasterCard"
import MasterFilterToggle from "./components/MasterFilterToggle"

export default async function MastersPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const showAll = searchParams.filter === "all"
  
  const { data: masters, error } = await getMasters(showAll)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masters</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mechanic team, specialties, and job assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MasterSheetWrapper />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <MasterFilterToggle defaultShowAll={showAll} />
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <>
          {masters?.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center bg-muted/10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No masters found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                {showAll 
                  ? "You haven't added any mechanics yet. Click the button above to register your first master."
                  : "There are currently no active mechanics. Try showing all to see inactive masters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {masters?.map((master) => (
                <MasterCard key={master.id} master={master} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
