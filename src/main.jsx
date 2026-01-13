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
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import './styles.css'
import reportWebVitals from './reportWebVitals.js'

import { HomePage } from './routes/index.jsx'
import { ExpensesPage } from './routes/expenses.jsx'

// Root layout with navigation
function RootLayout() {
  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="app-title">
          xpenseshots
        </Link>
        <nav className="app-nav">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
            Home
          </Link>
          <Link to="/expenses" className="nav-link" activeProps={{ className: 'nav-link active' }}>
            Expenses
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="privacy-badge">
          🔒 All data stays on your device
        </div>
      </footer>
      <TanStackRouterDevtools position="bottom-right" />
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

const routeTree = rootRoute.addChildren([indexRoute, expensesRoute])

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
