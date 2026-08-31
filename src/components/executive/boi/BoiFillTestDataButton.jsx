import React from 'react';
import { FlaskConical } from 'lucide-react';
import { Button } from '../../common';

export default function BoiFillTestDataButton({ onFill, label = 'Fill Test Data', className = '' }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onFill}
      className={cn(
        'h-8 gap-1.5 text-xs font-medium border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500',
        className
      )}
    >
      <FlaskConical className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
