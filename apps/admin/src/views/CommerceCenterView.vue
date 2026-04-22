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

    <section class="commerce-center__section">
      <div class="commerce-center__head">
        <div>
          <div class="commerce-center__eyebrow">ads</div>
          <h2 class="commerce-center__title">广告解锁位</h2>
        </div>
      </div>

      <el-card shadow="never">
        <el-table :data="adConfigs" stripe v-loading="loadingAds">
          <el-table-column prop="slotCode" label="slotCode" min-width="140" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="placement" label="位置" min-width="120" />
          <el-table-column prop="rewardType" label="奖励类型" min-width="160" />
          <el-table-column label="启用" min-width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '开启' : '关闭' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="140">
            <template #default="{ row }">
              <el-button text type="primary" @click="openEditAdDialog(row)">编辑</el-button>
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

    <el-dialog v-model="adDialogVisible" title="编辑广告配置" width="760px">
      <el-form label-position="top">
        <div class="commerce-center__grid">
          <el-form-item label="slotCode">
            <el-input v-model="adForm.slotCode" />
          </el-form-item>
          <el-form-item label="位置">
            <el-input v-model="adForm.placement" />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="adForm.title" />
          </el-form-item>
          <el-form-item label="奖励类型">
            <el-input v-model="adForm.rewardType" />
          </el-form-item>
        </div>

        <el-form-item label="奖励说明">
          <el-input v-model="adForm.rewardDescription" />
        </el-form-item>

        <el-form-item label="启用">
          <el-switch v-model="adForm.enabled" />
        </el-form-item>

        <el-form-item label="配置 JSON">
          <el-input v-model="adForm.configJsonText" type="textarea" :rows="10" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingAd" @click="saveAd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createMembershipProduct,
  fetchAdConfigs,
  fetchMembershipProducts,
  updateAdConfig,
  updateMembershipProduct,
  type AdConfigItem,
  type MembershipProductItem,
} from '../api/commerce';

const products = ref<MembershipProductItem[]>([]);
const adConfigs = ref<AdConfigItem[]>([]);
const loadingProducts = ref(false);
const loadingAds = ref(false);
const productDialogVisible = ref(false);
const adDialogVisible = ref(false);
const editingProductCode = ref('');
const editingAdId = ref('');
const savingProduct = ref(false);
const savingAd = ref(false);

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

const adForm = reactive({
  slotCode: '',
  title: '',
  placement: '',
  rewardType: '',
  rewardDescription: '',
  enabled: true,
  configJsonText: '{\n  "maxUnlocksPerDay": 6\n}',
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

async function loadAds() {
  try {
    loadingAds.value = true;
    const response = await fetchAdConfigs();
    adConfigs.value = response.data.items;
  } catch (error) {
    console.warn('load ad configs failed', error);
    ElMessage.error('广告配置加载失败');
  } finally {
    loadingAds.value = false;
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

function openEditAdDialog(item: AdConfigItem) {
  editingAdId.value = item.id;
  adForm.slotCode = item.slotCode;
  adForm.title = item.title;
  adForm.placement = item.placement;
  adForm.rewardType = item.rewardType;
  adForm.rewardDescription = item.rewardDescription || '';
  adForm.enabled = item.enabled;
  adForm.configJsonText = JSON.stringify(item.configJson, null, 2);
  adDialogVisible.value = true;
}

async function saveAd() {
  let configJson: Record<string, unknown>;

  try {
    configJson = JSON.parse(adForm.configJsonText) as Record<string, unknown>;
  } catch {
    ElMessage.error('广告配置 JSON 不是合法格式');
    return;
  }

  try {
    savingAd.value = true;
    await updateAdConfig(editingAdId.value, {
      slotCode: adForm.slotCode.trim(),
      title: adForm.title.trim(),
      placement: adForm.placement.trim(),
      rewardType: adForm.rewardType.trim(),
      rewardDescription: adForm.rewardDescription.trim(),
      enabled: adForm.enabled,
      configJson,
    });
    ElMessage.success('广告配置已保存');
    adDialogVisible.value = false;
    await loadAds();
  } catch (error) {
    console.warn('save ad config failed', error);
    ElMessage.error('广告配置保存失败');
  } finally {
    savingAd.value = false;
  }
}

onMounted(() => {
  void Promise.all([loadProducts(), loadAds()]);
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
