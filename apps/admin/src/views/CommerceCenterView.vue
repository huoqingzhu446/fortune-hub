<template>
  <div class="commerce-center">
    <section class="commerce-center__section">
      <div class="commerce-center__head">
        <div>
          <div class="commerce-center__eyebrow">membership</div>
          <h2 class="commerce-center__title">会员商品</h2>
        </div>
        <el-button type="primary" plain @click="openCreateProductDialog">新增商品</el-button>
      </div>

      <el-card shadow="never">
        <el-table :data="products" stripe v-loading="loadingProducts">
          <el-table-column prop="code" label="code" min-width="120" />
          <el-table-column prop="title" label="商品名" min-width="160" />
          <el-table-column prop="priceFen" label="价格(分)" min-width="100" />
          <el-table-column prop="durationDays" label="时长(天)" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="100" />
          <el-table-column label="操作" min-width="140">
            <template #default="{ row }">
              <el-button text type="primary" @click="openEditProductDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>

    <el-dialog
      v-model="productDialogVisible"
      :title="editingProductCode ? '编辑会员商品' : '新增会员商品'"
      width="760px"
    >
      <el-form label-position="top">
        <div class="commerce-center__grid">
          <el-form-item label="code">
            <el-input v-model="productForm.code" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="productForm.status">
              <el-option label="published" value="published" />
              <el-option label="draft" value="draft" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="productForm.title" />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="productForm.subtitle" />
          </el-form-item>
          <el-form-item label="价格(分)">
            <el-input-number v-model="productForm.priceFen" :min="1" :step="100" />
          </el-form-item>
          <el-form-item label="时长(天)">
            <el-input-number v-model="productForm.durationDays" :min="1" :step="1" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="productForm.sortOrder" :min="1" :step="10" />
          </el-form-item>
        </div>

        <el-form-item label="描述">
          <el-input v-model="productForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="权益（每行一个）">
          <el-input v-model="productForm.benefitsText" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProduct" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createMembershipProduct,
  fetchMembershipProducts,
  updateMembershipProduct,
  type MembershipProductItem,
} from '../api/commerce';

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
  benefitsText: '完整版报告\n无限海报生成',
  sortOrder: 10,
  status: 'published' as 'draft' | 'published',
});

async function loadProducts() {
  try {
    loadingProducts.value = true;
    const response = await fetchMembershipProducts();
    products.value = response.data.items;
  } catch (error) {
    console.warn('load membership products failed', error);
    ElMessage.error('会员商品加载失败');
  } finally {
    loadingProducts.value = false;
  }
}

function resetProductForm() {
  editingProductCode.value = '';
  productForm.code = '';
  productForm.title = '';
  productForm.subtitle = '';
  productForm.description = '';
  productForm.priceFen = 3900;
  productForm.durationDays = 30;
  productForm.benefitsText = '完整版报告\n无限海报生成';
  productForm.sortOrder = 10;
  productForm.status = 'published';
}

function openCreateProductDialog() {
  resetProductForm();
  productDialogVisible.value = true;
}

function openEditProductDialog(item: MembershipProductItem) {
  editingProductCode.value = item.code;
  productForm.code = item.code;
  productForm.title = item.title;
  productForm.subtitle = item.subtitle || '';
  productForm.description = item.description || '';
  productForm.priceFen = item.priceFen;
  productForm.durationDays = item.durationDays;
  productForm.benefitsText = item.benefits.join('\n');
  productForm.sortOrder = item.sortOrder;
  productForm.status = item.status;
  productDialogVisible.value = true;
}

async function saveProduct() {
  const payload = {
    code: productForm.code.trim(),
    title: productForm.title.trim(),
    subtitle: productForm.subtitle.trim(),
    description: productForm.description.trim(),
    priceFen: productForm.priceFen,
    durationDays: productForm.durationDays,
    benefits: productForm.benefitsText.split('\n').map((item) => item.trim()).filter(Boolean),
    sortOrder: productForm.sortOrder,
    status: productForm.status,
  };

  try {
    savingProduct.value = true;
    if (editingProductCode.value) {
      await updateMembershipProduct(editingProductCode.value, payload);
    } else {
      await createMembershipProduct(payload);
    }
    ElMessage.success('会员商品已保存');
    productDialogVisible.value = false;
    await loadProducts();
  } catch (error) {
    console.warn('save membership product failed', error);
    ElMessage.error('会员商品保存失败');
  } finally {
    savingProduct.value = false;
  }
}

onMounted(() => {
  void loadProducts();
});
</script>

<style scoped lang="scss">
.commerce-center {
  display: grid;
  gap: 24px;
}

.commerce-center__section {
  display: grid;
  gap: 16px;
}

.commerce-center__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.commerce-center__eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #718096;
}

.commerce-center__title {
  margin: 6px 0 0;
  font-size: 28px;
  color: #1c2d3b;
}

.commerce-center__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 960px) {
  .commerce-center__grid {
    grid-template-columns: 1fr;
  }
}
</style>
