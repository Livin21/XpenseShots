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
import { Home, Receipt, Shield, Zap, BarChart3, Settings } from 'lucide-react'

import './styles.css'
import reportWebVitals from './reportWebVitals.js'

import { HomePage } from './routes/index.jsx'
import { ExpensesPage } from './routes/expenses.jsx'
import { AnalyticsPage } from './routes/analytics.jsx'
import { SettingsPage } from './routes/settings.jsx'

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
            {/* Desktop nav - hidden on mobile */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/expenses"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <Receipt className="w-4 h-4" />
              <span>Expenses</span>
            </Link>
            <Link
              to="/analytics"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
            {/* Settings - always visible */}
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              activeProps={{ className: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary' }}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content - add bottom padding on mobile for bottom nav */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Footer - hidden on mobile */}
      <footer className="hidden sm:block border-t border-border py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>All data stays on your device</span>
        </div>
      </footer>

      {/* Bottom Navigation - mobile only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 min-w-[72px]"
            activeProps={{ className: 'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-primary transition-all duration-200 min-w-[72px]' }}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            to="/expenses"
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 min-w-[72px]"
            activeProps={{ className: 'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-primary transition-all duration-200 min-w-[72px]' }}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-xs font-medium">Expenses</span>
          </Link>
          <Link
            to="/analytics"
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 min-w-[72px]"
            activeProps={{ className: 'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-primary transition-all duration-200 min-w-[72px]' }}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </div>
      </nav>

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

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([indexRoute, expensesRoute, analyticsRoute, settingsRoute])

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
