import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonBlock } from '../Skeleton';

describe('SkeletonBlock', () => {
  it('renders with default classes', () => {
    const { container } = render(<SkeletonBlock />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveClass('rounded-xl');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(<SkeletonBlock className="h-10 w-20 custom-class" />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveClass('rounded-xl');
    expect(skeletonElement).toHaveClass('custom-class');
    expect(skeletonElement).toHaveClass('h-10');
    expect(skeletonElement).toHaveClass('w-20');
  });
});
