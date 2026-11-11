import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found (404)"
        description="The requested supermarket management route does not exist or has moved."
      />
      <div className="mt-4">
        <Link to="/">
          <Button variant="primary" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
