import {
  Activity,
  CalendarCheck,
  BadgeIndianRupee,
  ArrowLeftRight,
  Boxes,
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  FileBarChart2,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Truck,
  Users,
  UserRound,
} from "lucide-react";

const ALL_ROLES = [
  "ADMIN",
  "INVENTORY_MANAGER",
  "RECEIVING_STAFF",
  "DISPATCH_STAFF",
  "TRANSPORT_COORDINATOR",
  "HR_MANAGER",
  "FINANCE_VIEWER",
];

const INVENTORY_ROLES = [
  "ADMIN",
  "INVENTORY_MANAGER",
  "RECEIVING_STAFF",
  "DISPATCH_STAFF",
];

const TRANSPORT_ROLES = ["ADMIN", "TRANSPORT_COORDINATOR"];
const HR_ROLES = ["ADMIN", "HR_MANAGER"];

const nav = [
  {
    group: "MY WORK",
    items: [
      {
        id: "worker-attendance",
        label: "My attendance",
        icon: CalendarCheck,
        roles: ["WORKER"],
      },
      {
        id: "worker-tasks",
        label: "My tasks",
        icon: ClipboardList,
        roles: ["WORKER"],
      },
      {
        id: "worker-history",
        label: "My history",
        icon: Clock3,
        roles: ["WORKER"],
      },
      {
        id: "worker-account",
        label: "My account",
        icon: UserRound,
        roles: ["WORKER"],
      },
    ],
  },
  {
    group: "OVERVIEW",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    group: "ADMINISTRATION",
    items: [
      { id: "profile", label: "My account", icon: UserRound, roles: ALL_ROLES },
      {
        id: "users",
        label: "Users & access",
        icon: ShieldCheck,
        roles: ["ADMIN"],
      },
      {
        id: "audit-logs",
        label: "Audit history",
        icon: Activity,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    group: "WAREHOUSE",
    items: [
      {
        id: "products",
        label: "Products",
        icon: Package,
        roles: INVENTORY_ROLES,
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: Boxes,
        roles: INVENTORY_ROLES,
      },
      {
        id: "movements",
        label: "Stock movements",
        icon: ArrowLeftRight,
        roles: INVENTORY_ROLES,
      },
    ],
  },
  {
    group: "LOGISTICS",
    items: [
      {
        id: "shipments",
        label: "Shipments",
        icon: Truck,
        roles: ["ADMIN", "DISPATCH_STAFF", "TRANSPORT_COORDINATOR"],
      },
      {
        id: "transport-providers",
        label: "Transport partners",
        icon: BriefcaseBusiness,
        roles: TRANSPORT_ROLES,
      },
      {
        id: "vehicles",
        label: "Vehicles",
        icon: Truck,
        roles: TRANSPORT_ROLES,
      },
      {
        id: "drivers",
        label: "Drivers",
        icon: Users,
        roles: TRANSPORT_ROLES,
      },
      {
        id: "suppliers",
        label: "Suppliers",
        icon: BriefcaseBusiness,
        roles: ["ADMIN", "INVENTORY_MANAGER", "RECEIVING_STAFF"],
      },
    ],
  },
  {
    group: "PEOPLE & WORK",
    items: [
      { id: "workers", label: "Workforce", icon: Users, roles: HR_ROLES },
      {
        id: "staffing-agencies",
        label: "Staffing agencies",
        icon: BriefcaseBusiness,
        roles: HR_ROLES,
      },
      {
        id: "attendance",
        label: "Attendance register",
        icon: Clock3,
        roles: HR_ROLES,
      },
      {
        id: "tasks",
        label: "Task assignments",
        icon: ClipboardList,
        roles: HR_ROLES,
      },
      {
        id: "bonus-records",
        label: "Bonus records",
        icon: BadgeIndianRupee,
        roles: HR_ROLES,
      },
    ],
  },
  {
    group: "INSIGHTS",
    items: [
      {
        id: "expenses",
        label: "Operational expenses",
        icon: BadgeIndianRupee,
        roles: ["ADMIN", "FINANCE_VIEWER"],
      },
      {
        id: "reports",
        label: "Reports & analytics",
        icon: FileBarChart2,
        roles: ["ADMIN", "INVENTORY_MANAGER", "FINANCE_VIEWER"],
      },
    ],
  },
];

const titles = {
  dashboard: "Operations dashboard",
  products: "Product catalogue",
  inventory: "Inventory overview",
  movements: "Stock movement ledger",
  shipments: "Shipments & dispatch",
  "transport-providers": "Transport partners",
  vehicles: "Fleet management",
  drivers: "Driver directory",
  suppliers: "Supplier directory",
  workers: "Workforce directory",
  "staffing-agencies": "Staffing agencies",
  attendance: "Attendance register",
  tasks: "Task assignments",
  "bonus-records": "Bonus & incentives",
  expenses: "Operational expenses",
  "audit-logs": "Audit history",
  reports: "Reports & analytics",
  users: "Users & access",
  profile: "My account",
  "worker-attendance": "My attendance",
  "worker-tasks": "My tasks",
  "worker-history": "My history",
  
};

export const navigation = nav;
export const pageTitles = titles;
