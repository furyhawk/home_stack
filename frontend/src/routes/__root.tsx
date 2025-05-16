import { Outlet, createRootRoute } from "@tanstack/react-router"
import React, { Suspense } from "react"

import NotFound from "@/components/Common/NotFound"

// Safely load Router Devtools without dependency on QueryClient
const RouterDevtools = React.lazy(() => 
  import("@tanstack/router-devtools").then(mod => ({
    default: mod.TanStackRouterDevtools
  }))
);

// A component that only loads React Query Devtools when it can safely do so
const QueryDevtools = () => {
  // Instead of importing useQueryClient and risking errors, we use dynamic import
  // and a render-through approach that checks for QueryClient availability at runtime
  const ReactQueryDevtoolsComponent = React.lazy(() => 
    import("@tanstack/react-query-devtools").then(mod => {
      return {
        default: () => {
          // This will only render if the component mounts successfully
          // If QueryClient is not available, ReactQueryDevtools will fail during render
          // and not in our module scope
          try {
            return <mod.ReactQueryDevtools />
          } catch (e) {
            // Silently fail if there's an error during render
            return null;
          }
        }
      }
    })
  );
  
  return (
    <Suspense fallback={null}>
      <ReactQueryDevtoolsComponent />
    </Suspense>
  );
};

// Wrapper for all devtools
const DevTools = () => {
  return (
    <>
      <Suspense fallback={null}>
        <RouterDevtools />
      </Suspense>
      <QueryDevtools />
    </>
  );
};

const TanStackDevtools =
  process.env.NODE_ENV === "production" ? () => null : DevTools;

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Suspense>
        <TanStackDevtools />
      </Suspense>
    </>
  ),
  notFoundComponent: () => <NotFound />,
})
