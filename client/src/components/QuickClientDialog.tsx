import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function QuickClientDialog({ onCreated, triggerLabel = "Tambah klien" }: { onCreated?: (id: number) => void; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const utils = trpc.useUtils();
  const create = trpc.clients.create.useMutation({ onSuccess: client => { utils.clients.list.invalidate(); toast.success("Klien ditambahkan."); setOpen(false); setName(""); setEmail(""); setPhone(""); onCreated?.(client.id); }, onError: error => toast.error(error.message) });
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" className="gap-2"><Plus className="size-4" />{triggerLabel}</Button></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Tambah klien baru</DialogTitle><DialogDescription>Simpan data minimum sekarang; detail lain dapat dilengkapi dari halaman Klien.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={event => { event.preventDefault(); create.mutate({ name, email, phone: phone || null, address: null, taxId: null }); }}><div className="space-y-1.5"><Label htmlFor="quick-client-name">Nama klien</Label><Input id="quick-client-name" value={name} onChange={event => setName(event.target.value)} required autoFocus /></div><div className="space-y-1.5"><Label htmlFor="quick-client-email">Email</Label><Input id="quick-client-email" value={email} type="email" onChange={event => setEmail(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="quick-client-phone">Telepon</Label><Input id="quick-client-phone" value={phone} onChange={event => setPhone(event.target.value)} /></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Simpan klien"}</Button></div></form></DialogContent></Dialog>;
}
