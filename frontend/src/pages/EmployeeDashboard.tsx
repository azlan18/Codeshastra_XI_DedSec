import { useState, useEffect } from "react";
import { CheckCircle, Clock, FileText, LogOut, Settings, Ticket, User, XCircle, Eye, EyeOff, X } from "lucide-react";
import axios from "axios";

// Mock data for tickets
const mockTickets = [
  {
    id: "TKT-001",
    query: "How to implement authentication in Next.js?",
    date: "2023-04-15",
    status: "success",
    output:
      "To implement authentication in Next.js, you can use NextAuth.js. First, install it with 'npm install next-auth'. Then create an API route at pages/api/auth/[...nextauth].js to handle authentication. Configure your providers (like Google, GitHub, etc.) and you're good to go!",
  },
  {
    id: "TKT-002",
    query: "Create a responsive navbar with Tailwind CSS",
    date: "2023-04-16",
    status: "success",
    output:
      "Here's a responsive navbar implementation with Tailwind CSS that includes a mobile menu toggle and smooth transitions...",
  },
  {
    id: "TKT-003",
    query: "How to deploy a React app to Vercel?",
    date: "2023-04-17",
    status: "success",
    output:
      "To deploy a React app to Vercel, first push your code to GitHub. Then go to vercel.com, sign in, click 'New Project', select your repository, and click 'Deploy'. Vercel will automatically build and deploy your app.",
  },
  {
    id: "TKT-004",
    query: "Generate an AI image of a cat playing piano",
    date: "2023-04-18",
    status: "error",
    output: "",
  },
  {
    id: "TKT-005",
    query: "Write a function to calculate Fibonacci sequence",
    date: "2023-04-19",
    status: "success",
    output:
      "```javascript\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}\n```",
  },
  {
    id: "TKT-006",
    query: "Create a database schema for an e-commerce platform",
    date: "2023-04-20",
    status: "error",
    output: "",
  },
];

// Remove mock user data and replace with interface
interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  employee_status: string;
  employee_join_date: string;
  last_security_training: string;
  past_violations: number;
  resource_sensitivity: string;
  time_in_position: string;
  user_role: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Add this interface for Toast
interface Toast {
  message: string;
  type: 'success' | 'error';
}

// Add this component at the top level of your file
const Toast = ({ message, type, onClose }: Toast & { onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    <div className="flex items-center">
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 mr-2" />
      ) : (
        <XCircle className="h-5 w-5 mr-2" />
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
    <button
      onClick={onClose}
      className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
);

export default function EmployeeDashboard() {
  const [activeView, setActiveView] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add new state for form editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  // Add these new states near your other state declarations
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add this state for toast
  const [toast, setToast] = useState<Toast | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Replace with actual user ID - you might get this from authentication context
        const userId = "67f17cb4824dce811aecc4ed"; 
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError("Failed to fetch user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user?._id}`,
        editForm
      );
      setUser(response.data);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update user data");
      console.error(err);
    }
  };

  const handleTicketClick = (ticket) => {
    if (selectedTicket && selectedTicket.id === ticket.id) {
      setSelectedTicket(null);
      setShowOutput(false);
    } else {
      setSelectedTicket(ticket);
      setShowOutput(false);
    }
  };

  const handleShowOutput = () => {
    setShowOutput(true);
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Add this function to show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/${user?._id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsPasswordDialogOpen(false);
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update password";
      setPasswordError(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  // Replace the profile section JSX with this:
  const renderProfile = () => {
    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!user) return <div className="p-6">No user data found</div>;

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <button
            onClick={() => setIsPasswordDialogOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Change Password
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-gray-600 dark:text-gray-400">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Department</label>
                <p className="text-gray-600 dark:text-gray-400">{user.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Employee Status</label>
                <p className="text-gray-600 dark:text-gray-400">{user.employee_status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Join Date</label>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(user.employee_join_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                <p className="text-gray-600 dark:text-gray-400">{user.user_role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Replace the password dialog JSX with this updated version:
  const renderPasswordDialog = () => (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={() => setIsPasswordDialogOpen(false)}
        ></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
          <form onSubmit={handlePasswordUpdate}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>
              
              {passwordError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setIsPasswordDialogOpen(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Add this line right after the opening div */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 flex items-center justify-center md:justify-start">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
            ED
          </div>
          <h1 className="ml-2 text-xl font-bold hidden md:block">Employee Dashboard</h1>
        </div>
        <hr className="border-t border-gray-200 dark:border-gray-700" />
        <div className="flex-1 py-6">
          <nav className="space-y-2 px-2">
            <button
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === "tickets"
                  ? "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveView("tickets")}
            >
              <Ticket className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Tickets</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === "profile"
                  ? "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveView("profile")}
            >
              <User className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Profile</span>
            </button>
          </nav>
        </div>
        <div className="p-4">
          <button
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeView === "tickets" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Tickets</h2>
              <div className="flex items-center space-x-2">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Recent
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedTicket && selectedTicket.id === ticket.id
                      ? "ring-2 ring-purple-500 shadow-lg"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="p-4 pb-2 relative">
                    <div className="absolute top-4 right-4">
                      {ticket.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium">{ticket.id}</h3>
                    <p className="text-sm text-gray-500">{ticket.date}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <p className="line-clamp-2 text-sm">{ticket.query}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Ticket Details */}
            {selectedTicket && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 border-t-4 border-t-purple-500">
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="flex items-center text-lg font-medium">
                        {selectedTicket.id}
                        <span className="ml-2 text-sm px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                          {selectedTicket.date}
                        </span>
                      </h3>
                      <p className="mt-2 text-base font-medium">{selectedTicket.query}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm">Status:</span>
                      {selectedTicket.status === "success" ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span>Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <XCircle className="h-5 w-5 mr-1" />
                          <span>Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Additional Information
                      </h4>
                      <p className="text-sm">
                        This ticket was processed on {selectedTicket.date} and its current status is{" "}
                        <span className={selectedTicket.status === "success" ? "text-green-500" : "text-red-500"}>
                          {selectedTicket.status === "success" ? "successful" : "failed"}
                        </span>
                        .
                      </p>
                    </div>

                    {selectedTicket.status === "success" && !showOutput && (
                      <button
                        onClick={handleShowOutput}
                        className="mt-4 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        View Output
                      </button>
                    )}

                    {showOutput && selectedTicket.status === "success" && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Output</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                          <pre className="text-sm whitespace-pre-wrap">{selectedTicket.output}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "profile" && renderProfile()}
      </div>

      {isPasswordDialogOpen && renderPasswordDialog()}
    </div>
  );
}