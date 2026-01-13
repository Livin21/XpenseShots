import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { Home, Receipt, Shield, Zap, BarChart3 } from 'lucide-react'

import './styles.css'
import reportWebVitals from './reportWebVitals.js'

import { HomePage } from './routes/index.jsx'
import { ExpensesPage } from './routes/expenses.jsx'
import { AnalyticsPage } from './routes/analytics.jsx'

// Root layout with navigation
function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">xpenseshots</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/expenses"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Expenses</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>All data stays on your device</span>
        </div>
      </footer>

    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  component: ExpensesPage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

const routeTree = rootRoute.addChildren([indexRoute, expensesRoute, analyticsRoute])

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
