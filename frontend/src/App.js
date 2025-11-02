import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Plus, Search, Calendar, CheckCircle2, Circle, Clock, Trash2, Edit, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "sonner";
import { format } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Circle },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 }
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    deadline: ""
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterAndSearchTasks();
  }, [tasks, searchQuery, filterStatus]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    }
  };

  const filterAndSearchTasks = () => {
    let filtered = tasks;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Search by title or description
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleAddTask = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      await axios.post(`${API}/tasks`, formData);
      toast.success("Task created successfully!");
      setIsAddDialogOpen(false);
      setFormData({ title: "", description: "", status: "pending", deadline: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleEditTask = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      await axios.put(`${API}/tasks/${currentTask.id}`, formData);
      toast.success("Task updated successfully!");
      setIsEditDialogOpen(false);
      setCurrentTask(null);
      setFormData({ title: "", description: "", status: "pending", deadline: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      toast.success("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}/status`, { status: newStatus });
      toast.success("Task status updated!");
      fetchTasks();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const openEditDialog = (task) => {
    setCurrentTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      deadline: task.deadline || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", status: "pending", deadline: "" });
    setCurrentTask(null);
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div>
            <h1 className="header-title" data-testid="app-title">TaskFlow</h1>
            <p className="header-subtitle">Organize your tasks efficiently</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="add-task-btn" onClick={resetForm} data-testid="add-task-button">
                <Plus className="w-5 h-5" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="task-dialog" data-testid="add-task-dialog">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <div>
                  <label className="form-label">Title *</label>
                  <Input
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="task-title-input"
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <Textarea
                    placeholder="Enter task description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="task-description-input"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="status-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    data-testid="task-status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Deadline</label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    data-testid="task-deadline-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="cancel-add-button">
                  Cancel
                </Button>
                <Button onClick={handleAddTask} data-testid="submit-add-button">Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Search and Filter */}
        <div className="search-filter-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              data-testid="search-tasks-input"
            />
          </div>
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              data-testid="filter-status-select"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Task Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value" data-testid="total-tasks-count">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" data-testid="pending-tasks-count">{tasks.filter(t => t.status === "pending").length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" data-testid="in-progress-tasks-count">{tasks.filter(t => t.status === "in-progress").length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" data-testid="completed-tasks-count">{tasks.filter(t => t.status === "completed").length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* Task List */}
        <div className="tasks-grid" data-testid="tasks-grid">
          {filteredTasks.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <Calendar className="empty-icon" />
              <h3>No tasks found</h3>
              <p>Create your first task to get started!</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const StatusIcon = statusConfig[task.status].icon;
              return (
                <div key={task.id} className="task-card" data-testid={`task-card-${task.id}`}>
                  <div className="task-header">
                    <h3 className="task-title" data-testid={`task-title-${task.id}`}>{task.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="task-menu-btn" data-testid={`task-menu-${task.id}`}>
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(task)} data-testid={`edit-task-${task.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task.id)} 
                          className="text-red-600"
                          data-testid={`delete-task-${task.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {task.description && (
                    <p className="task-description" data-testid={`task-description-${task.id}`}>{task.description}</p>
                  )}
                  
                  <div className="task-footer">
                    <div className="task-meta">
                      <Badge className={statusConfig[task.status].color} data-testid={`task-status-${task.id}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[task.status].label}
                      </Badge>
                      {task.deadline && (
                        <span className="deadline-text" data-testid={`task-deadline-${task.id}`}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.deadline), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                    <div className="status-actions">
                      {task.status !== "pending" && (
                        <button
                          onClick={() => handleStatusChange(task.id, "pending")}
                          className="status-btn status-pending"
                          data-testid={`status-pending-${task.id}`}
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                      )}
                      {task.status !== "in-progress" && (
                        <button
                          onClick={() => handleStatusChange(task.id, "in-progress")}
                          className="status-btn status-progress"
                          data-testid={`status-in-progress-${task.id}`}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {task.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(task.id, "completed")}
                          className="status-btn status-complete"
                          data-testid={`status-completed-${task.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="task-dialog" data-testid="edit-task-dialog">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="dialog-form">
            <div>
              <label className="form-label">Title *</label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="edit-task-title-input"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <Textarea
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="edit-task-description-input"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="status-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                data-testid="edit-task-status-select"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="form-label">Deadline</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                data-testid="edit-task-deadline-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="cancel-edit-button">
              Cancel
            </Button>
            <Button onClick={handleEditTask} data-testid="submit-edit-button">Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;