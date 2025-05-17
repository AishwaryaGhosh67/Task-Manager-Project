import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../styles/Dashboard.module.css';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  assignedTo: string;
  createdBy: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'low',
    assignedTo: '',
  });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'low',
    status: 'pending',
    assignedTo: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/');
    } else {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure that assignedTo is not an empty string before submitting
      if (!newTask.assignedTo) {
        alert('Please assign the task to a user.');
        return;
      }

      const res = await api.post('/tasks', newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201) {
        // Reset form fields
        setNewTask({
          title: '',
          description: '',
          dueDate: '',
          priority: 'low',
          assignedTo: '',
        });

        fetchTasks(); // Refresh the task list
      }
    } catch (err) {
      console.error('Task creation failed', err);
      alert('Task creation failed. Please check console for more details.');
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task._id);
    setEditTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.split('T')[0],
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditTask({ ...editTask, [e.target.name]: e.target.value });
  };

  const handleTaskUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${id}`, editTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Dashboard</h1>
      <button onClick={handleLogout} className={styles.logout}>
        Logout
      </button>

      <form onSubmit={handleTaskCreate} className={styles.taskForm}>
        <h2>Create Task</h2>
        <input
          name="title"
          placeholder="Title"
          value={newTask.title}
          onChange={handleTaskChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newTask.description}
          onChange={handleTaskChange}
        />
        <input
          type="date"
          name="dueDate"
          value={newTask.dueDate}
          onChange={handleTaskChange}
          required
        />
        <select name="priority" value={newTask.priority} onChange={handleTaskChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          name="assignedTo"
          placeholder="Assigned To"
          value={newTask.assignedTo}
          onChange={handleTaskChange}
          required
        />
        <button type="submit">Create</button>
      </form>

      <div className={styles.tasks}>
        {tasks.map((task) => (
          <div key={task._id} className={styles.task}>
            <h3 className={styles.taskTitle}>{task.title}</h3>
            <p>{task.description}</p>
            <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            <p>Priority: {task.priority}</p>
            <p>Status: {task.status}</p>
            <button style={{backgroundColor: "green"}} onClick={() => startEdit(task)}>Edit</button>
            <button style={{backgroundColor: "red"}} onClick={() => handleDelete(task._id)}>Delete</button>
          </div>
        ))}
      </div>

      {editingTaskId && (
        <form onSubmit={(e) => handleTaskUpdate(e, editingTaskId)} className={styles.taskForm}>
          <h2>Edit Task</h2>
          <input name="title" value={editTask.title} onChange={handleEditChange} />
          <textarea name="description" value={editTask.description} onChange={handleEditChange} />
          <input type="date" name="dueDate" value={editTask.dueDate} onChange={handleEditChange} />
          <select name="priority" value={editTask.priority} onChange={handleEditChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input name="assignedTo" value={editTask.assignedTo} onChange={handleEditChange} />
          <button type="submit">Update</button>
        </form>
      )}
    </div>
  );
}
