import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-background-light">
            <Music size={48} className="text-primary-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
        <p className="text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="btn-primary inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;