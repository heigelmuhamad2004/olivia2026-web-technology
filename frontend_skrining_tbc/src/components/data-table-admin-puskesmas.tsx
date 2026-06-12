"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconDownload,
  IconGripVertical,
  IconLayoutColumns,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { getSkrining } from "@/app/services/skrining.services"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

// Pastikan skema ini cocok dengan data yang dikirim dari backend baru Anda
export const schema = z.object({
  id: z.number(),
  nama: z.string(),
  nik: z.string(),
  no_hp: z.string().nullable(),
  alamat: z.string().nullable(),
  hasil_screening: z.string(),
  tanggal_screening: z.string(),
  total_screening: z.number(),
  // --- Data Tambahan dari Halaman Hasil Screening ---
  email: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  usia: z.string().optional().nullable(),
  pekerjaan: z.string().optional().nullable(),
  kelamin: z.string().optional().nullable(),
  berat_badan: z.string().optional().nullable(),
  tinggi_badan: z.string().optional().nullable(),
  // Gejala & Faktor Risiko
  riwayat_kontak_tbc: z.string().optional().nullable(),
  pernah_terdiagnosa: z.string().optional().nullable(),
  pernah_berobat_tbc: z.string().optional().nullable(),
  pernah_berobat_tb_tapi_tidak_tuntas: z.string().optional().nullable(),
  malnutrisi: z.string().optional().nullable(),
  merokok_perokok_pasif: z.string().optional().nullable(),
  riwayat_dm_kencing_manis: z.string().optional().nullable(),
  lansia: z.string().optional().nullable(),
  ibu_hamil: z.string().optional().nullable(),
  batuk: z.string().optional().nullable(),
  bb_turun_tanpa_sebab_nafsu_makan_turun: z.string().optional().nullable(),
  demam_tidak_diketahui_penyebabnya: z.string().optional().nullable(),
  badan_lemas: z.string().optional().nullable(),
  berkeringat_malam_tanpa_kegiatan: z.string().optional().nullable(),
  sesak_napas_tanpa_nyeri_dada: z.string().optional().nullable(),
  ada_pembesaran_getah_bening_dileher: z.string().optional().nullable(),
  riwayat_screening: z.array(z.any()).optional(), // Dibuat lebih fleksibel
})

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nama",
    header: () => <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Nama Pasien</div>,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-[14px] font-medium text-foreground">{row.original.nama}</span>
        <span className="text-[12px] text-muted-foreground">
          NIK {row.original.nik}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "hasil_screening",
    header: () => <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Hasil Skrining</div>,
    cell: ({ row }) => <ResultBadge result={row.original.hasil_screening} />,
  },
  {
    accessorKey: "tanggal_screening",
    header: () => <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Tanggal</div>,
    cell: ({ row }) => (
      <span className="text-[14px] text-muted-foreground">
        {dateFormatter.format(new Date(row.original.tanggal_screening))}
      </span>
    ),
  },
  {
    accessorKey: "total_screening",
    header: () => <div className="text-right text-[12px] font-medium uppercase tracking-wider text-muted-foreground font-mono">Total Skrining</div>,
    cell: ({ row }) => (
      <div className="text-right text-[14px] font-medium text-foreground">
        {row.original.total_screening}x
      </div>
    ),
  },
  {
    id: "detail",
    header: () => <span className="sr-only">Detail</span>,
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data?: z.infer<typeof schema>[]
}) {
  const [activeTab, setActiveTab] = React.useState("all")
  
  // PERBAIKAN: State untuk menyimpan SEMUA data dari API
  const [allData, setAllData] = React.useState<z.infer<typeof schema>[]>(() => initialData ?? [])
  const sortableId = React.useId()
  const [loading, setLoading] = React.useState(!initialData)
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  // Efek untuk mengambil data dari API HANYA jika initialData tidak diberikan
  React.useEffect(() => {
    if (initialData) return

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      try {
        const list = await getSkrining()
        if (isMounted) {
          setAllData(list)
        }
      } catch (err) {
        console.error("Gagal memuat skrining:", err)
        if (isMounted) {
          setAllData([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [initialData])

  // PERBAIKAN: Memo untuk memfilter data berdasarkan state 'allData'
  const filteredData = React.useMemo(() => {
    return allData.filter((item) => {
      const screeningValue = item.hasil_screening || "" 
      const isPositive = screeningValue.toLowerCase() === "positif" || screeningValue.toLowerCase().includes("terduga")

      switch (activeTab) {
        case "suspect":
          return isPositive
        case "non-suspect":
          return !isPositive
        case "all":
        default:
          return true
      }
    })
  }, [allData, activeTab])

  // Hapus state [data, setData] yang lama dan useEffect yang menimpanya.
  // Gunakan 'filteredData' langsung untuk tabel.

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData] // Bergantung pada filteredData
  )

  const table = useReactTable({
    data: filteredData, // PERBAIKAN: Gunakan filteredData di sini
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      // PERBAIKAN: Update state allData, bukan state data yang sudah dihapus
      setAllData((currentData) => {
        const oldIndex = currentData.findIndex(item => item.id === active.id)
        const newIndex = currentData.findIndex(item => item.id === over.id)
        return arrayMove(currentData, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex w-full flex-col justify-start gap-6" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Memuat data skrining...</div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-full sm:hidden rounded-full h-10 px-4 text-[13px] border-border bg-background"
            id="view-selector"
          >
            <SelectValue placeholder="Semua Pasien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pasien</SelectItem>
            <SelectItem value="suspect">Suspect TBC</SelectItem>
            <SelectItem value="non-suspect">Non Suspect TBC</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:flex">
          <TabsList className="h-10 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="all" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Semua Pasien</TabsTrigger>
            <TabsTrigger value="suspect" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Suspect TBC</TabsTrigger>
            <TabsTrigger value="non-suspect" className="rounded-full px-5 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Non Suspect TBC</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full h-10 px-4 text-[13px]">
                <IconLayoutColumns className="w-4 h-4 mr-1.5" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="w-4 h-4 ml-1.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconDownload />
            <span className="hidden lg:inline">Unduh CSV</span>
          </Button>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10 border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Tidak ada hasil.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-[13px] lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} dari{" "}
            {table.getFilteredRowModel().rows.length} baris dipilih.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Baris per halaman
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultBadge({ result }: { result: string }) {
  const isPositive = result.toLowerCase() === "positif" || result.toLowerCase().includes("terduga")
  const badgeClass = isPositive
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}
    >
      {result}
    </span>
  )
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()
  const isPositif = item.hasil_screening.toLowerCase() === "positif" || item.hasil_screening.toLowerCase().includes("terduga")

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="text-foreground hover:bg-muted/50 rounded-full px-3 h-8 text-[13px]">
          Lihat detail
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[95vh] sm:h-full sm:max-w-xl sm:ml-auto rounded-t-[16px] sm:rounded-l-[16px] sm:rounded-r-none border-border" style={{ fontFamily: "Geist, Inter, system-ui, sans-serif" }}>
        <DrawerHeader className="border-b border-border pb-4 pt-6 px-6 text-left">
          <DrawerTitle className="text-xl font-semibold tracking-tight">Detail Pasien</DrawerTitle>
          <DrawerDescription className="mt-1 text-[14px]">
            <span className="font-medium text-foreground">{item.nama}</span> • NIK {item.nik}
          </DrawerDescription>
        </DrawerHeader>

        {/* ScrollArea Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
          <section className="grid gap-6 rounded-[12px] bg-muted/30 border border-border p-5 sm:p-6 shadow-sm">
              
              <div className="space-y-3 pb-4 sm:pb-0 sm:border-r border-border sm:pr-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Identitas
                </p>
                <div className="space-y-1.5 text-[14px]">
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Nama:</span> <span className="font-medium sm:font-normal">{item.nama}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">NIK:</span> <span>{item.nik}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1">
                    <span className="text-muted-foreground sm:font-medium sm:text-foreground">Tanggal lahir:</span>{" "}
                    <span>{item.tanggal_lahir || "-"} ({item.usia || "-"})</span>
                  </p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Jenis kelamin:</span> <span>{item.kelamin || "-"}</span></p>
                  <p className="flex flex-col sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Alamat:</span> <span className="text-balance">{item.alamat}</span></p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border sm:border-t-0 sm:pl-2 sm:pt-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Kontak & Pekerjaan
                </p>
                <div className="space-y-1.5 text-[14px]">
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">No. HP:</span> <span>{item.no_hp}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Email:</span> <span>{item.email || "-"}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Pekerjaan:</span> <span>{item.pekerjaan || "-"}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Berat badan:</span> <span>{item.berat_badan || "-"}</span></p>
                  <p className="flex justify-between sm:block sm:space-x-1"><span className="text-muted-foreground sm:font-medium sm:text-foreground">Tinggi badan:</span> <span>{item.tinggi_badan || "-"}</span></p>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Ringkasan Hasil Skrining
                </p>
                <div className="space-y-4 rounded-md border border-border bg-background p-4 text-[14px] shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-foreground">Status Diagnosis:</span>
                    <ResultBadge result={item.hasil_screening} />
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[13px] font-medium text-foreground">Rekomendasi Sistem:</span>
                    <span className="text-[13px] text-muted-foreground leading-relaxed">
                      {isPositif
                        ? "Pasien ini terindikasi memiliki gejala TBC. Disarankan untuk segera membuat rujukan pemeriksaan lebih lanjut."
                        : "Tidak ditemukan indikasi kuat TBC. Disarankan tetap menjaga pola hidup sehat."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-border sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Faktor Risiko & Gejala Dilaporkan
                </p>
                <div className="grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                  <DetailItem label="Riwayat kontak TBC" value={item.riwayat_kontak_tbc} />
                  <DetailItem label="Pernah terdiagnosa" value={item.pernah_terdiagnosa} />
                  <DetailItem label="Pernah berobat" value={item.pernah_berobat_tbc} />
                  <DetailItem label="Pengobatan tdk tuntas" value={item.pernah_berobat_tb_tapi_tidak_tuntas} />
                  <DetailItem label="Malnutrisi" value={item.malnutrisi} />
                  <DetailItem label="Perokok" value={item.merokok_perokok_pasif} />
                  <DetailItem label="Riwayat DM" value={item.riwayat_dm_kencing_manis} />
                  <DetailItem label="Lansia (60+)" value={item.lansia} />
                  <DetailItem label="Ibu hamil" value={item.ibu_hamil} />
                  <DetailItem label="Batuk" value={item.batuk} />
                  <DetailItem label="BB turun tanpa sebab" value={item.bb_turun_tanpa_sebab_nafsu_makan_turun} />
                  <DetailItem label="Demam" value={item.demam_tidak_diketahui_penyebabnya} />
                  <DetailItem label="Badan lemas" value={item.badan_lemas} />
                  <DetailItem label="Berkeringat malam" value={item.berkeringat_malam_tanpa_kegiatan} />
                  <DetailItem label="Sesak napas" value={item.sesak_napas_tanpa_nyeri_dada} />
                  <DetailItem label="Pembesaran getah bening" value={item.ada_pembesaran_getah_bening_dileher} />
                </div>
              </div>
          </section>
        </div>

        <DrawerFooter className="border-t border-border p-4 sm:px-6 sm:py-4 bg-background">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-full px-6 h-10 text-[14px]">Tutup</Button>
            </DrawerClose>
            {isPositif && (
              <Button
                variant="default"
                className="rounded-full px-6 h-10 text-[14px] shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a]"
                onClick={() => {
                  console.log("Buat rujukan untuk id:", item.id)
                  alert(`Rujukan dibuat untuk ${item.nama}`)
                }}
              >
                Buat Rujukan
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  const isWarning = value?.toLowerCase() === "ya" || value?.toLowerCase() === "iya"
  return (
    <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-border/50 sm:border-0 pb-1.5 sm:pb-0">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${isWarning ? "text-destructive" : "text-foreground"}`}>
        {value || "-"}
      </span>
    </div>
  )
}