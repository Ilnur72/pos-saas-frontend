import axios from 'axios';

// Onlayn do'kon — auth talab qilmaydi, tenant slug URL'da
const shopClient = axios.create({
  baseURL: '/api/v1/public',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export interface ShopTenant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  imageUrls: string[];
  isFeatured: boolean;
  inStock: boolean;
  category: { id: string; name: string; slug: string };
}

export interface ShopProductDetail extends ShopProduct {
  description: string | null;
  stockQty: number;
  variants: {
    id: string;
    name: string;
    sku: string;
    priceModifier: number;
    attributes: Record<string, unknown>;
  }[];
}

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface ShopOrderItem {
  productId: string;
  variantId?: string;
  qty: number;
}

export interface CreateShopOrderDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: Record<string, string>;
  deliveryMethod?: 'PICKUP' | 'DELIVERY';
  paymentMethod?: 'CASH' | 'CARD' | 'PAYME' | 'CLICK' | 'UZUM';
  items: ShopOrderItem[];
  discountAmount?: number;
  shippingFee?: number;
  note?: string;
}

export const shopApi = {
  getTenantInfo: (slug: string) =>
    shopClient.get<ShopTenant>(`/${slug}/info`).then((r) => r.data),

  getCategories: (slug: string) =>
    shopClient.get<ShopCategory[]>(`/${slug}/categories`).then((r) => r.data),

  getProducts: (slug: string, params: { page?: number; limit?: number; search?: string; categoryId?: string; featured?: boolean }) =>
    shopClient
      .get<{ data: ShopProduct[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
        `/${slug}/products`,
        { params },
      )
      .then((r) => r.data),

  getProduct: (slug: string, productSlug: string) =>
    shopClient.get<ShopProductDetail>(`/${slug}/products/${productSlug}`).then((r) => r.data),

  createOrder: (slug: string, dto: CreateShopOrderDto) =>
    shopClient.post(`/${slug}/orders`, dto).then((r) => r.data),

  getOrderStatus: (slug: string, orderNumber: string) =>
    shopClient.get(`/${slug}/orders/${orderNumber}`).then((r) => r.data),
};
