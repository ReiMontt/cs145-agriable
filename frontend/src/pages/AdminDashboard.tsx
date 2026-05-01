import React, { useState, useMemo } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useFarmersData, type FarmerRow } from "@/hooks/useFarmersData";
import { api, ApiError, type DashboardStats } from "@/lib/api";
import {
  Home,
  Receipt,
  Users,
  Sprout,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SearchX,
  X,
  IdCard,
  User as UserIcon,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

const adminNav = [
  { title: "Transactions", url: "/admin/transactions", icon: Receipt },
  { title: "Farmers", url: "/admin/farmers", icon: Users },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-heading font-bold text-lg">AgriAble</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/" end className="hover:bg-muted/50">
                <Home className="mr-2 h-4 w-4" />
                {!collapsed && <span>Return to Main Menu</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// ---------- Empty state ----------
const EmptyState = ({ onClear, message }: { onClear: () => void; message?: string }) => (
  <Card className="animate-fade-in">
    <CardContent className="p-12 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <SearchX className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-heading font-semibold text-lg">{message ?? "No results found"}</p>
      <p className="text-sm text-muted-foreground font-body max-w-sm">
        Try adjusting your search or filters to find what you're looking for.
      </p>
      <Button variant="outline" size="sm" className="mt-2 press" onClick={onClear}>
        <X className="w-4 h-4 mr-1.5" />
        Clear filters
      </Button>
    </CardContent>
  </Card>
);

const LoadingBlock = ({ label = "Loading from API…" }: { label?: string }) => (
  <Card>
    <CardContent className="p-12 flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <p className="text-sm font-body text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

// ---------- Transactions ----------
type SortKey = "target_id" | "timestamp" | "changed_kg";
type SortDir = "asc" | "desc";

function AdminTransactions() {
  const { transactions, farmers, loading, error, refresh } = useFarmersData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const nameByUin = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farmers) m.set(f.national_id, f.name);
    return m;
  }, [farmers]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearAll = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = transactions.filter((tx) => {
      const uin = tx.target_id ?? "";
      const name = nameByUin.get(uin) ?? "";
      const matchesSearch =
        !q || uin.toLowerCase().includes(q) || name.toLowerCase().includes(q);
      const txDate = tx.timestamp ? tx.timestamp.slice(0, 10) : "";
      const matchesFrom = !fromDate || txDate >= fromDate;
      const matchesTo = !toDate || txDate <= toDate;
      return matchesSearch && matchesFrom && matchesTo;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "changed_kg") {
        cmp = Number(a.changed_kg) - Number(b.changed_kg);
      } else if (sortKey === "timestamp") {
        cmp = (a.timestamp ?? "").localeCompare(b.timestamp ?? "");
      } else {
        cmp = (a.target_id ?? "").localeCompare(b.target_id ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [transactions, nameByUin, search, sortKey, sortDir, fromDate, toDate]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-primary" />
    );
  };

  const hasFilters = search || fromDate || toDate;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Transactions</h1>
        <Button variant="outline" size="sm" className="press" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by UIN or farmer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-body press w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              {fromDate || toDate ? "Date filter active" : "Date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <p className="font-heading font-semibold text-sm">Filter by date</p>
              <div className="space-y-2">
                <label className="text-xs font-body text-muted-foreground">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="font-body" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-body text-muted-foreground">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="font-body" />
              </div>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full press"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  <X className="w-4 h-4 mr-1.5" /> Clear dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm font-body text-destructive">
            Failed to load transactions: {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          onClear={clearAll}
          message={transactions.length === 0 ? "No transactions yet" : "No results found"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-heading cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("target_id")}>
                      Farmer <SortIcon k="target_id" />
                    </TableHead>
                    <TableHead className="font-heading cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("timestamp")}>
                      Timestamp <SortIcon k="timestamp" />
                    </TableHead>
                    <TableHead className="font-heading cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("changed_kg")}>
                      Amount <SortIcon k="changed_kg" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-body font-medium">
                        <div className="flex flex-col">
                          <span>{tx.farmer_name ?? nameByUin.get(tx.target_id ?? "") ?? "Unknown"}</span>
                          <span className="text-xs font-mono text-muted-foreground">{tx.target_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-muted-foreground whitespace-nowrap">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="font-body">{Number(tx.changed_kg)} kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {hasFilters && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground font-body">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}

// ---------- Farmers ----------
type FarmerFormState = {
  national_id: string;
  name: string;
  quota: string;
};

const emptyFarmerForm: FarmerFormState = {
  national_id: "",
  name: "",
  quota: "0",
};

function AdminFarmers() {
  const { farmers, loading, error, refresh } = useFarmersData();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<FarmerFormState>(emptyFarmerForm);

  const [editFarmer, setEditFarmer] = useState<FarmerRow | null>(null);
  const [editQuota, setEditQuota] = useState("");
  const [editNote, setEditNote] = useState("");

  const [deleteFarmer, setDeleteFarmer] = useState<FarmerRow | null>(null);

  const q = search.toLowerCase();
  const filtered = farmers.filter(
    (f) =>
      f.national_id.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q),
  );

  const openEdit = (f: FarmerRow) => {
    setEditFarmer(f);
    setEditQuota(String(f.quota_kg));
    setEditNote("");
  };

  const handleAdd = async () => {
    const nid = addForm.national_id.trim();
    const name = addForm.name.trim();
    if (!nid || !name) {
      toast({ title: "Missing required fields", description: "National ID and Name are required.", variant: "destructive" });
      return;
    }
    if (farmers.some((f) => f.national_id === nid)) {
      toast({ title: "Duplicate ID", description: "A farmer with this National ID already exists.", variant: "destructive" });
      return;
    }
    const quotaNum = Math.max(0, parseFloat(addForm.quota) || 0);

    setBusy(true);
    try {
      await api.registerFarmer({ national_id: nid, name, quota_kg: quotaNum });
      toast({ title: "Farmer added", description: `${name} has been registered.` });
      setAddForm(emptyFarmerForm);
      setAddOpen(false);
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to add farmer";
      toast({ title: "Add failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveQuota = async () => {
    if (!editFarmer) return;
    const quotaNum = Math.max(0, parseFloat(editQuota) || 0);

    setBusy(true);
    try {
      await api.updateFarmerQuota(editFarmer.national_id, {
        new_quota_kg: quotaNum,
        reset_remaining: true,
      });
      toast({ title: "Quota updated", description: `${editFarmer.name}'s quota set to ${quotaNum} kg.` });
      setEditFarmer(null);
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to update quota";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFarmer) return;
    setBusy(true);
    try {
      await api.deleteFarmer(deleteFarmer.national_id);
      toast({ title: "Farmer removed", description: `${deleteFarmer.name} has been deleted.` });
      setDeleteFarmer(null);
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to delete farmer";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold">Farmer Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="press" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="press" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Farmer
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by National ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 font-body"
        />
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm font-body text-destructive">
            Failed to load farmers: {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          onClear={() => setSearch("")}
          message={farmers.length === 0 ? "No farmers registered yet" : "No results found"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((f) => {
            const pct = f.quota_kg > 0 ? Math.min(100, Math.round((f.used_kg / f.quota_kg) * 100)) : 0;
            const overQuota = f.quota_kg > 0 && f.used_kg >= f.quota_kg;
            const noQuota = f.quota_kg === 0;
            return (
              <Card key={f.national_id} className="hover-lift overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-5 border-b bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-bold truncate">{f.name}</p>
                          <p className="text-xs font-body text-muted-foreground mt-0.5 capitalize">
                            {f.role ?? "farmer"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-background border px-2 py-1 rounded shrink-0 flex items-center gap-1">
                        <IdCard className="w-3 h-3" />
                        {f.national_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-body">
                        <span className="text-muted-foreground">Rice Quota Usage</span>
                        <span className={`font-medium ${overQuota ? "text-destructive" : "text-foreground"}`}>
                          {noQuota ? "No quota set" : `${f.used_kg} kg / ${f.quota_kg} kg`}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${overQuota ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="press flex-1" onClick={() => openEdit(f)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        {noQuota ? "Set Quota" : "Edit Quota"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="press text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteFarmer(f)}
                        aria-label={`Delete ${f.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Farmer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Farmer</DialogTitle>
            <DialogDescription className="font-body">
              Register a new farmer and assign their initial rice quota.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nid">National ID *</Label>
              <Input
                id="nid"
                value={addForm.national_id}
                onChange={(e) => setAddForm({ ...addForm, national_id: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quota">Initial Quota (kg)</Label>
              <Input
                id="quota"
                type="number"
                min={0}
                step="0.1"
                value={addForm.quota}
                onChange={(e) => setAddForm({ ...addForm, quota: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="press" onClick={() => setAddOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="press" onClick={handleAdd} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Add Farmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quota Dialog */}
      <Dialog open={!!editFarmer} onOpenChange={(o) => !o && setEditFarmer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Update Quota</DialogTitle>
            <DialogDescription className="font-body">
              {editFarmer && (
                <>
                  Set a new quota for <span className="font-semibold">{editFarmer.name}</span> (ID {editFarmer.national_id}).
                  Each change is saved as a new entry in the quota history.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-quota">New Total Quota (kg)</Label>
              <Input
                id="edit-quota"
                type="number"
                min={0}
                step="0.1"
                value={editQuota}
                onChange={(e) => setEditQuota(e.target.value)}
              />
              {editFarmer && (
                <p className="text-xs font-body text-muted-foreground">
                  Current used: {editFarmer.used_kg} kg (computed from transactions)
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Input
                id="edit-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="e.g. April quota cycle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="press" onClick={() => setEditFarmer(null)} disabled={busy}>
              Cancel
            </Button>
            <Button className="press" onClick={handleSaveQuota} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteFarmer} onOpenChange={(o) => !o && setDeleteFarmer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete farmer?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {deleteFarmer && (
                <>
                  This will permanently remove <span className="font-semibold">{deleteFarmer.name}</span> (ID {deleteFarmer.national_id}) and all their quota history. Transaction records will be preserved. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="press" disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="press bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const adminSections: Record<string, { title: string; node: React.ReactNode }> = {
  "/admin": { title: "Transactions", node: <AdminTransactions /> },
  "/admin/transactions": { title: "Transactions", node: <AdminTransactions /> },
  "/admin/farmers": { title: "Farmers", node: <AdminFarmers /> },
};

const AdminDashboard = () => {
  const location = useLocation();
  const section = adminSections[location.pathname] || adminSections["/admin/transactions"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 gap-3 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <span className="font-heading font-semibold">{section.title}</span>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-background">{section.node}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
