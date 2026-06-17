import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"


export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <SectionCards />
      <div className="w-full">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}
