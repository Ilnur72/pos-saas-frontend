import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';

// Pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import CrmLayout from '@/features/dashboard/CrmLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import BillingPage from '@/features/billing/BillingPage';
import SettingsPage from '@/features/settings/SettingsPage';
import SuperAdminLayout from '@/features/superadmin/SuperAdminLayout';
import SuperAdminLoginPage from '@/features/superadmin/SuperAdminLoginPage';
import SuperAdminDashboard from '@/features/superadmin/SuperAdminDashboard';
import SuperAdminTenantsPage from '@/features/superadmin/SuperAdminTenantsPage';
import SuperAdminTenantDetailPage from '@/features/superadmin/SuperAdminTenantDetailPage';
import SuperAdminSystemPage from '@/features/superadmin/SuperAdminSystemPage';
import ProductsPage from '@/features/products/ProductsPage';
import CategoriesPage from '@/features/categories/CategoriesPage';
import WarehousePage from '@/features/warehouse/WarehousePage';
import OrdersPage from '@/features/orders/OrdersPage';
import CustomersPage from '@/features/customers/CustomersPage';
import SuppliersPage from '@/features/suppliers/SuppliersPage';
import PurchaseOrdersPage from '@/features/purchase-orders/PurchaseOrdersPage';
import ABCReportPage from '@/features/reports/ABCReportPage';
import ProfitReportPage from '@/features/reports/ProfitReportPage';
import CashierPerformancePage from '@/features/reports/CashierPerformancePage';
import InventoryValuePage from '@/features/warehouse/InventoryValuePage';
import PriceRulesPage from '@/features/price-rules/PriceRulesPage';
import KassaPage from '@/features/kassa/KassaPage';
import ExpensesPage from '@/features/expenses/ExpensesPage';
import ShopLayout from '@/features/shop/ShopLayout';
import ShopHomePage from '@/features/shop/ShopHomePage';
import ShopProductPage from '@/features/shop/ShopProductPage';
import ShopCartPage from '@/features/shop/ShopCartPage';
import ShopCheckoutPage from '@/features/shop/ShopCheckoutPage';
import ShopOrderStatusPage from '@/features/shop/ShopOrderStatusPage';
import ShopWishlistPage from '@/features/shop/ShopWishlistPage';

// ─── Root ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: Outlet });

// ─── Public ────────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

// ─── Super Admin ────────────────────────────────────────────────────────────

const superAdminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/superadmin/login',
  component: SuperAdminLoginPage,
});

const superAdminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/superadmin',
  component: SuperAdminLayout,
  beforeLoad: () => {
    if (!localStorage.getItem('saas_superadmin_token')) {
      throw redirect({ to: '/superadmin/login' });
    }
  },
});

const superAdminIndexRoute = createRoute({
  getParentRoute: () => superAdminLayoutRoute,
  path: '/',
  component: SuperAdminDashboard,
});

const superAdminTenantsRoute = createRoute({
  getParentRoute: () => superAdminLayoutRoute,
  path: 'tenants',
  component: SuperAdminTenantsPage,
});

const superAdminTenantDetailRoute = createRoute({
  getParentRoute: () => superAdminLayoutRoute,
  path: 'tenants/$id',
  component: function TenantDetail() {
    const { id } = superAdminTenantDetailRoute.useParams();
    return <SuperAdminTenantDetailPage id={id} />;
  },
});

const superAdminSystemRoute = createRoute({
  getParentRoute: () => superAdminLayoutRoute,
  path: 'system',
  component: SuperAdminSystemPage,
});

// ─── Tenant CRM ─────────────────────────────────────────────────────────────

// Pathless layout — v1.170.x da path:'' __root__ id beradi, shuning uchun id ishlatamiz
const crmLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_crm',
  component: CrmLayout,
  beforeLoad: () => {
    if (!localStorage.getItem('saas_access_token')) {
      throw redirect({ to: '/login' });
    }
  },
});

const crmIndexRoute = createRoute({
  getParentRoute: () => crmLayoutRoute,
  path: '/',
  component: DashboardPage,
});

const billingRoute = createRoute({
  getParentRoute: () => crmLayoutRoute,
  path: 'billing',
  component: BillingPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => crmLayoutRoute,
  path: 'settings',
  component: SettingsPage,
});

const productsRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'products', component: ProductsPage });
const purchaseOrdersRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'purchase-orders', component: PurchaseOrdersPage });
const abcReportRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'reports/abc', component: ABCReportPage });
const profitReportRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'reports/profit', component: ProfitReportPage });
const cashierPerformanceRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'reports/cashiers', component: CashierPerformancePage });
const inventoryValueRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'warehouse/value', component: InventoryValuePage });
const categoriesRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'categories', component: CategoriesPage });
const warehouseRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'warehouse', component: WarehousePage });
const ordersRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'orders', component: OrdersPage });
const customersRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'customers', component: CustomersPage });
const suppliersRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'suppliers', component: SuppliersPage });
const priceRulesRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'price-rules', component: PriceRulesPage });
const kassaRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'kassa', component: KassaPage });
const expensesRoute = createRoute({ getParentRoute: () => crmLayoutRoute, path: 'expenses', component: ExpensesPage });

// ─── Shop (Public, no auth) ─────────────────────────────────────────────────

const shopLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'shop/$tenantSlug',
  component: ShopLayout,
});

const shopHomeRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: '/', component: ShopHomePage });
const shopCartRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: 'cart', component: ShopCartPage });
const shopCheckoutRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: 'checkout', component: ShopCheckoutPage });
const shopWishlistRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: 'wishlist', component: ShopWishlistPage });
const shopOrderStatusRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: 'order/$orderNumber', component: ShopOrderStatusPage });
const shopProductRoute = createRoute({ getParentRoute: () => shopLayoutRoute, path: '$slug', component: ShopProductPage });

// ─── Router ─────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  superAdminLoginRoute,
  superAdminLayoutRoute.addChildren([
    superAdminIndexRoute,
    superAdminTenantsRoute,
    superAdminTenantDetailRoute,
    superAdminSystemRoute,
  ]),
  crmLayoutRoute.addChildren([
    crmIndexRoute,
    billingRoute,
    settingsRoute,
    productsRoute,
    purchaseOrdersRoute,
    abcReportRoute,
    categoriesRoute,
    warehouseRoute,
    ordersRoute,
    customersRoute,
    suppliersRoute,
    priceRulesRoute,
    kassaRoute,
    expensesRoute,
    profitReportRoute,
    cashierPerformanceRoute,
    inventoryValueRoute,
  ]),
  shopLayoutRoute.addChildren([
    shopHomeRoute,
    shopCartRoute,
    shopCheckoutRoute,
    shopWishlistRoute,
    shopOrderStatusRoute,
    shopProductRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
