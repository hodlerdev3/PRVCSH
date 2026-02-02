import type { Meta, StoryObj } from '@storybook/react';
import { PrivacyCard, PrivacyCardHeader, PrivacyCardFooter, CollapsibleCard } from '../components/PrivacyCard';
import { ShieldButton } from '../components/ShieldButton';
import { Shield, Lock, Eye, Wallet } from 'lucide-react';

const meta: Meta<typeof PrivacyCard> = {
  title: 'PRVCSH/PrivacyCard',
  component: PrivacyCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: `
Glass morphism card component for the PRVCSH UI.

## Features
- **Variants**: default, elevated, outlined, interactive
- **Glass Effect**: Backdrop blur and transparency
- **Slots**: Header, content, and footer areas
- **Collapsible**: Accordion mode for expandable content
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'interactive'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hoverable: {
      control: 'boolean',
    },
    glow: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)', minWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default Card
export const Default: Story = {
  args: {
    children: (
      <p style={{ color: '#a0a0a0' }}>
        This is a default privacy card with glass morphism effect.
      </p>
    ),
    padding: 'md',
  },
};

// With Header
export const WithHeader: Story = {
  render: () => (
    <PrivacyCard>
      <PrivacyCardHeader
        title="Shielded Balance"
        subtitle="Your private funds"
        icon={<Shield size={20} style={{ color: '#818CF8' }} />}
      />
      <div style={{ padding: '16px', color: '#ffffff', fontSize: '32px', fontWeight: 'bold' }}>
        12.5 SOL
      </div>
    </PrivacyCard>
  ),
};

// With Header and Footer
export const WithHeaderAndFooter: Story = {
  render: () => (
    <PrivacyCard>
      <PrivacyCardHeader
        title="Transaction Details"
        subtitle="Private transfer"
        icon={<Lock size={20} style={{ color: '#818CF8' }} />}
        actions={<Eye size={18} style={{ color: '#666' }} />}
      />
      <div style={{ padding: '16px', color: '#a0a0a0' }}>
        <p>Amount: 5.0 SOL</p>
        <p>Pool: SOL-5</p>
        <p>Status: Confirmed</p>
      </div>
      <PrivacyCardFooter divider>
        <ShieldButton size="sm" variant="ghost">View Details</ShieldButton>
      </PrivacyCardFooter>
    </PrivacyCard>
  ),
};

// Variants
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: <p style={{ color: '#a0a0a0' }}>Elevated card with stronger shadow.</p>,
    padding: 'md',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: <p style={{ color: '#a0a0a0' }}>Outlined card with visible border.</p>,
    padding: 'md',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    hoverable: true,
    children: <p style={{ color: '#a0a0a0' }}>Interactive card - hover me!</p>,
    padding: 'md',
  },
};

// With Glow
export const WithGlow: Story = {
  args: {
    glow: true,
    children: <p style={{ color: '#a0a0a0' }}>Card with border glow effect.</p>,
    padding: 'md',
  },
};

// Collapsible Card
export const Collapsible: Story = {
  render: () => (
    <CollapsibleCard
      title="Advanced Options"
      icon={<Wallet size={20} style={{ color: '#818CF8' }} />}
      defaultOpen={false}
    >
      <div style={{ padding: '16px', color: '#a0a0a0' }}>
        <p>These are the advanced options for your transaction.</p>
        <p>• Custom relayer</p>
        <p>• Fee optimization</p>
        <p>• Time delay</p>
      </div>
    </CollapsibleCard>
  ),
};

// Wallet Card Example
export const WalletCard: Story = {
  render: () => (
    <PrivacyCard variant="elevated" glow>
      <PrivacyCardHeader
        title="Privacy Wallet"
        subtitle="Connected"
        icon={<Wallet size={20} style={{ color: '#10B981' }} />}
        actions={
          <span style={{ 
            background: '#10B981', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            Active
          </span>
        }
      />
      <div style={{ padding: '16px' }}>
        <div style={{ color: '#666', fontSize: '14px' }}>Public Balance</div>
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>45.32 SOL</div>
        <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Shielded Balance</div>
        <div style={{ color: '#818CF8', fontSize: '24px', fontWeight: 'bold' }}>12.50 SOL</div>
      </div>
      <PrivacyCardFooter divider>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ShieldButton size="sm" variant="primary">Shield</ShieldButton>
          <ShieldButton size="sm" variant="secondary">Unshield</ShieldButton>
        </div>
      </PrivacyCardFooter>
    </PrivacyCard>
  ),
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PrivacyCard variant="default" padding="md">
        <span style={{ color: '#a0a0a0' }}>Default</span>
      </PrivacyCard>
      <PrivacyCard variant="elevated" padding="md">
        <span style={{ color: '#a0a0a0' }}>Elevated</span>
      </PrivacyCard>
      <PrivacyCard variant="outlined" padding="md">
        <span style={{ color: '#a0a0a0' }}>Outlined</span>
      </PrivacyCard>
      <PrivacyCard variant="interactive" hoverable padding="md">
        <span style={{ color: '#a0a0a0' }}>Interactive (hover me)</span>
      </PrivacyCard>
    </div>
  ),
};
