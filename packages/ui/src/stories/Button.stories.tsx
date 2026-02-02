import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';

const meta: Meta<typeof Button> = {
  title: 'Core/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A basic button component used throughout the PRVCSH ecosystem.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Button content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    appName: {
      control: 'text',
      description: 'App name for demo alert',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
    appName: 'PRVCSH',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    appName: 'PRVCSH',
    className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    appName: 'PRVCSH',
    className: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    appName: 'PRVCSH',
    className: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    appName: 'PRVCSH',
    className: 'bg-gray-400 text-gray-200 px-4 py-2 rounded-lg cursor-not-allowed',
  },
};
