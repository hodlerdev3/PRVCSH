import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../components/Tooltip';
import { ShieldButton } from '../components/ShieldButton';
import { Info, HelpCircle, Shield } from 'lucide-react';

const meta: Meta<typeof Tooltip> = {
  title: 'PRVCSH/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tooltip component for displaying additional information on hover.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <ShieldButton>Hover me</ShieldButton>,
  },
};

export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    position: 'top',
    children: <ShieldButton>Top</ShieldButton>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    position: 'bottom',
    children: <ShieldButton>Bottom</ShieldButton>,
  },
};

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    position: 'left',
    children: <ShieldButton>Left</ShieldButton>,
  },
};

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    position: 'right',
    children: <ShieldButton>Right</ShieldButton>,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="More information">
        <Info size={20} style={{ color: '#818CF8', cursor: 'pointer' }} />
      </Tooltip>
      <Tooltip content="Get help">
        <HelpCircle size={20} style={{ color: '#818CF8', cursor: 'pointer' }} />
      </Tooltip>
      <Tooltip content="Your funds are shielded">
        <Shield size={20} style={{ color: '#10B981', cursor: 'pointer' }} />
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip with more detailed information about the feature.',
    children: <ShieldButton>Long tooltip</ShieldButton>,
  },
};

export const AllPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', padding: '60px' }}>
      <Tooltip content="Top tooltip" position="top">
        <ShieldButton size="sm">Top</ShieldButton>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <ShieldButton size="sm">Right</ShieldButton>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <ShieldButton size="sm">Bottom</ShieldButton>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <ShieldButton size="sm">Left</ShieldButton>
      </Tooltip>
    </div>
  ),
};
