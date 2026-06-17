import { ChartAreaInteractive } from '@/components/chart-area-superadmin'
import { SectionCardsSuperadmin } from '@/components/section-cards-superadmin'
import React from 'react'

function SuperAdmin() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <SectionCardsSuperadmin/>
      <div className="w-full">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}

export default SuperAdmin
