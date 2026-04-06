import type { Component } from 'vue'
import type { UserRole } from '~~/shared/utils/constants'
import {
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Bell,
  FileBox,
  AlertCircle
} from 'lucide-vue-next'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface NavLink {
  label: string
  icon: Component
  to: string
  badge?: string
  exact?: boolean
}

export interface NavLinkWithChildren extends NavLink {
  children?: NavLink[]
  isOpen?: boolean
}

export interface NavGroup {
  category: string
  links: NavLinkWithChildren[]
}

// ──────────────────────────────────────────────
// Full Menu Definition
// ──────────────────────────────────────────────
// Setiap item punya `roles`: array role yang boleh melihat item tersebut.
// Jika tidak didefinisikan, berarti semua role bisa akses.

interface NavItemDef {
  label: string
  icon: Component
  to: string
  badge?: string
  exact?: boolean
  roles?: UserRole[]
  children?: NavItemDef[]
}

interface NavGroupDef {
  category: string
  items: NavItemDef[]
}

const FULL_MENU: NavGroupDef[] = [
  {
    category: 'Core',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: '/dashboard',
        exact: true
        // Semua role bisa akses
      },
      {
        label: 'Reports',
        icon: FileText,
        to: '/dashboard/reports'
        // Semua role bisa akses
      }
    ]
  },
  {
    category: 'Operations',
    items: [
      {
        label: 'Claims',
        icon: ClipboardList,
        to: '/dashboard/claims',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Vendor Claims',
        icon: Package,
        to: '/dashboard/vendor-claims',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Master Data',
        icon: Database,
        to: '/dashboard/master',
        roles: ['QRCC', 'ADMIN'],
        children: [
          { label: 'Vendor', icon: Users, to: '/dashboard/master/vendor', roles: ['QRCC', 'ADMIN'] },
          { label: 'Product Model', icon: FileBox, to: '/dashboard/master/product-model', roles: ['QRCC', 'ADMIN'] },
          { label: 'Notification', icon: Bell, to: '/dashboard/master/notification', roles: ['QRCC', 'ADMIN'] },
          { label: 'Defect', icon: AlertCircle, to: '/dashboard/master/defect', roles: ['QRCC', 'ADMIN'] }
        ]
      }
    ]
  },
  {
    category: 'Administration',
    items: [
      {
        label: 'Users',
        icon: Users,
        to: '/dashboard/users',
        roles: ['ADMIN']
      },
      {
        label: 'Audit Trail',
        icon: History,
        to: '/dashboard/audit-trail',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Settings',
        icon: Settings,
        to: '/dashboard/settings'
        // Semua role bisa akses
      }
    ]
  }
]

// ──────────────────────────────────────────────
// Builder Function
// ──────────────────────────────────────────────

/**
 * Bangun navigasi sidebar berdasarkan role aktif.
 * Hasilnya adalah array NavGroup yang sudah difilter.
 */
export function buildNavigationForRole(role: UserRole): NavGroup[] {
  const result: NavGroup[] = []

  for (const groupDef of FULL_MENU) {
    const filteredLinks: NavLinkWithChildren[] = []

    for (const item of groupDef.items) {
      // Cek akses role untuk item utama
      if (item.roles && !item.roles.includes(role)) continue

      const navItem: NavLinkWithChildren = {
        label: item.label,
        icon: item.icon,
        to: item.to,
        badge: item.badge,
        exact: item.exact
      }

      // Filter children jika ada
      if (item.children) {
        const filteredChildren = item.children.filter(
          child => !child.roles || child.roles.includes(role)
        )
        if (filteredChildren.length === 0) continue

        navItem.children = filteredChildren.map(child => ({
          label: child.label,
          icon: child.icon,
          to: child.to
        }))
        navItem.isOpen = false
      }

      filteredLinks.push(navItem)
    }

    // Hanya tambahkan group jika ada item visible
    if (filteredLinks.length > 0) {
      result.push({
        category: groupDef.category,
        links: filteredLinks
      })
    }
  }

  return result
}

// ──────────────────────────────────────────────
// Role Display Config
// ──────────────────────────────────────────────

export interface RoleDisplayConfig {
  label: string
  badgeClass: string
  landingPage: string
  dashboardTitle: string
  dashboardSubtitle: string
}

export const ROLE_DISPLAY: Record<UserRole, RoleDisplayConfig> = {
  ADMIN: {
    label: 'System Administrator',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Admin Console',
    dashboardSubtitle: 'Full system access. Manage users, review claims, and monitor operations.'
  },
  QRCC: {
    label: 'QRCC Reviewer',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Review Dashboard',
    dashboardSubtitle: 'Review pending claims, verify evidence, and manage vendor batches.'
  },
  MANAGEMENT: {
    label: 'Management',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Analytics Overview',
    dashboardSubtitle: 'Monitor performance trends, reports, and operational metrics.'
  },
  CS: {
    label: 'CS Agent',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    landingPage: '/cs',
    dashboardTitle: 'CS Dashboard',
    dashboardSubtitle: ''
  }
}
