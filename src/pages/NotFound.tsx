import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an encoded URL that should redirect
    const decodedPath = decodeURIComponent(location.pathname);
    if (decodedPath !== location.pathname && decodedPath.includes('?')) {
      // This is an encoded query string - redirect to the correct URL
      const [basePath, queryString] = decodedPath.split('?');
      console.log("[NotFound] Redirecting encoded URL to correct format:", {
        from: location.pathname,
        to: `${basePath}?${queryString}`
      });
      navigate(`${basePath}?${queryString}`, { replace: true });
      return;
    }
    
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
