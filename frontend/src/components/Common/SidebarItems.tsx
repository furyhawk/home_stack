import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiBriefcase, FiHome, FiSettings, FiUsers } from "react-icons/fi"
import { WiDaySunny } from "react-icons/wi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
  { icon: WiDaySunny, title: "Weather Hub", path: "/weather-hub" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
  collapsed?: boolean
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose, collapsed = false }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose} title={title}>
      <Flex
        gap={collapsed ? 0 : 4}
        px={collapsed ? 2 : 4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        justifyContent={collapsed ? "center" : "flex-start"}
        fontSize="sm"
        borderRadius="md"
      >
        <Icon as={icon} alignSelf="center" />
        {!collapsed && <Text ml={2}>{title}</Text>}
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      {!collapsed && (
        <Text fontSize="xs" px={4} py={2} fontWeight="bold">
          Menu
        </Text>
      )}
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems
