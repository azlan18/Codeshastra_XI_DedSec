import { useState } from "react";
import { CheckCircle, Clock, FileText, LogOut, Settings, Ticket, User, XCircle } from "lucide-react";

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

// Mock user data
const user = {
  name: "Jane Smith",
  email: "jane.smith@company.com",
  avatar: "/placeholder.svg?height=100&width=100",
};

export default function EmployeeDashboard() {
  const [activeView, setActiveView] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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

        {activeView === "profile" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Profile</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden">
                    <img src={user.avatar} alt={user.name} />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <button
                        onClick={() => setIsPasswordDialogOpen(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Password
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <hr className="border-t border-gray-200 dark:border-gray-700" />
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="h-[300px] overflow-y-auto">
                  <div className="space-y-4">
                    {mockTickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            ticket.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {ticket.status === "success" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{ticket.id}</h4>
                            <span className="text-xs text-gray-500">{ticket.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{ticket.query}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Dialog */}
      {isPasswordDialogOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsPasswordDialogOpen(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enter your current password and a new password below.</p>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="current" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                        <input 
                          type="password" 
                          id="current" 
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="new" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <input 
                          type="password" 
                          id="new" 
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                        <input 
                          type="password" 
                          id="confirm" 
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}