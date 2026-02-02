"use client";

/**
 * Footer Component
 *
 * Application footer with links, version, and audit badge.
 */

import React from "react";
import Link from "next/link";
import { Shield, Github, Twitter, ExternalLink, CheckCircle } from "lucide-react";

// ============================================
// Types
// ============================================

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  /** Application version */
  version?: string;
  /** Show audit badge */
  showAuditBadge?: boolean;
  /** Audit provider name */
  auditProvider?: string;
  /** Link groups */
  linkGroups?: FooterLinkGroup[];
  /** Additional className */
  className?: string;
}

// ============================================
// Default Links
// ============================================

const DEFAULT_LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Mixer", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tokens", href: "/tokens" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "https://docs.privacycash.io", external: true },
      { label: "GitHub", href: "https://github.com/Privacy-Cash", external: true },
      { label: "SDK", href: "https://github.com/Privacy-Cash/prvcsh-sdk", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

// ============================================
// Social Links
// ============================================

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/Privacy-Cash",
    icon: Github,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/privacycash",
    icon: Twitter,
  },
];

// ============================================
// Audit Badge Component
// ============================================

function AuditBadge({ provider }: { provider: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <CheckCircle size={14} className="text-emerald-400" />
      <span className="text-xs font-medium text-emerald-400">
        Audited by {provider}
      </span>
    </div>
  );
}

// ============================================
// Link Group Component
// ============================================

function LinkGroup({ group }: { group: FooterLinkGroup }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">{group.title}</h3>
      <ul className="space-y-2">
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="
                text-sm text-neutral-400 hover:text-white
                transition-colors duration-150
                inline-flex items-center gap-1
              "
            >
              {link.label}
              {link.external && (
                <ExternalLink size={10} className="text-neutral-500" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// Main Footer Component
// ============================================

export function Footer({
  version = "1.0.0",
  showAuditBadge = true,
  auditProvider = "Zigtur",
  linkGroups = DEFAULT_LINK_GROUPS,
  className = "",
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`
        w-full bg-neutral-950 border-t border-white/5
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <Shield
                size={28}
                className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
              />
              <span className="text-lg font-bold text-white">
                Privacy<span className="text-emerald-400">Cash</span>
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-sm text-neutral-400 mb-4 max-w-xs">
              Private transactions on Solana. Zero-knowledge proofs for complete financial privacy.
            </p>

            {/* Audit Badge */}
            {showAuditBadge && <AuditBadge provider={auditProvider} />}

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    p-2 rounded-lg
                    text-neutral-400 hover:text-white
                    hover:bg-white/5
                    transition-colors duration-150
                  "
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {linkGroups.map((group) => (
            <LinkGroup key={group.title} group={group} />
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs text-neutral-500">
            © {currentYear} PRVCSH. All rights reserved.
          </p>

          {/* Version & Network */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500">
              v{version}
            </span>
            <span className="text-xs text-neutral-600">•</span>
            <span className="text-xs text-neutral-500">
              Built on Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
