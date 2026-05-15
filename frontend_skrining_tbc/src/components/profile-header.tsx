import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ProfileHeaderProps {
  nama: string
  email: string
  role: string
}

export default function ProfileHeader({
  nama,
  email,
  role,
}: ProfileHeaderProps) {
  // Mengambil inisial dari nama
  const initials = nama
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:flex-row">
      <Avatar className="h-20 w-20">
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-semibold">{nama}</h1>
        <p className="text-muted-foreground">{email}</p>
        <Badge variant="outline" className="mt-2 capitalize">
          {role.replace("_", " ")}
        </Badge>
      </div>
    </div>
  )
}