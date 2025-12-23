/**
 * Unit Tests - TopicConfirmModal
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TopicConfirmModal } from '../TopicConfirmModal';

describe('TopicConfirmModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    topicName: 'Mechanics',
    completedCount: 5,
    totalCount: 5,
    defaultRemindDays: 3,
    onMarkDone: vi.fn(),
    onRemindLater: vi.fn(),
    onReviewTopic: vi.fn(),
  };

  it('renders all three choice options', () => {
    const { getByText } = render(<TopicConfirmModal {...defaultProps} />);

    expect(getByText('Mark main topic done')).toBeInTheDocument();
    expect(getByText('Keep as incomplete (remind me later)')).toBeInTheDocument();
    expect(getByText('Review main topic now')).toBeInTheDocument();
  });

  it('displays the topic name', () => {
    const { getByText } = render(<TopicConfirmModal {...defaultProps} />);

    expect(getByText('Mechanics')).toBeInTheDocument();
  });

  it('displays completion count', () => {
    const { getByText } = render(<TopicConfirmModal {...defaultProps} />);

    expect(getByText('5 of 5 items completed')).toBeInTheDocument();
  });

  it('calls onMarkDone when "Mark main topic done" is clicked', () => {
    const onMarkDone = vi.fn();
    const { getByText } = render(<TopicConfirmModal {...defaultProps} onMarkDone={onMarkDone} />);

    getByText('Mark main topic done').click();
    expect(onMarkDone).toHaveBeenCalledTimes(1);
  });

  it('calls onRemindLater with days when "Set Reminder" is clicked', () => {
    const onRemindLater = vi.fn();
    const { getByText } = render(<TopicConfirmModal {...defaultProps} onRemindLater={onRemindLater} />);

    getByText('Set Reminder').click();
    expect(onRemindLater).toHaveBeenCalledWith(3); // default 3 days
  });

  it('calls onReviewTopic when "Review main topic now" is clicked', () => {
    const onReviewTopic = vi.fn();
    const { getByText } = render(<TopicConfirmModal {...defaultProps} onReviewTopic={onReviewTopic} />);

    getByText('Review main topic now').click();
    expect(onReviewTopic).toHaveBeenCalledTimes(1);
  });

  it('shows the strict 100% rule explanation', () => {
    const { getByText } = render(<TopicConfirmModal {...defaultProps} />);

    expect(getByText(/Strict 100% Rule:/)).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    const { queryByText } = render(<TopicConfirmModal {...defaultProps} open={false} />);

    expect(queryByText('Mark main topic done')).not.toBeInTheDocument();
  });

  it('shows "Decide Later" button', () => {
    const { getByText } = render(<TopicConfirmModal {...defaultProps} />);

    expect(getByText('Decide Later')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when "Decide Later" is clicked', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(<TopicConfirmModal {...defaultProps} onOpenChange={onOpenChange} />);

    getByText('Decide Later').click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
