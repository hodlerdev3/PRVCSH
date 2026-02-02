import type { Meta, StoryObj } from '@storybook/react';
import { ShieldButton } from '../components/ShieldButton';
import { Shield, ArrowRight, Lock, Send } from 'lucide-react';

const meta: Meta<typeof ShieldButton> = {
  title: 'PRVCSH/ShieldButton',
  component: ShieldButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The primary button component for the PRVCSH ecosystem. 
Features multiple variants, sizes, loading states, and icon support.

## Features
- **Variants**: primary, secondary, ghost, danger, outline
- **Sizes**: sm, md, lg
- **States**: hover, focus, disabled, loading
- **Icons**: leftIcon, rightIcon support
- **Accessibility**: Full keyboard navigation and ARIA support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    children: 'Shield Funds',
    variant: 'primary',
    size: 'md',
  },
};

// Variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Processing...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

// With Icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Shield',
    leftIcon: <Shield size={18} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <ArrowRight size={18} />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Send Private',
    leftIcon: <Lock size={18} />,
    rightIcon: <Send size={18} />,
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <ShieldButton variant="primary">Primary</ShieldButton>
      <ShieldButton variant="secondary">Secondary</ShieldButton>
      <ShieldButton variant="ghost">Ghost</ShieldButton>
      <ShieldButton variant="danger">Danger</ShieldButton>
      <ShieldButton variant="outline">Outline</ShieldButton>
    </div>
  ),
};

// All Sizes Showcase
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <ShieldButton size="sm">Small</ShieldButton>
      <ShieldButton size="md">Medium</ShieldButton>
      <ShieldButton size="lg">Large</ShieldButton>
    </div>
  ),
};
