import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '../components/Toast';
import { ShieldButton } from '../components/ShieldButton';
import { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'PRVCSH/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Toast notification component for displaying messages.

## Features
- Multiple types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual dismiss option
- Smooth animations
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// All Toast Types
export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '350px' }}>
      <Toast type="success" message="Transaction successful!" onClose={() => {}} />
      <Toast type="error" message="Transaction failed. Please try again." onClose={() => {}} />
      <Toast type="warning" message="Low balance warning." onClose={() => {}} />
      <Toast type="info" message="Your deposit is being processed." onClose={() => {}} />
    </div>
  ),
};

export const Success: Story = {
  args: {
    type: 'success',
    message: 'Funds successfully shielded!',
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    message: 'Failed to connect wallet.',
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    message: 'Network congestion detected.',
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    message: 'Processing your withdrawal...',
    onClose: () => {},
  },
};

// Interactive Demo
const ToastDemo = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string }>>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now();
    setToasts([...toasts, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(toasts.filter(t => t.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <ShieldButton size="sm" variant="primary" onClick={() => addToast('success', 'Success message!')}>
          Success
        </ShieldButton>
        <ShieldButton size="sm" variant="danger" onClick={() => addToast('error', 'Error message!')}>
          Error
        </ShieldButton>
        <ShieldButton size="sm" variant="secondary" onClick={() => addToast('warning', 'Warning message!')}>
          Warning
        </ShieldButton>
        <ShieldButton size="sm" variant="ghost" onClick={() => addToast('info', 'Info message!')}>
          Info
        </ShieldButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '350px' }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <ToastDemo />,
};
