import { ChartAreaInteractive } from '@/components/chart-area-superadmin'
import { SectionCardsSuperadmin } from '@/components/section-cards-superadmin'
import React from 'react'

function SuperAdmin() {
  return (
    <>
      <SectionCardsSuperadmin/>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  )
}

export default SuperAdmin
