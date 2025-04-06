import React from 'react';
import {
  Database,
  FileText,
  Brain,
  Shield,
  Zap,
  Mail,
  ArrowRight,
  Search,
  Lock,
  BarChart3,
  FileImage,
  MessageSquare,
  Layers,
  Settings,
  Users,
  DropletIcon as Dropbox,
  FileUp,
  PanelRight,
  Bot,
} from "lucide-react";

// Button component since we're not using the shadcn/ui components
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  }

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    lg: "h-11 px-8 py-3 text-lg",
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </button>
  )
}

// Link component since we're not using Next.js
const Link = ({
  href,
  children,
  className = "",
}) => {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

// Feature step component with improved styling
const FeatureStep = ({ number, icon, title, description }) => {
  return (
    <div className="flex flex-col md:flex-row items-start relative mb-8">
      <div className="flex items-center mb-4 md:mb-0">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center z-10 shadow-md border border-gray-100">
          <div className={`w-12 h-12 ${number % 2 === 0 ? 'bg-red-600' : 'bg-blue-600'} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="text-6xl font-bold text-gray-200 ml-4 hidden md:block">{number.toString().padStart(2, '0')}</div>
      </div>
      
      <div className="flex-1 ml-0 md:ml-8 bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default function Landing() {
  // Fixed How It Works section with the feature cards
  const howItWorksSteps = [
    {
      number: 1,
      title: "Data Ingestion & Integration",
      description:
        "Our system connects to your existing data sources and platforms, ingesting multimodal content including text documents, images, PDFs, and more. Integration with Notion, Dropbox, and GDrive ensures all your enterprise knowledge is accessible.",
      icon: <FileImage className="h-8 w-8 text-white" />,
    },
    {
      number: 2,
      title: "Intelligent Processing & Permission Control",
      description:
        "Advanced AI models process and classify your data, while our permission control system ensures that users only access information they're authorized to see. The classification model evaluates each request based on user role and resource sensitivity.",
      icon: <Shield className="h-8 w-8 text-white" />,
    },
    {
      number: 3,
      title: "Context-Rich Retrieval",
      description:
        "When a query is received, our RAG pipeline retrieves the most relevant data chunks from your knowledge base, ensuring that responses are accurate, domain-specific, and contextually appropriate.",
      icon: <Search className="h-8 w-8 text-white" />,
    },
    {
      number: 4,
      title: "Interactive Response Generation",
      description:
        "The retrieved information is processed by our enhanced LLM to generate comprehensive answers that go beyond plain text, incorporating visual elements and interactive controls for an engaging user experience.",
      icon: <Layers className="h-8 w-8 text-white" />,
    },
  ];

  return (
    <div className="overflow-x-hidden bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-x-hidden px-5 bg-gradient-to-br from-gray-50 to-gray-100 md:px-28 lg:pt-10">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-full bg-[radial-gradient(circle_500px_at_50%_200px,#e6f0ff,transparent)]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='none' stroke='%23e2e8f0' strokeWidth='2' strokeDasharray='10 10'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative container mx-auto px-4">
          <header className="py-6">
            <nav className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">EnterpriseRAG</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">
                  How it Works
                </Link>
                <Link href="#integrations" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Integrations
                </Link>
                <Link href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Contact
                </Link>
              </div>
              <div>
                <Link href="/login">
                  <Button variant="outline" className="mr-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </nav>
          </header>

          <div className="flex min-h-[calc(100vh-80px)] items-center">
            <div className="grid lg:grid-cols-2 gap-16 w-full py-20">
              {/* Left column - Content */}
              <div className="space-y-8">
                {/* Security badge */}
                <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-2 text-blue-600">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-sm font-medium">Enterprise-Grade Security</span>
                </div>

                {/* Main heading */}
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
                    Intelligent
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">
                      Knowledge Retrieval
                    </span>
                    Powered by AI
                  </h1>
                  <p className="text-xl text-gray-600 max-w-xl">
                    Transform your enterprise data into actionable insights with our secure, scalable RAG pipeline that
                    delivers context-rich answers with interactive UI elements.
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white text-lg h-14 px-8"
                    >
                      <Shield className="mr-2 h-5 w-5" />
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-gray-800 border-gray-300 hover:bg-gray-100 text-lg h-14 px-8"
                    >
                      <Bot className="mr-2 h-5 w-5" />
                      Request Demo
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">99.9%</div>
                    <div className="text-gray-600">Data Security</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">10x</div>
                    <div className="text-gray-600">Faster Insights</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">24/7</div>
                    <div className="text-gray-600">AI Assistance</div>
                  </div>
                </div>
              </div>

              {/* Right column - Visual */}
              <div className="relative">
                {/* Main container with glass effect */}
                <div className="relative bg-white/80 rounded-3xl border border-gray-200 shadow-xl p-8 h-full">
                  {/* Decorative elements */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/50 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-100/50 blur-3xl" />
                  </div>

                  {/* Floating Stats Card */}
                  <div className="absolute -top-8 -right-8 bg-gradient-to-br from-blue-600 to-red-600 p-[1px] rounded-2xl rotate-6 shadow-xl">
                    <div className="bg-white rounded-2xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-blue-200 rounded-full animate-ping opacity-50" />
                          <Brain className="h-12 w-12 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-gray-900 font-bold text-lg">AI Analysis</div>
                          <div className="text-red-600 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              Processing Query
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Feature Area */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-200">
                    {/* Feature Cards */}
                    <div className="absolute inset-0 p-6">
                      <div className="grid grid-cols-2 gap-6 h-full">
                        {[
                          {
                            icon: <FileUp className="h-8 w-8 text-white" />,
                            title: "Multimodal Ingestion",
                            desc: "Text, images, PDFs & more",
                            gradient: "from-blue-500 to-blue-600",
                            textColor: "text-gray-700",
                          },
                          {
                            icon: <Lock className="h-8 w-8 text-white" />,
                            title: "Permission Control",
                            desc: "Role-based access",
                            gradient: "from-red-500 to-red-600",
                            textColor: "text-gray-700",
                          },
                          {
                            icon: <Brain className="h-8 w-8 text-white" />,
                            title: "AI Insights",
                            desc: "Context-rich answers",
                            gradient: "from-blue-600 to-blue-700",
                            textColor: "text-gray-700",
                          },
                          {
                            icon: <PanelRight className="h-8 w-8 text-white" />,
                            title: "Interactive UI",
                            desc: "Dynamic visual elements",
                            gradient: "from-red-600 to-red-700",
                            textColor: "text-gray-700",
                          },
                        ].map((feature, i) => (
                          <div
                            key={i}
                            className="group relative bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                          >
                            <div
                              className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-3`}
                            >
                              {feature.icon}
                            </div>
                            <div className="font-semibold text-gray-900 text-lg mb-1">{feature.title}</div>
                            <div className={feature.textColor}>{feature.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our enterprise-grade RAG system provides comprehensive solutions for your data needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileUp className="h-12 w-12 text-white" />,
                title: "Multimodal Data Ingestion",
                description:
                  "Seamlessly ingest and index text, images, PDFs, and other media types from various sources.",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: <Dropbox className="h-12 w-12 text-white" />,
                title: "Third-Party Integrations",
                description: "Direct integration with Notion, Dropbox, GDrive, and other enterprise platforms.",
                gradient: "from-red-500 to-red-600",
              },
              {
                icon: <Lock className="h-12 w-12 text-white" />,
                title: "Automated Permission Control",
                description:
                  "AI-powered classification model that evaluates user requests based on roles and sensitivity.",
                gradient: "from-blue-600 to-blue-700",
              },
              {
                icon: <Brain className="h-12 w-12 text-white" />,
                title: "Advanced RAG Pipeline",
                description:
                  "Robust retrieval system that finds the most relevant data chunks for context-rich answers.",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: <MessageSquare className="h-12 w-12 text-white" />,
                title: "Enhanced Chatbot LLM",
                description: "Dynamic, interactive interface that goes beyond plain text with visual elements.",
                gradient: "from-red-500 to-red-600",
              },
              {
                icon: <BarChart3 className="h-12 w-12 text-white" />,
                title: "Admin Dashboard",
                description: "Comprehensive control panel for managing the knowledge base and monitoring usage.",
                gradient: "from-blue-600 to-blue-700",
              },
            ].map((feature, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-300 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-3xl p-8 h-full border border-gray-200 shadow-md">
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section with fixed vertical line */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our RAG pipeline transforms your enterprise data into actionable insights
            </p>
          </div>

          {/* Main content area with the fixed process cards */}
          <div className="max-w-5xl mx-auto relative">
            {/* Steps */}
            <div className="space-y-16">
              {/* Fixed workflow section - the cards now have proper spacing and the line doesn't intersect them */}
              <div className="mx-auto max-w-4xl relative">
                {/* Steps line - now properly positioned behind the cards */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
                
                {/* Process steps */}
                {howItWorksSteps.map((step, idx) => (
                  <FeatureStep 
                    key={idx}
                    number={step.number}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main feature highlight section with fixed card positions */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our RAG Pipeline</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive retrieval-augmented generation system
            </p>
          </div>

          {/* Fixed card display section - now properly positioned with icons not overlapping numbers */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Card 1 - Data Ingestion */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0 mr-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Data Ingestion & Integration</h3>
                  <p className="text-gray-600">
                    Our system connects to your existing data sources and platforms, ingesting multimodal content including text
                    documents, images, PDFs, and more. Integration with Notion, Dropbox, and GDrive ensures all your enterprise
                    knowledge is accessible.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Intelligent Processing */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0 mr-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligent Processing & Permission Control</h3>
                  <p className="text-gray-600">
                    Advanced AI models process and classify your data, while our permission control system ensures that users only
                    access information they're authorized to see. The classification model evaluates each request based on user role and
                    resource sensitivity.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 - Context-Rich Retrieval */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0 mr-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Context-Rich Retrieval</h3>
                  <p className="text-gray-600">
                    When a query is received, our RAG pipeline retrieves the most relevant data chunks from your knowledge base,
                    ensuring that responses are accurate, domain-specific, and contextually appropriate.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 - Interactive Response Generation */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0 mr-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                    <Layers className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Response Generation</h3>
                  <p className="text-gray-600">
                    The retrieved information is processed by our enhanced LLM to generate comprehensive answers that go beyond plain
                    text, incorporating visual elements and interactive controls for an engaging user experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Connect with your favorite platforms and tools</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: "Notion", icon: <FileText className="h-12 w-12" /> },
              { name: "Dropbox", icon: <Dropbox className="h-12 w-12" /> },
              { name: "Google Drive", icon: <FileImage className="h-12 w-12" /> },
              { name: "Slack", icon: <MessageSquare className="h-12 w-12" /> },
              { name: "Microsoft Teams", icon: <Users className="h-12 w-12" /> },
              { name: "Jira", icon: <Settings className="h-12 w-12" /> },
            ].map((integration, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-blue-600 mb-4">{integration.icon}</div>
                <div className="text-gray-900 font-medium">{integration.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="relative bg-gradient-to-br from-blue-50 to-red-50 rounded-3xl border border-gray-200 shadow-xl p-12">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Ready to Transform Your Enterprise Knowledge?
                </h2>
                <p className="text-xl text-gray-700">
                  Join EnterpriseRAG today and experience the future of intelligent information retrieval.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white text-lg h-14 px-8"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-gray-800 border-gray-300 hover:bg-gray-100 text-lg h-14 px-8"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Database className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">EnterpriseRAG</span>
              </div>
              <p className="text-gray-600 mb-6">Secure, Scalable Retrieval-Augmented Generation for Enterprises.</p>
            </div>
            <div>
              <h3 className="text-gray-900 font-bold mb-6">Features</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Multimodal Ingestion
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Permission Control
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    RAG Pipeline
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Interactive UI
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-bold mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">contact@enterpriserag.ai</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-bold mb-6">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} EnterpriseRAG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

