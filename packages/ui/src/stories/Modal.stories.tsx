import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../components/Modal';
import { ShieldButton } from '../components/ShieldButton';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'PRVCSH/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Modal dialog component with backdrop blur and animation.

## Features
- Accessible dialog with focus trap
- Backdrop click to close
- Escape key to close
- Smooth animations
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive Modal
const ModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ShieldButton onClick={() => setIsOpen(true)}>
        Open Modal
      </ShieldButton>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Transaction">
        <div style={{ padding: '16px', color: '#a0a0a0' }}>
          <p>You are about to shield 5 SOL.</p>
          <p style={{ marginTop: '8px' }}>This action cannot be undone without the deposit note.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '16px', justifyContent: 'flex-end' }}>
          <ShieldButton variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </ShieldButton>
          <ShieldButton variant="primary" onClick={() => setIsOpen(false)}>
            Confirm
          </ShieldButton>
        </div>
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => <ModalDemo />,
};

// Danger Modal
const DangerModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ShieldButton variant="danger" onClick={() => setIsOpen(true)}>
        Delete Note
      </ShieldButton>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="⚠️ Delete Deposit Note">
        <div style={{ padding: '16px', color: '#a0a0a0' }}>
          <p style={{ color: '#EF4444' }}>
            Warning: Deleting this note will permanently remove access to 5 SOL.
          </p>
          <p style={{ marginTop: '8px' }}>
            Make sure you have withdrawn your funds before deleting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '16px', justifyContent: 'flex-end' }}>
          <ShieldButton variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </ShieldButton>
          <ShieldButton variant="danger" onClick={() => setIsOpen(false)}>
            Delete Permanently
          </ShieldButton>
        </div>
      </Modal>
    </>
  );
};

export const DangerConfirmation: Story = {
  render: () => <DangerModalDemo />,
};

// Large Content Modal
const LargeModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ShieldButton onClick={() => setIsOpen(true)}>
        View Terms
      </ShieldButton>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Terms of Service">
        <div style={{ padding: '16px', color: '#a0a0a0', maxHeight: '300px', overflow: 'auto' }}>
          <h4 style={{ color: '#fff' }}>1. Introduction</h4>
          <p>Welcome to PRVCSH. By using our services, you agree to these terms...</p>
          
          <h4 style={{ color: '#fff', marginTop: '16px' }}>2. Privacy</h4>
          <p>We are committed to protecting your privacy. Our zero-knowledge proof system ensures...</p>
          
          <h4 style={{ color: '#fff', marginTop: '16px' }}>3. Security</h4>
          <p>You are responsible for keeping your deposit notes secure. We cannot recover lost notes...</p>
          
          <h4 style={{ color: '#fff', marginTop: '16px' }}>4. Fees</h4>
          <p>A small fee is charged for each transaction to cover relayer costs...</p>
          
          <h4 style={{ color: '#fff', marginTop: '16px' }}>5. Liability</h4>
          <p>PRVCSH is provided as-is. We are not liable for any losses...</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '16px', justifyContent: 'flex-end' }}>
          <ShieldButton variant="ghost" onClick={() => setIsOpen(false)}>
            Decline
          </ShieldButton>
          <ShieldButton variant="primary" onClick={() => setIsOpen(false)}>
            Accept
          </ShieldButton>
        </div>
      </Modal>
    </>
  );
};

export const LargeContent: Story = {
  render: () => <LargeModalDemo />,
};
