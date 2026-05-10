<template>
  <div class="commerce-center">
    <!-- Membership Products -->
    <section class="commerce-center__section">
      <div class="commerce-center__head">
        <div>
          <div class="commerce-center__eyebrow">membership</div>
          <h2 class="commerce-center__title">会员商品</h2>
        </div>
        <el-button type="primary" plain @click="openCreateProductDialog">新增商品</el-button>
      </div>

      <el-card shadow="never">
        <el-table :data="products" stripe v-loading="loadingProducts" empty-text="暂无商品">
          <el-table-column prop="code" label="code" min-width="120" />
          <el-table-column prop="title" label="商品名" min-width="160" />
          <el-table-column prop="priceFen" label="价格(分)" min-width="100" />
          <el-table-column prop="durationDays" label="时长(天)" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="240">
            <template #default="{ row }">
              <el-button text type="primary" @click="openEditProductDialog(row)">编辑</el-button>
              <el-button
                text
                :type="row.status === 'published' ? 'warning' : 'success'"
                @click="toggleProductStatus(row)"
              >
                {{ row.status === 'published' ? '下架' : '发布' }}
              </el-button>
              <el-popconfirm title="确定删除此商品？" @confirm="deleteProduct(row.code)">
                <template #reference>
                  <el-button text type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>

    <!-- Product Dialog -->
    <el-dialog
      v-model="productDialogVisible"
      :title="editingProductCode ? '编辑会员商品' : '新增会员商品'"
      width="760px"
      @closed="resetProductForm"
    >
      <el-form label-position="top">
        <div class="commerce-center__grid">
          <el-form-item label="code" required>
            <el-input v-model="productForm.code" placeholder="vip-30d" />
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select v-model="productForm.status">
              <el-option label="published" value="published" />
              <el-option label="draft" value="draft" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题" required>
            <el-input v-model="productForm.title" placeholder="VIP 月卡" />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="productForm.subtitle" placeholder="完整内容解锁的标准方案" />
          </el-form-item>
          <el-form-item label="价格(分)" required>
            <el-input-number v-model="productForm.priceFen" :min="1" :step="100" />
          </el-form-item>
          <el-form-item label="时长(天)" required>
            <el-input-number v-model="productForm.durationDays" :min="1" :step="1" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="productForm.sortOrder" :min="1" :step="10" />
          </el-form-item>
        </div>
        <el-form-item label="描述">
          <el-input v-model="productForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="权益（每行一个）" required>
          <el-input
            v-model="productForm.benefitsText"
            type="textarea"
            :rows="4"
            placeholder="完整版报告&#10;无限海报生成&#10;历史记录完整解锁"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProduct" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- Order Stats -->
    <section class="commerce-center__section">
      <div class="commerce-center__head">
        <div>
          <div class="commerce-center__eyebrow">orders</div>
          <h2 class="commerce-center__title">订单管理</h2>
        </div>
        <el-button :loading="loadingOrderStats" @click="loadOrderStats">刷新</el-button>
      </div>

      <div class="commerce-center__order-stats" v-if="orderStats">
        <div class="stat-card">
          <span class="stat-card__label">总订单</span>
          <span class="stat-card__value">{{ orderStats.totalOrders }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">已支付</span>
          <span class="stat-card__value">{{ orderStats.paidOrders }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">总营收</span>
          <span class="stat-card__value">¥{{ orderStats.totalRevenueYuan }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">本月营收</span>
          <span class="stat-card__value">¥{{ orderStats.thisMonthRevenueYuan }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">转化率</span>
          <span class="stat-card__value">{{ orderStats.conversionRate }}%</span>
        </div>
      </div>

      <el-card shadow="never" style="margin-top: 16px">
        <div class="commerce-center__order-filters">
          <el-select v-model="orderStatusFilter" clearable placeholder="按状态筛选" @change="loadOrders">
            <el-option label="全部" value="" />
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button :loading="loadingOrders" @click="loadOrders">筛选</el-button>
        </div>

        <el-table :data="orders" stripe v-loading="loadingOrders" empty-text="暂无订单">
          <el-table-column prop="orderNo" label="订单号" min-width="220" />
          <el-table-column prop="productTitle" label="商品" min-width="160" />
          <el-table-column prop="amountYuan" label="金额" width="100">
            <template #default="{ row }">¥{{ row.amountYuan }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'paid' ? 'success' : row.status === 'pending' ? 'warning' : 'info'"
                size="small"
              >
                {{ orderStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="paidAt" label="支付时间" min-width="180">
            <template #default="{ row }">{{ row.paidAt || '-' }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>

        <div class="commerce-center__pagination" v-if="orderTotal > orderPageSize">
          <el-pagination
            v-model:current-page="orderPage"
            :page-size="orderPageSize"
            :total="orderTotal"
            layout="prev, pager, next"
            @current-change="loadOrders"
          />
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createMembershipProduct,
  deleteMembershipProduct,
  fetchMembershipProducts,
  fetchOrderStats,
  fetchOrders,
  updateMembershipProduct,
  updateMembershipProductStatus,
  type AdminOrderItem,
  type AdminOrderStats,
  type MembershipProductItem,
} from '../api/commerce';

// --------------- Products ---------------
const products = ref<MembershipProductItem[]>([]);
const loadingProducts = ref(false);
const productDialogVisible = ref(false);
const editingProductCode = ref('');
const savingProduct = ref(false);

const productForm = reactive({
  code: '',
  title: '',
  subtitle: '',
  description: '',
  priceFen: 3900,
  durationDays: 30,
  sortOrder: 10,
  status: 'draft' as string,
  benefitsText: '',
});

function resetProductForm() {
  editingProductCode.value = '';
  productForm.code = '';
  productForm.title = '';
  productForm.subtitle = '';
  productForm.description = '';
  productForm.priceFen = 3900;
  productForm.durationDays = 30;
  productForm.sortOrder = 10;
  productForm.status = 'draft';
  productForm.benefitsText = '';
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const res = await fetchMembershipProducts();
    products.value = res.data.items;
  } catch {
    ElMessage.error('加载商品列表失败');
  } finally {
    loadingProducts.value = false;
  }
}

function openCreateProductDialog() {
  resetProductForm();
  productDialogVisible.value = true;
}

function openEditProductDialog(row: MembershipProductItem) {
  editingProductCode.value = row.code;
  productForm.code = row.code;
  productForm.title = row.title;
  productForm.subtitle = row.subtitle || '';
  productForm.description = row.description || '';
  productForm.priceFen = row.priceFen;
  productForm.durationDays = row.durationDays;
  productForm.sortOrder = row.sortOrder;
  productForm.status = row.status;
  productForm.benefitsText = (row.benefits || []).join('\n');
  productDialogVisible.value = true;
}

async function saveProduct() {
  if (!productForm.code.trim() || !productForm.title.trim()) {
    ElMessage.warning('code 和标题不能为空');
    return;
  }

  savingProduct.value = true;
  try {
    const payload = {
      code: productForm.code.trim(),
      title: productForm.title.trim(),
      subtitle: productForm.subtitle.trim() || undefined,
      description: productForm.description.trim() || undefined,
      priceFen: productForm.priceFen,
      durationDays: productForm.durationDays,
      sortOrder: productForm.sortOrder,
      status: productForm.status as 'draft' | 'published',
      benefits: productForm.benefitsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (editingProductCode.value) {
      await updateMembershipProduct(editingProductCode.value, payload);
      ElMessage.success('商品已更新');
    } else {
      await createMembershipProduct(payload);
      ElMessage.success('商品已创建');
    }
    productDialogVisible.value = false;
    await loadProducts();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    savingProduct.value = false;
  }
}

async function toggleProductStatus(row: MembershipProductItem) {
  const newStatus = row.status === 'published' ? 'draft' : 'published';
  try {
    await updateMembershipProductStatus(row.code, newStatus);
    ElMessage.success(newStatus === 'published' ? '已发布' : '已下架');
    await loadProducts();
  } catch {
    ElMessage.error('状态变更失败');
  }
}

async function deleteProduct(code: string) {
  try {
    await deleteMembershipProduct(code);
    ElMessage.success('已删除');
    await loadProducts();
  } catch {
    ElMessage.error('删除失败');
  }
}

// --------------- Orders ---------------
const orders = ref<AdminOrderItem[]>([]);
const loadingOrders = ref(false);
const orderPage = ref(1);
const orderPageSize = ref(20);
const orderTotal = ref(0);
const orderStatusFilter = ref('');

const orderStats = ref<AdminOrderStats | null>(null);
const loadingOrderStats = ref(false);

async function loadOrders() {
  loadingOrders.value = true;
  try {
    const res = await fetchOrders({
      page: orderPage.value,
      pageSize: orderPageSize.value,
      status: orderStatusFilter.value || undefined,
    });
    orders.value = res.data.items;
    orderTotal.value = res.data.total;
  } catch {
    ElMessage.error('加载订单失败');
  } finally {
    loadingOrders.value = false;
  }
}

async function loadOrderStats() {
  loadingOrderStats.value = true;
  try {
    const res = await fetchOrderStats();
    orderStats.value = res.data;
  } catch {
    ElMessage.error('加载统计数据失败');
  } finally {
    loadingOrderStats.value = false;
  }
}

function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return map[status] || status;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

onMounted(() => {
  loadProducts();
  loadOrders();
  loadOrderStats();
});
</script>

<style scoped lang="scss">
.commerce-center {
  padding: 24px;
  max-width: 1400px;
}

.commerce-center__section {
  margin-bottom: 32px;
}

.commerce-center__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.commerce-center__eyebrow {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.commerce-center__title {
  font-size: 22px;
  font-weight: 700;
  margin: 4px 0;
}

.commerce-center__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}

.commerce-center__order-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.commerce-center__order-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.commerce-center__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.stat-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 16px;
  text-align: center;

  &__label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  &__value {
    font-size: 22px;
    font-weight: 600;
  }
}
</style>
