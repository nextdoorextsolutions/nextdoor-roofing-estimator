import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Search,
  Download,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Home,
  LogOut,
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  quoted: "bg-purple-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const { data: leadsData, isLoading, refetch } = trpc.admin.getLeadsWithEstimates.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = trpc.admin.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const updateNotesMutation = trpc.admin.updateLeadNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes updated");
      setIsNotesDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update notes: ${error.message}`);
    },
  });

  const deleteLeadMutation = trpc.admin.deleteLead.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Admin Login Required</CardTitle>
            <CardDescription>Please log in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" asChild>
              <a href="/">Return Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter leads
  const filteredLeads = leadsData?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lead.phone?.includes(searchTerm) ||
      item.lead.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const totalLeads = leadsData?.length || 0;
  const newLeads = leadsData?.filter((l) => l.lead.status === "new").length || 0;
  const wonLeads = leadsData?.filter((l) => l.lead.status === "won").length || 0;
  const totalRevenue = leadsData
    ?.filter((l) => l.lead.status === "won" && l.estimate)
    .reduce((sum, l) => sum + (l.estimate?.betterPrice || 0), 0) || 0;

  // Export to CSV
  const exportToCSV = () => {
    if (!leadsData || leadsData.length === 0) {
      toast.error("No leads to export");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Address",
      "Status",
      "Roof Area (sq ft)",
      "Pitch",
      "Good Price",
      "Better Price",
      "Best Price",
      "Created At",
      "Notes",
    ];

    const rows = leadsData.map((item) => [
      item.lead.id,
      item.lead.name || "",
      item.lead.email || "",
      item.lead.phone || "",
      `"${item.lead.address.replace(/"/g, '""')}"`,
      item.lead.status,
      item.estimate?.totalRoofArea || "",
      item.estimate?.averagePitch ? `${item.estimate.averagePitch}/12` : "",
      item.estimate?.goodPrice || "",
      item.estimate?.betterPrice || "",
      item.estimate?.bestPrice || "",
      new Date(item.lead.createdAt).toISOString(),
      `"${(item.lead.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported to CSV");
  };

  const handleStatusChange = (leadId: number, status: LeadStatus) => {
    updateStatusMutation.mutate({ leadId, status });
  };

  const handleNotesUpdate = () => {
    if (selectedLead !== null) {
      updateNotesMutation.mutate({ leadId: selectedLead, notes: editNotes });
    }
  };

  const openNotesDialog = (leadId: number, currentNotes: string | null) => {
    setSelectedLead(leadId);
    setEditNotes(currentNotes || "");
    setIsNotesDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors">
              <Home className="h-5 w-5" />
              <span className="font-semibold">NextDoor Exterior Solutions</span>
            </a>
            <Badge variant="outline" className="text-primary border-primary">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Welcome, {user.name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Leads</p>
                  <p className="text-3xl font-bold text-white">{totalLeads}</p>
                </div>
                <Users className="h-10 w-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">New Leads</p>
                  <p className="text-3xl font-bold text-blue-400">{newLeads}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Won Deals</p>
                  <p className="text-3xl font-bold text-green-400">{wonLeads}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Est. Revenue</p>
                  <p className="text-3xl font-bold text-amber-400">${totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-10 w-10 text-amber-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation Card */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              CRM API Integration
            </CardTitle>
            <CardDescription>
              Use these endpoints to integrate with your CRM system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
              <p className="text-gray-400 mb-2"># Get all leads with estimates (requires admin auth)</p>
              <p className="text-green-400">GET /api/trpc/admin.getLeadsWithEstimates</p>
              <p className="text-gray-400 mt-4 mb-2"># Update lead status</p>
              <p className="text-yellow-400">POST /api/trpc/admin.updateLeadStatus</p>
              <p className="text-gray-500 ml-4">{"{ leadId: number, status: 'new'|'contacted'|'quoted'|'won'|'lost' }"}</p>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Note: All admin endpoints require authentication. Log in as an admin user to access these endpoints.
            </p>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>Manage your roofing leads and estimates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Contact</TableHead>
                      <TableHead className="text-gray-400">Address</TableHead>
                      <TableHead className="text-gray-400">Roof Data</TableHead>
                      <TableHead className="text-gray-400">Estimate</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((item) => (
                      <TableRow key={item.lead.id} className="border-gray-800">
                        <TableCell>
                          <div className="space-y-1">
                            {item.lead.name && (
                              <p className="font-medium text-white">{item.lead.name}</p>
                            )}
                            {item.lead.email && (
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {item.lead.email}
                              </p>
                            )}
                            {item.lead.phone && (
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.lead.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-300 flex items-start gap-1 max-w-xs">
                            <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                            <span className="truncate">{item.lead.address}</span>
                          </p>
                        </TableCell>
                        <TableCell>
                          {item.estimate ? (
                            <div className="text-sm text-gray-400">
                              <p>{item.estimate.totalRoofArea?.toLocaleString()} sq ft</p>
                              <p>Pitch: {item.estimate.averagePitch}/12</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Manual Quote</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.estimate ? (
                            <div className="text-sm">
                              <p className="text-gray-400">Good: ${item.estimate.goodPrice?.toLocaleString()}</p>
                              <p className="text-primary font-medium">Better: ${item.estimate.betterPrice?.toLocaleString()}</p>
                              <p className="text-amber-400">Best: ${item.estimate.bestPrice?.toLocaleString()}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.lead.status}
                            onValueChange={(v) => handleStatusChange(item.lead.id, v as LeadStatus)}
                          >
                            <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                              <Badge className={`${statusColors[item.lead.status as LeadStatus]} text-white`}>
                                {statusLabels[item.lead.status as LeadStatus]}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="quoted">Quoted</SelectItem>
                              <SelectItem value="won">Won</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.lead.createdAt).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* View Details */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Lead Details</DialogTitle>
                                  <DialogDescription>
                                    Full information for this lead
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <div>
                                    <h4 className="font-semibold text-white mb-2">Contact Info</h4>
                                    <div className="space-y-2 text-sm text-gray-400">
                                      <p><strong>Name:</strong> {item.lead.name || "—"}</p>
                                      <p><strong>Email:</strong> {item.lead.email || "—"}</p>
                                      <p><strong>Phone:</strong> {item.lead.phone || "—"}</p>
                                      <p><strong>Address:</strong> {item.lead.address}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white mb-2">Estimate</h4>
                                    {item.estimate ? (
                                      <div className="space-y-2 text-sm text-gray-400">
                                        <p><strong>Roof Area:</strong> {item.estimate.totalRoofArea?.toLocaleString()} sq ft</p>
                                        <p><strong>Adjusted Area:</strong> {item.estimate.adjustedArea?.toLocaleString()} sq ft</p>
                                        <p><strong>Pitch:</strong> {item.estimate.averagePitch}/12</p>
                                        <p><strong>Pitch Surcharge:</strong> {item.estimate.hasPitchSurcharge ? "Yes" : "No"}</p>
                                        <div className="pt-2 border-t border-gray-700">
                                          <p><strong>Good:</strong> ${item.estimate.goodPrice?.toLocaleString()}</p>
                                          <p><strong>Better:</strong> ${item.estimate.betterPrice?.toLocaleString()}</p>
                                          <p><strong>Best:</strong> ${item.estimate.bestPrice?.toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-gray-500">Manual quote requested</p>
                                    )}
                                  </div>
                                </div>
                                {item.lead.notes && (
                                  <div className="border-t border-gray-700 pt-4">
                                    <h4 className="font-semibold text-white mb-2">Notes</h4>
                                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{item.lead.notes}</p>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Edit Notes */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openNotesDialog(item.lead.id, item.lead.notes)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Delete Lead</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this lead? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteLeadMutation.mutate({ leadId: item.lead.id })}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Notes</DialogTitle>
            <DialogDescription>
              Add or update notes for this lead
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Enter notes about this lead..."
            className="min-h-32 bg-gray-800 border-gray-700 text-white"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNotesUpdate} disabled={updateNotesMutation.isPending}>
              {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
