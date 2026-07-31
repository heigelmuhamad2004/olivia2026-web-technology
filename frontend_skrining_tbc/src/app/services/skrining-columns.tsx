"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

// Definisikan tipe data yang sesuai dengan respons API Anda
export interface Skrining {
  id: number
  nama: string
  nik: string
  hasil_screening: string
  tanggal_screening: string
  nama_kecamatan: string
  // ... tambahkan properti lain jika ada
}

export const columns: ColumnDef<Skrining>[] = [
  {
    accessorKey: "nama",
    header: "Nama Pasien",
  },
  {
    accessorKey: "nik",
    header: "NIK",
  },
  {
    accessorKey: "nama_kecamatan",
    header: "Kecamatan",
  },
  {
    accessorKey: "tanggal_screening",
    header: "Tanggal Skrining",
    cell: ({ row }) => {
      const date = new Date(row.getValue("tanggal_screening"))
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    },
  },
  {
    accessorKey: "hasil_screening",
    header: "Hasil",
    cell: ({ row }) => {
      const hasil = row.getValue("hasil_screening") as string
      const isSuspect = hasil?.toUpperCase().includes("TERDUGA")
      return <Badge variant={isSuspect ? "destructive" : "default"}>{hasil}</Badge>
    },
  },
]