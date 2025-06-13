import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

function FeatureCard({ title, description, icon, href, color }: FeatureCardProps) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200 h-full">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
          Get Started 
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  action: string;
  href: string;
  variant: 'primary' | 'secondary';
}

function QuickAction({ title, description, action, href, variant }: QuickActionProps) {
  const baseClasses = "flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md";
  const variantClasses = variant === 'primary' 
    ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
    : "bg-gray-50 border-gray-200 hover:bg-gray-100";

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses}`}>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className={`px-3 py-1 rounded-md text-sm font-medium ${
        variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
      }`}>
        {action}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const features = [
    {
      title: "Missionary Search",
      description: "Search and view detailed missionary information with comprehensive data including assignments, languages, and contact details.",
      icon: "👤",
      href: "/missionary",
      color: "bg-blue-100"
    },
    {
      title: "API Testing",
      description: "Test GraphQL and REST APIs with authentication support, environment switching, and detailed response analysis.",
      icon: "🔧",
      href: "/api-testing",
      color: "bg-green-100"
    },
    {
      title: "Load Testing",
      description: "Simulate concurrent requests to test API performance and identify bottlenecks under various load conditions.",
      icon: "⚡",
      href: "/load-testing",
      color: "bg-yellow-100"
    },
    {
      title: "Environment Settings",
      description: "Configure production and non-production environments, manage Okta authentication, and set up API endpoints.",
      icon: "⚙️",
      href: "/settings",
      color: "bg-purple-100"
    }
  ];

  const quickActions = [
    {
      title: "Search Missionary by ID",
      description: "Quickly lookup a missionary using their missionary number",
      action: "Search",
      href: "/missionary?id=916793",
      variant: "primary" as const
    },
    {
      title: "Test Sample Query",
      description: "Run a predefined GraphQL query to test the system",
      action: "Test",
      href: "/api-testing?query=sample",
      variant: "secondary" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to <span className="text-blue-600">TAP</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Your comprehensive Testing & API Platform for GraphQL and REST API testing with advanced authentication and load testing capabilities.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                href="/missionary"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Start Testing
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Configure Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            </div>
            <p className="text-gray-600 mt-2">All systems operational</p>
            <p className="text-sm text-gray-500 mt-1">Last checked: Just now</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">API Version</h3>
            </div>
            <p className="text-gray-600 mt-2">GraphQL v2.0</p>
            <p className="text-sm text-gray-500 mt-1">Production ready</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">Environment</h3>
            </div>
            <p className="text-gray-600 mt-2">MIS GraphQL Staging</p>
            <p className="text-sm text-gray-500 mt-1">mis-gql-stage.aws.churchofjesuschrist.org</p>
          </div>
        </div>
      </div>
    </div>
  );
}