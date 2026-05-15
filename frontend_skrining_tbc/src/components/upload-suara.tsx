"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Info, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

const formSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Minimal 1 rekaman suara batuk")
    .max(2, "Maksimal 2 rekaman suara batuk")
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), {
      message: "Ukuran file maksimal 5MB per rekaman",
      path: ["files"],
    }),
});

type FormValues = z.infer<typeof formSchema>;

export function UploadSuaraBatukForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  });

  const onSubmit = React.useCallback((data: FormValues) => {
    const fileNames = data.files.map((file) =>
      file.name.length > 40 ? `${file.name.slice(0, 40)}...` : file.name,
    );

    toast.success("Rekaman berhasil diunggah", {
      description: (
        <div className="space-y-1 text-left">
          <p className="text-sm text-muted-foreground">
            Sistem akan memproses suara batuk Anda untuk skrining TBC.
          </p>
          <p className="text-xs font-mono">
            {fileNames.join(", ")}
          </p>
        </div>
      ),
    });

    // TODO: Kirim data.files ke API skrining suara batuk di sini.
  }, []);

  return (
    <section className="w-full max-w-xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Unggah rekaman suara batuk Anda
        </h2>
        <p className="text-sm text-muted-foreground">
          Rekam suara batuk Anda selama sekitar 10–20 detik di tempat yang
          tenang, lalu unggah file rekamannya di sini. Sistem akan membantu
          melakukan skrining awal risiko TBC berdasarkan pola suara batuk.
        </p>
      </header>

      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
          <Info className="h-4 w-4 text-primary" />
          Cara merekam suara batuk yang baik
        </div>
        <ul className="list-disc text-left space-y-1 pl-5">
          <li>Pastikan berada di ruangan yang relatif tenang (minim suara lain).</li>
          <li>Jauhkan mikrofon/HP sekitar 20–30 cm dari mulut.</li>
          <li>Batuk beberapa kali secara alami selama 10–20 detik.</li>
          <li>Usahakan hanya satu orang yang batuk dalam satu rekaman.</li>
        </ul>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File rekaman suara batuk</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value}
                    onValueChange={field.onChange}
                    accept="audio/*"
                    maxFiles={2}
                    maxSize={5 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("files", {
                        message,
                      });
                    }}
                    multiple
                  >
                    <FileUploadDropzone className="flex flex-col items-center justify-center gap-1 border-dotted px-4 py-6 text-center text-sm">
                      <CloudUpload className="mb-1 h-5 w-5 text-primary" />
                      <p className="font-medium">
                        Seret dan letakkan file suara batuk Anda di sini
                      </p>
                      <p className="text-xs text-muted-foreground">
                        atau
                      </p>
                      <FileUploadTrigger asChild>
                        <Button variant="outline" size="sm">
                          Pilih file dari perangkat
                        </Button>
                      </FileUploadTrigger>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Format yang didukung: MP3, WAV, M4A &middot; Maksimal 2 file &middot; Maksimal 5MB per file
                      </p>
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value.map((file, index) => (
                        <FileUploadItem key={index} value={file}>
                          <FileUploadItemPreview />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            >
                              <X />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                  </FileUpload>
                </FormControl>
                <FormDescription>
                  Unggah 1–2 rekaman suara batuk dengan durasi sekitar 10–20 detik
                  untuk hasil analisis yang lebih akurat.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={() => window.location.href = "/user/screening-kesehatan"} variant="outline" className="w-full sm:w-auto">
              Kembali
            </Button>
            <Button onClick={() => window.location.href = "/user/hasil-screening"} type="submit" className="w-full sm:w-auto">
              Lanjutkan analisis
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}