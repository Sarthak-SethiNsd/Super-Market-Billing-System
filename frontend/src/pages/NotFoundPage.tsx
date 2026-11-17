import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileQuestion, Store, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found (404)"
        description="The requested page route does not exist or has been moved."
      />
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" className="gap-2">
            <Store className="w-4 h-4" />
            <span>ApexMart Storefront</span>
          </Button>
        </Link>
        <Link to="/staff">
          <Button variant="outline" size="md" className="gap-2">
            <Lock className="w-4 h-4" />
            <span>Staff Portal</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
