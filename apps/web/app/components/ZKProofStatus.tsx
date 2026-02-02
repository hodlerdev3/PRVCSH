"use client";

/**
 * ZKProofStatus Component
 *
 * 4-step progress indicator for ZK proof generation.
 */

import React from "react";
import { Check, Loader2, AlertCircle, Shield, Cpu, Send, CheckCircle } from "lucide-react";

// ============================================
// Types
// ============================================

export type ProofStep = "preparing" | "computing" | "signing" | "submitting" | "completed";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface ProofStepInfo {
  id: ProofStep;
  label: string;
  description: string;
  icon: React.ElementType;
}

export interface ZKProofStatusProps {
  /** Current step in the proof process */
  currentStep: ProofStep;
  /** Error message if any step failed */
  error?: string;
  /** Estimated time remaining (seconds) */
  estimatedTime?: number;
  /** Show detailed descriptions */
  showDescriptions?: boolean;
  /** Compact mode (horizontal) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// Step Definitions
// ============================================

const PROOF_STEPS: ProofStepInfo[] = [
  {
    id: "preparing",
    label: "Preparing",
    description: "Loading circuit files and WASM modules",
    icon: Shield,
  },
  {
    id: "computing",
    label: "Computing Proof",
    description: "Generating zero-knowledge proof",
    icon: Cpu,
  },
  {
    id: "signing",
    label: "Signing",
    description: "Signing transaction with wallet",
    icon: Send,
  },
  {
    id: "submitting",
    label: "Submitting",
    description: "Broadcasting to Solana network",
    icon: Send,
  },
  {
    id: "completed",
    label: "Completed",
    description: "Transaction confirmed",
    icon: CheckCircle,
  },
];

// ============================================
// Helper Functions
// ============================================

function getStepStatus(
  stepId: ProofStep,
  currentStep: ProofStep,
  hasError: boolean
): StepStatus {
  const stepOrder: ProofStep[] = ["preparing", "computing", "signing", "submitting", "completed"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(stepId);

  if (hasError && stepIndex === currentIndex) {
    return "error";
  }

  if (stepIndex < currentIndex) {
    return "completed";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `~${minutes}m ${secs}s`;
}

// ============================================
// Step Icon Component
// ============================================

interface StepIconProps {
  step: ProofStepInfo;
  status: StepStatus;
  size?: number;
}

function StepIcon({ step, status, size = 20 }: StepIconProps) {
  const Icon = step.icon;

  const baseClasses = `
    flex items-center justify-center
    rounded-full transition-all duration-300
  `;

  switch (status) {
    case "completed":
      return (
        <div
          className={`${baseClasses} bg-emerald-500 text-white`}
          style={{ width: size + 8, height: size + 8 }}
        >
          <Check size={size - 4} strokeWidth={3} />
        </div>
      );

    case "active":
      return (
        <div
          className={`${baseClasses} bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40`}
          style={{ width: size + 8, height: size + 8 }}
        >
          <Loader2 size={size - 2} className="animate-spin" />
        </div>
      );

    case "error":
      return (
        <div
          className={`${baseClasses} bg-red-500/20 text-red-400 ring-2 ring-red-500/40`}
          style={{ width: size + 8, height: size + 8 }}
        >
          <AlertCircle size={size - 2} />
        </div>
      );

    default: // pending
      return (
        <div
          className={`${baseClasses} bg-neutral-800 text-neutral-500`}
          style={{ width: size + 8, height: size + 8 }}
        >
          <Icon size={size - 4} />
        </div>
      );
  }
}

// ============================================
// Compact Step Component
// ============================================

interface CompactStepProps {
  step: ProofStepInfo;
  status: StepStatus;
  isLast: boolean;
}

function CompactStep({ step, status, isLast }: CompactStepProps) {
  return (
    <div className="flex items-center">
      <StepIcon step={step} status={status} size={16} />

      {/* Connector Line */}
      {!isLast && (
        <div
          className={`
            w-8 h-0.5 mx-1
            ${status === "completed" ? "bg-emerald-500" : "bg-neutral-700"}
            transition-colors duration-300
          `}
        />
      )}
    </div>
  );
}

// ============================================
// Full Step Component
// ============================================

interface FullStepProps {
  step: ProofStepInfo;
  status: StepStatus;
  showDescription: boolean;
  isLast: boolean;
}

function FullStep({ step, status, showDescription, isLast }: FullStepProps) {
  return (
    <div className="flex">
      {/* Icon Column */}
      <div className="flex flex-col items-center">
        <StepIcon step={step} status={status} size={24} />

        {/* Connector Line */}
        {!isLast && (
          <div
            className={`
              w-0.5 flex-1 min-h-[24px] my-2
              ${status === "completed" ? "bg-emerald-500" : "bg-neutral-700"}
              transition-colors duration-300
            `}
          />
        )}
      </div>

      {/* Content Column */}
      <div className="ml-4 pb-6">
        <p
          className={`
            font-medium
            ${
              status === "active"
                ? "text-emerald-400"
                : status === "completed"
                  ? "text-white"
                  : status === "error"
                    ? "text-red-400"
                    : "text-neutral-500"
            }
          `}
        >
          {step.label}
        </p>

        {showDescription && (
          <p className="text-sm text-neutral-500 mt-0.5">{step.description}</p>
        )}

        {/* Active indicator */}
        {status === "active" && (
          <p className="text-xs text-emerald-400/70 mt-1 animate-pulse">
            In progress...
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// ZKProofStatus Component
// ============================================

export function ZKProofStatus({
  currentStep,
  error,
  estimatedTime,
  showDescriptions = true,
  compact = false,
  className = "",
}: ZKProofStatusProps) {
  const hasError = !!error;
  const activeSteps = PROOF_STEPS.filter((s) => s.id !== "completed" || currentStep === "completed");

  if (compact) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {activeSteps.slice(0, -1).map((step, index) => (
          <CompactStep
            key={step.id}
            step={step}
            status={getStepStatus(step.id, currentStep, hasError)}
            isLast={index === activeSteps.length - 2}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Steps */}
      <div className="space-y-0">
        {activeSteps.map((step, index) => (
          <FullStep
            key={step.id}
            step={step}
            status={getStepStatus(step.id, currentStep, hasError)}
            showDescription={showDescriptions}
            isLast={index === activeSteps.length - 1}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Estimated Time */}
      {estimatedTime && currentStep !== "completed" && !hasError && (
        <div className="mt-4 text-center">
          <p className="text-xs text-neutral-500">
            Estimated time: {formatTime(estimatedTime)}
          </p>
        </div>
      )}
    </div>
  );
}

export default ZKProofStatus;
