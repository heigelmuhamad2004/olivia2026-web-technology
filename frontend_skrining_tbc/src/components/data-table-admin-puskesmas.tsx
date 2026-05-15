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

// Helper to parse age from string like "25 tahun"
function getAgeFromString(ageString?: string): number | null {
  if (!ageString) return null
  const ageMatch = ageString.match(/(\d+)/)
  return ageMatch ? parseInt(ageMatch[0], 10) : null
}

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
    header: "Nama Pasien",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.nama}</span>
        <span className="text-xs text-muted-foreground">
          NIK {row.original.nik}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "hasil_screening",
    header: "Hasil Screening",
    cell: ({ row }) => <ResultBadge result={row.original.hasil_screening} />,
  },
  {
    accessorKey: "tanggal_screening",
    header: "Tanggal Screening",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {dateFormatter.format(new Date(row.original.tanggal_screening))}
      </span>
    ),
  },
  {
    accessorKey: "total_screening",
    header: () => <div className="text-right">Total Screening</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">
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
  const [activeTab, setActiveTab] = React.useState("suspect-dewasa")
  
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
      const age = getAgeFromString(item.usia)
      const isAdult = age === null || age >= 15
      const isChild = age !== null && age < 15
      const screeningValue = item.hasil_screening || "" 
      const isPositive = screeningValue.toLowerCase() === "positif"

      switch (activeTab) {
        case "suspect-dewasa":
          return isPositive && isAdult
        case "non-suspect-dewasa":
          return !isPositive && isAdult
        case "suspect-anak":
          return isPositive && isChild
        case "non-suspect-anak":
          return !isPositive && isChild
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
    <div className="flex w-full flex-col justify-start gap-6">
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Memuat data skrining...</div>
      ) : null}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="suspect-dewasa">Suspect TB Dewasa</SelectItem>
            <SelectItem value="non-suspect-dewasa">
              Non Suspect TB Dewasa
            </SelectItem>
            <SelectItem value="suspect-anak">Suspect TB Anak</SelectItem>
            <SelectItem value="non-suspect-anak">Non Suspect TB Anak</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="suspect-dewasa">Suspect TB Dewasa</TabsTrigger>
            <TabsTrigger value="non-suspect-dewasa">
              Non Suspect TB Dewasa
            </TabsTrigger>
            <TabsTrigger value="suspect-anak">Suspect TB Anak</TabsTrigger>
            <TabsTrigger value="non-suspect-anak">
              Non Suspect TB Anak
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
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
              <TableHeader className="bg-muted sticky top-0 z-10">
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
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
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
  const isPositive = result.toLowerCase() === "positif"
  const badgeClass = isPositive
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200"

  return (
    <Badge
      variant="outline"
      className={`${badgeClass} px-2 py-0.5 text-xs font-semibold`}
    >
      {result}
    </Badge>
  )
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()
  const isPositif = item.hasil_screening.toLowerCase() === "positif"

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-primary w-fit px-0 text-left">
          Lihat detail
        </Button>
      </DrawerTrigger>
      {/* Ubah ukuran Drawer agar lebih lebar di desktop untuk menampung detail */}
      <DrawerContent className="h-[95vh] sm:h-auto sm:max-w-4xl sm:ml-auto rounded-t-[10px] sm:rounded-l-[10px] sm:rounded-r-none">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle>Detail Pasien - {item.nama}</DrawerTitle>
          <DrawerDescription>
            NIK {item.nik} • {item.no_hp}
          </DrawerDescription>
        </DrawerHeader>

        {/* ScrollArea Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="w-full space-y-6">
            
            {/* Bagian Grid Detail (Copied & Adapted from Hasil Screening Page) */}
            <section className="grid gap-6 rounded-lg bg-muted/40 p-4 sm:grid-cols-2 sm:p-6 border">
              
              {/* Kolom 1: Identitas */}
              <div className="space-y-2 border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Identitas
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Nama:</span> {item.nama}
                  </p>
                  <p>
                    <span className="font-medium">NIK:</span> {item.nik}
                  </p>
                  <p>
                    <span className="font-medium">Tanggal lahir:</span>{" "}
                    {item.tanggal_lahir || "-"} ({item.usia || "-"})
                  </p>
                  <p>
                    <span className="font-medium">Jenis kelamin:</span>{" "}
                    {item.kelamin || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Alamat:</span> {item.alamat}
                  </p>
                </div>
              </div>

              {/* Kolom 2: Kontak & Fisik */}
              <div className="space-y-2 pt-4 sm:border-l sm:border-border sm:pl-6 sm:pt-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Kontak dan pekerjaan
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">No. HP:</span> {item.no_hp}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {item.email || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Pekerjaan:</span>{" "}
                    {item.pekerjaan || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Berat badan:</span>{" "}
                    {item.berat_badan || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Tinggi badan:</span>{" "}
                    {item.tinggi_badan || "-"}
                  </p>
                </div>
              </div>

              {/* Baris: Hasil Screening */}
              <div className="space-y-2 border-t border-border pt-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Ringkasan hasil screening
                </p>
                <div className="space-y-2 rounded-md bg-background p-3 text-sm border">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium">Hasil screening:</span>
                    <ResultBadge result={item.hasil_screening} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Rekomendasi Sistem:</span>
                    <span className="text-sm text-muted-foreground">
                      {isPositif
                        ? "Pasien ini terindikasi memiliki gejala TBC. Disarankan untuk segera membuat rujukan pemeriksaan lebih lanjut."
                        : "Tidak ditemukan indikasi kuat TBC. Disarankan tetap menjaga pola hidup sehat."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Baris: Faktor Risiko & Gejala */}
              <div className="space-y-2 border-t border-border pt-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Faktor risiko dan gejala
                </p>
                <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  <DetailItem label="Riwayat kontak TBC" value={item.riwayat_kontak_tbc} />
                  <DetailItem label="Pernah terdiagnosa TBC" value={item.pernah_terdiagnosa} />
                  <DetailItem label="Pernah berobat TBC" value={item.pernah_berobat_tbc} />
                  <DetailItem label="Pengobatan TBC tidak tuntas" value={item.pernah_berobat_tb_tapi_tidak_tuntas} />
                  <DetailItem label="Malnutrisi" value={item.malnutrisi} />
                  <DetailItem label="Merokok / Perokok Pasif" value={item.merokok_perokok_pasif} />
                  <DetailItem label="Riwayat DM" value={item.riwayat_dm_kencing_manis} />
                  <DetailItem label="Lansia" value={item.lansia} />
                  <DetailItem label="Ibu Hamil" value={item.ibu_hamil} />
                  <DetailItem label="Batuk terus menerus" value={item.batuk} />
                  <DetailItem label="BB turun drastis" value={item.bb_turun_tanpa_sebab_nafsu_makan_turun} />
                  <DetailItem label="Demam tanpa sebab" value={item.demam_tidak_diketahui_penyebabnya} />
                  <DetailItem label="Badan lemas" value={item.badan_lemas} />
                  <DetailItem label="Berkeringat malam hari" value={item.berkeringat_malam_tanpa_kegiatan} />
                  <DetailItem label="Sesak napas" value={item.sesak_napas_tanpa_nyeri_dada} />
                  <DetailItem label="Pembesaran kelenjar leher" value={item.ada_pembesaran_getah_bening_dileher} />
                </div>
              </div>
            </section>

          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
            <DrawerClose asChild>
              <Button variant="outline">Tutup</Button>
            </DrawerClose>
            {isPositif && (
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Logika tombol rujukan disini
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

// Helper kecil agar kodingan lebih rapi untuk list gejala
function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between sm:justify-start sm:gap-2">
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className={value?.toLowerCase() === "ya" ? "font-bold text-red-600" : "text-foreground"}>
        {value || "-"}
      </span>
    </div>
  )
}