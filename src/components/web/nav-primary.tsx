"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"
import { NavPrimaryProps } from "@/lib/types"

// interface NavPrimaryProps {
//   items: {
//     title: string
//     to: string
//     icon: LucideIcon
//   }[]
// }

export function NavPrimary({ items }: NavPrimaryProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => {
            return (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton size="sm" asChild>
                  <Link activeProps={{
                    'data-active': true,
                  }}
                    to={item.to} activeOptions={item.activeOptions}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

