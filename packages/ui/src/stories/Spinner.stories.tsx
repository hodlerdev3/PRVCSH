import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../components/Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'PRVCSH/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading spinner component with multiple sizes and colors.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="sm" />
        <p style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>Small</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="md" />
        <p style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>Medium</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>Large</p>
      </div>
    </div>
  ),
};
