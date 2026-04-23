<template>
  <div class="question-bank-page">
    <el-card shadow="never" class="question-bank-page__toolbar">
      <div class="question-bank-page__toolbar-head">
        <div>
          <div class="question-bank-page__eyebrow">Question Bank</div>
          <h2 class="question-bank-page__title">题库管理</h2>
          <p class="question-bank-page__text">
            使用表格管理题库列表，支持按分类与名称筛选，并可通过 JSON 导入或导出 Schema 交给 AI 生成题库。
          </p>
        </div>

        <div class="question-bank-page__toolbar-actions">
          <el-button plain @click="openGroupDialog">管理分类</el-button>
          <el-button plain @click="openImportDialog">JSON 导入</el-button>
          <el-button plain @click="exportJsonSchema">导出 JSON Schema</el-button>
          <el-button type="primary" @click="openCreateDialog">新增题库</el-button>
        </div>
      </div>

      <div class="question-bank-page__filters">
        <el-select
          v-model="filterForm.category"
          clearable
          placeholder="全部分类"
          class="question-bank-page__filter-item"
        >
          <el-option label="全部分类" value="" />
          <el-option
            v-for="item in categories"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-input
          v-model="filterForm.keyword"
          clearable
          placeholder="按名称 / code / 副标题搜索"
          class="question-bank-page__filter-item question-bank-page__filter-item--wide"
        />

        <el-button @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="question-bank-page__table-card">
      <el-table
        v-loading="loadingList"
        :data="filteredTests"
        :row-key="questionBankRowKey"
        empty-text="暂无符合条件的题库"
      >
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.categoryLabel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="题库名称" min-width="320">
          <template #default="{ row }">
            <div class="question-bank-page__name-cell">
              <div class="question-bank-page__name-main">{{ row.title }}</div>
              <div class="question-bank-page__name-sub">{{ row.subtitle || '暂无副标题' }}</div>
              <div class="question-bank-page__name-meta">code: {{ row.code }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="运营分类" min-width="150">
          <template #default="{ row }">
            <div>{{ row.groupLabel }}</div>
            <div class="question-bank-page__table-sub">{{ row.groupCode }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="题量" width="90" align="center">
          <template #default="{ row }">{{ row.questionCount }}</template>
        </el-table-column>

        <el-table-column label="结构" width="150">
          <template #default="{ row }">
            {{ row.optionSchema === 'personality' ? '维度评分' : '阈值判定' }}
          </template>
        </el-table-column>

        <el-table-column label="最近更新" min-width="150">
          <template #default="{ row }">
            {{ row.updatedAt ? formatDate(row.updatedAt) : '未更新' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="question-bank-page__row-actions">
              <el-button text @click="openTest(row, 'view')">查看</el-button>
              <el-button text type="primary" @click="openTest(row, 'edit')">修改</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
      v-model="detailDrawerVisible"
      :title="detailDrawerTitle"
      size="78%"
      destroy-on-close="false"
    >
      <div v-if="loadingDetail" class="question-bank-page__empty">正在载入题库详情...</div>

      <el-scrollbar v-else-if="activeTest" height="calc(100vh - 120px)">
        <div class="question-bank-editor">
          <div class="question-bank-editor__header">
            <div>
              <div class="question-bank-page__eyebrow">{{ activeTest.categoryLabel }}</div>
              <h3 class="question-bank-editor__title">{{ activeTest.title }}</h3>
              <p class="question-bank-page__text">{{ activeTest.description }}</p>
            </div>

            <div class="question-bank-editor__header-actions">
              <el-tag :type="statusTagType(activeTest.status)">
                {{ statusLabel(activeTest.status) }}
              </el-tag>
              <el-button v-if="isDetailReadonly" type="primary" plain @click="switchToEditMode">
                切换到修改
              </el-button>
              <template v-else>
                <el-button plain @click="openImportDialog">JSON 导入</el-button>
                <el-button
                  v-if="activeTest.status !== 'draft'"
                  plain
                  @click="changeTestStatus('draft')"
                >
                  转草稿
                </el-button>
                <el-button
                  v-if="activeTest.status !== 'published'"
                  type="success"
                  plain
                  @click="changeTestStatus('published')"
                >
                  发布
                </el-button>
                <el-button
                  v-if="activeTest.status !== 'archived'"
                  type="warning"
                  plain
                  @click="changeTestStatus('archived')"
                >
                  归档
                </el-button>
                <el-button type="primary" :loading="saving" @click="saveTest">
                  保存修改
                </el-button>
              </template>
            </div>
          </div>

          <el-alert
            v-if="isDetailReadonly"
            title="当前为查看模式，内容只读。"
            type="info"
            :closable="false"
          />

          <div class="question-bank-editor__summary">
            <span>{{ editableQuestions.length }} 题</span>
            <span>{{ activeTest.groupLabel }}</span>
            <span>{{ activeTest.optionSchema === 'personality' ? '维度评分' : '阈值判定' }}</span>
            <span v-if="activeTest.updatedAt">最近更新：{{ formatDate(activeTest.updatedAt) }}</span>
            <span v-if="activeTest.publishedAt">发布于：{{ formatDate(activeTest.publishedAt) }}</span>
            <span v-if="activeTest.archivedAt">归档于：{{ formatDate(activeTest.archivedAt) }}</span>
          </div>

          <el-card shadow="never" class="question-bank-editor__card">
            <template #header>
              <div class="question-bank-editor__card-header">
                <div>
                  <div class="question-bank-editor__card-title">基础信息</div>
                  <div class="question-bank-editor__card-helper">
                    配置题库标题、分类、时长、简介和展示标签。
                  </div>
                </div>
              </div>
            </template>

            <div class="question-bank-editor__field-grid question-bank-editor__field-grid--three">
              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">标题</span>
                <el-input
                  v-model="editableMeta.title"
                  :readonly="isDetailReadonly"
                  placeholder="例如 日常节奏感测评"
                />
              </label>

              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">运营分类</span>
                <el-select
                  v-model="editableMeta.groupCode"
                  :disabled="isDetailReadonly"
                  placeholder="请选择分类"
                >
                  <el-option
                    v-for="group in activeGroups"
                    :key="group.code"
                    :label="group.label"
                    :value="group.code"
                  />
                </el-select>
              </label>

              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">预计时长（分钟）</span>
                <el-input-number
                  v-model="editableMeta.durationMinutes"
                  :disabled="isDetailReadonly"
                  :min="1"
                  :max="30"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">副标题</span>
                <el-input
                  v-model="editableMeta.subtitle"
                  :readonly="isDetailReadonly"
                  placeholder="一句话解释这套测试"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">说明文案</span>
                <el-input
                  v-model="editableMeta.description"
                  :readonly="isDetailReadonly"
                  type="textarea"
                  :rows="2"
                  placeholder="展示在列表和详情顶部的简介"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">答题引导</span>
                <el-input
                  v-model="editableMeta.intro"
                  :readonly="isDetailReadonly"
                  type="textarea"
                  :rows="2"
                  placeholder="开始答题前给用户看的说明"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">标签（每行一个）</span>
                <el-input
                  v-model="editableMeta.tagsText"
                  :readonly="isDetailReadonly"
                  type="textarea"
                  :rows="3"
                  placeholder="入门推荐&#10;轻量 3 分钟"
                />
              </label>
            </div>
          </el-card>

          <el-card shadow="never" class="question-bank-editor__card">
            <template #header>
              <div class="question-bank-editor__card-header">
                <div>
                  <div class="question-bank-editor__card-title">结果页分享海报</div>
                  <div class="question-bank-editor__card-helper">
                    配置结果页展示的分享文案与主题，支持
                    <code>{resultTitle}</code>、<code>{testTitle}</code>、<code>{score}</code>
                    等变量。
                  </div>
                </div>
              </div>
            </template>

            <div class="question-bank-editor__field-grid question-bank-editor__field-grid--three">
              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">主标题模板</span>
                <el-input
                  v-model="editablePoster.headlineTemplate"
                  :readonly="isDetailReadonly"
                  placeholder="例如 {resultTitle}"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">副标题模板</span>
                <el-input
                  v-model="editablePoster.subtitleTemplate"
                  :readonly="isDetailReadonly"
                  placeholder="例如 我刚完成了{testTitle}"
                />
              </label>

              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">强调文案</span>
                <el-input
                  v-model="editablePoster.accentText"
                  :readonly="isDetailReadonly"
                  placeholder="例如 轻量测评 · 认识自己"
                />
              </label>

              <label class="question-bank-editor__field">
                <span class="question-bank-editor__field-label">主题名</span>
                <el-input
                  v-model="editablePoster.themeName"
                  :readonly="isDetailReadonly"
                  placeholder="例如 fresh-mint"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">底部文案</span>
                <el-input
                  v-model="editablePoster.footerText"
                  :readonly="isDetailReadonly"
                  placeholder="例如 先看见自己的自然优势，再决定下一步怎么用。"
                />
              </label>
            </div>

            <div class="question-bank-editor__poster-preview">
              <div class="question-bank-editor__poster-shell">
                <div class="question-bank-editor__poster-theme">
                  {{ editablePoster.themeName || 'theme' }}
                </div>
                <div class="question-bank-editor__poster-title">
                  {{ editablePoster.headlineTemplate || '海报主标题' }}
                </div>
                <div class="question-bank-editor__poster-subtitle">
                  {{ editablePoster.subtitleTemplate || '海报副标题' }}
                </div>
                <div class="question-bank-editor__poster-accent">
                  {{ editablePoster.accentText || '强调文案' }}
                </div>
                <div class="question-bank-editor__poster-footer">
                  {{ editablePoster.footerText || '底部文案' }}
                </div>
              </div>
            </div>
          </el-card>

          <el-card
            v-if="activeTest.optionSchema === 'personality'"
            shadow="never"
            class="question-bank-editor__card"
          >
            <template #header>
              <div class="question-bank-editor__card-header">
                <div>
                  <div class="question-bank-editor__card-title">结果画像配置</div>
                  <div class="question-bank-editor__card-helper">
                    配置维度名称和每个维度命中的画像、优势、建议。
                  </div>
                </div>

                <el-button v-if="!isDetailReadonly" plain @click="addDimension">
                  新增维度
                </el-button>
              </div>
            </template>

            <div class="question-bank-editor__stack">
              <el-card
                v-for="(dimension, index) in editableDimensions"
                :key="`${dimension.key}-${index}`"
                shadow="never"
                class="question-bank-editor__sub-card"
              >
                <div class="question-bank-editor__field-grid">
                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">维度 key</span>
                    <el-input
                      v-model="dimension.key"
                      :readonly="isDetailReadonly"
                      placeholder="例如 drive"
                      @change="syncProfilesWithDimensions"
                    />
                  </label>

                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">维度名称</span>
                    <el-input
                      v-model="dimension.label"
                      :readonly="isDetailReadonly"
                      placeholder="例如 行动力"
                    />
                  </label>
                </div>

                <div v-if="!isDetailReadonly" class="question-bank-editor__card-actions">
                  <el-button
                    text
                    type="danger"
                    :disabled="editableDimensions.length <= 1"
                    @click="removeDimension(index)"
                  >
                    删除维度
                  </el-button>
                </div>
              </el-card>
            </div>

            <div class="question-bank-editor__stack">
              <el-card
                v-for="dimension in editableDimensions"
                :key="dimension.key"
                shadow="never"
                class="question-bank-editor__sub-card"
              >
                <template #header>
                  <div class="question-bank-editor__sub-card-title">
                    {{ dimension.label || '未命名维度' }} 画像
                  </div>
                </template>

                <div class="question-bank-editor__field-grid">
                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">结果标题</span>
                    <el-input
                      v-model="editableProfiles[dimension.key].title"
                      :readonly="isDetailReadonly"
                      placeholder="例如 轻快执行型"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">结果总结</span>
                    <el-input
                      v-model="editableProfiles[dimension.key].summary"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="3"
                      placeholder="描述这个维度突出的用户画像"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">优势（每行一条）</span>
                    <el-input
                      v-model="editableProfiles[dimension.key].strengthsText"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="4"
                      placeholder="例如 在高节奏任务里更容易快速启动"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">建议（每行一条）</span>
                    <el-input
                      v-model="editableProfiles[dimension.key].suggestionsText"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="4"
                      placeholder="例如 建议在关键节点多留一点复盘时间"
                    />
                  </label>
                </div>
              </el-card>
            </div>
          </el-card>

          <el-card v-else shadow="never" class="question-bank-editor__card">
            <template #header>
              <div class="question-bank-editor__card-header">
                <div>
                  <div class="question-bank-editor__card-title">阈值与提醒配置</div>
                  <div class="question-bank-editor__card-helper">
                    配置免责声明、放松建议和每个分数段的结果文案。
                  </div>
                </div>

                <el-button v-if="!isDetailReadonly" plain @click="addThreshold">
                  新增阈值段
                </el-button>
              </div>
            </template>

            <div class="question-bank-editor__field-grid">
              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">免责声明</span>
                <el-input
                  v-model="editableEmotionConfig.disclaimer"
                  :readonly="isDetailReadonly"
                  type="textarea"
                  :rows="3"
                  placeholder="提示这不是医疗诊断"
                />
              </label>

              <label class="question-bank-editor__field question-bank-editor__field--wide">
                <span class="question-bank-editor__field-label">放松建议（每行一个）</span>
                <el-input
                  v-model="editableEmotionConfig.relaxStepsText"
                  :readonly="isDetailReadonly"
                  type="textarea"
                  :rows="4"
                  placeholder="先做 1 分钟缓慢呼气"
                />
              </label>
            </div>

            <div class="question-bank-editor__stack">
              <el-card
                v-for="(threshold, index) in editableEmotionConfig.thresholds"
                :key="`${threshold.level}-${index}`"
                shadow="never"
                class="question-bank-editor__sub-card"
              >
                <template #header>
                  <div class="question-bank-editor__card-header">
                    <div class="question-bank-editor__sub-card-title">阈值段 {{ index + 1 }}</div>
                    <el-button
                      v-if="!isDetailReadonly"
                      text
                      type="danger"
                      :disabled="editableEmotionConfig.thresholds.length <= 1"
                      @click="removeThreshold(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>

                <div class="question-bank-editor__field-grid question-bank-editor__field-grid--three">
                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">最高分</span>
                    <el-input-number
                      v-model="threshold.maxScore"
                      :disabled="isDetailReadonly"
                      :min="0"
                      :max="99"
                    />
                  </label>

                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">风险等级</span>
                    <el-select v-model="threshold.level" :disabled="isDetailReadonly">
                      <el-option label="steady" value="steady" />
                      <el-option label="watch" value="watch" />
                      <el-option label="support" value="support" />
                      <el-option label="urgent" value="urgent" />
                    </el-select>
                  </label>

                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">结果标题</span>
                    <el-input
                      v-model="threshold.title"
                      :readonly="isDetailReadonly"
                      placeholder="例如 平稳观察区"
                    />
                  </label>

                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">副标题</span>
                    <el-input
                      v-model="threshold.subtitle"
                      :readonly="isDetailReadonly"
                      placeholder="例如 最近整体还算稳定"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">总结</span>
                    <el-input
                      v-model="threshold.summary"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="2"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">主要建议</span>
                    <el-input
                      v-model="threshold.primarySuggestion"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="2"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">支持提醒</span>
                    <el-input
                      v-model="threshold.supportSignal"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="2"
                    />
                  </label>
                </div>
              </el-card>
            </div>
          </el-card>

          <el-card shadow="never" class="question-bank-editor__card">
            <template #header>
              <div class="question-bank-editor__card-header">
                <div>
                  <div class="question-bank-editor__card-title">题目与选项</div>
                  <div class="question-bank-editor__card-helper">
                    配置题干、题号、选项、分值以及维度映射。
                  </div>
                </div>

                <el-button v-if="!isDetailReadonly" plain @click="addQuestion">
                  新增题目
                </el-button>
              </div>
            </template>

            <div class="question-bank-editor__stack">
              <el-card
                v-for="(question, questionIndex) in editableQuestions"
                :key="`${question.questionId}-${questionIndex}`"
                shadow="never"
                class="question-bank-editor__sub-card"
              >
                <template #header>
                  <div class="question-bank-editor__question-header">
                    <div>
                      <div class="question-bank-editor__question-index">
                        Question {{ questionIndex + 1 }}
                      </div>
                      <div class="question-bank-editor__question-id">
                        {{ question.questionId || '未设置 questionId' }}
                      </div>
                    </div>

                    <div v-if="!isDetailReadonly" class="question-bank-editor__question-actions">
                      <el-button
                        text
                        :disabled="questionIndex === 0"
                        @click="moveQuestion(questionIndex, -1)"
                      >
                        上移
                      </el-button>
                      <el-button
                        text
                        :disabled="questionIndex === editableQuestions.length - 1"
                        @click="moveQuestion(questionIndex, 1)"
                      >
                        下移
                      </el-button>
                      <el-button text type="danger" @click="removeQuestion(questionIndex)">
                        删除
                      </el-button>
                    </div>
                  </div>
                </template>

                <div class="question-bank-editor__field-grid">
                  <label class="question-bank-editor__field">
                    <span class="question-bank-editor__field-label">questionId</span>
                    <el-input
                      v-model="question.questionId"
                      :readonly="isDetailReadonly"
                      placeholder="例如 rhythm-1"
                    />
                  </label>

                  <label class="question-bank-editor__field question-bank-editor__field--wide">
                    <span class="question-bank-editor__field-label">题目内容</span>
                    <el-input
                      v-model="question.prompt"
                      :readonly="isDetailReadonly"
                      type="textarea"
                      :rows="2"
                      placeholder="请输入题目"
                    />
                  </label>
                </div>

                <div class="question-bank-editor__options-head">
                  <div class="question-bank-editor__card-title question-bank-editor__card-title--small">
                    选项配置
                  </div>
                  <el-button
                    v-if="!isDetailReadonly"
                    text
                    @click="addOption(question)"
                  >
                    新增选项
                  </el-button>
                </div>

                <div class="question-bank-editor__option-list">
                  <div
                    v-for="(option, optionIndex) in question.options"
                    :key="`${option.key}-${optionIndex}`"
                    class="question-bank-editor__option-row"
                  >
                    <el-input
                      v-model="option.key"
                      :readonly="isDetailReadonly"
                      placeholder="A"
                      class="question-bank-editor__option-key"
                    />
                    <el-input
                      v-model="option.label"
                      :readonly="isDetailReadonly"
                      placeholder="选项文案"
                      class="question-bank-editor__option-label"
                    />
                    <el-select
                      v-if="activeTest.optionSchema === 'personality'"
                      v-model="option.dimension"
                      :disabled="isDetailReadonly"
                      placeholder="维度"
                      class="question-bank-editor__option-dimension"
                    >
                      <el-option
                        v-for="dimension in editableDimensions"
                        :key="dimension.key"
                        :label="dimension.label || dimension.key"
                        :value="dimension.key"
                      />
                    </el-select>
                    <el-input-number
                      v-model="option.score"
                      :disabled="isDetailReadonly"
                      :min="0"
                      :max="9"
                      class="question-bank-editor__option-score"
                    />
                    <el-button
                      v-if="!isDetailReadonly"
                      text
                      type="danger"
                      @click="removeOption(question, optionIndex)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </el-card>
        </div>
      </el-scrollbar>

      <div v-else class="question-bank-page__empty">未找到题库详情。</div>
    </el-drawer>

    <el-dialog v-model="createDialogVisible" width="560px" title="新增题库">
      <div class="question-bank-dialog">
        <el-alert
          title="创建后可以继续在修改模式里补充题目，或直接使用 JSON 导入整套题库。"
          type="info"
          :closable="false"
        />

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">分类</span>
          <el-select v-model="createForm.category">
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">运营分类</span>
          <el-select v-model="createForm.groupCode" placeholder="请选择分类">
            <el-option
              v-for="group in createDialogGroups"
              :key="group.code"
              :label="group.label"
              :value="group.code"
            />
          </el-select>
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">code</span>
          <el-input v-model="createForm.code" placeholder="例如 social-rhythm" />
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">标题</span>
          <el-input v-model="createForm.title" placeholder="例如 社交节奏测评" />
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">副标题</span>
          <el-input v-model="createForm.subtitle" placeholder="可选" />
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">简介</span>
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="可选" />
        </label>

        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">复制现有测试集（可选）</span>
          <el-select v-model="createForm.cloneFromCode" clearable placeholder="不选则创建空白模板">
            <el-option
              v-for="item in cloneSourceTests"
              :key="item.code"
              :label="`${item.title} (${item.code})`"
              :value="item.code"
            />
          </el-select>
        </label>
      </div>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreateTest">
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" width="760px" title="JSON 导入题库">
      <div class="question-bank-dialog">
        <el-alert
          title="支持新建或覆盖更新题库。JSON 字段请以导出的 JSON Schema 为准。"
          type="info"
          :closable="false"
        />

        <div class="question-bank-dialog__actions">
          <el-button plain @click="triggerImportFile">选择 JSON 文件</el-button>
          <el-button plain @click="exportJsonSchema">导出当前 Schema</el-button>
          <el-button text @click="importJsonText = ''">清空内容</el-button>
        </div>

        <el-input
          v-model="importJsonText"
          type="textarea"
          :rows="20"
          placeholder="请粘贴完整的题库 JSON，或通过上方按钮选择 JSON 文件。"
        />
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImportJson">
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="groupDialogVisible" width="720px" title="管理运营分类">
      <div class="question-bank-dialog">
        <label class="question-bank-editor__field">
          <span class="question-bank-editor__field-label">分类</span>
          <el-select v-model="groupDialogCategory">
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <div class="question-bank-group-list">
          <div
            v-for="group in currentGroups"
            :key="group.code"
            class="question-bank-group-list__item"
          >
            <div>
              <div class="question-bank-group-list__title">{{ group.label }}</div>
              <div class="question-bank-group-list__meta">
                {{ group.code }} · {{ group.description || '暂无描述' }}
              </div>
              <div class="question-bank-group-list__actions">
                <el-tag size="small" :type="statusTagType(group.status)">
                  {{ statusLabel(group.status) }}
                </el-tag>
                <el-button
                  v-if="group.status !== 'draft'"
                  text
                  @click="changeGroupStatus(group.code, 'draft')"
                >
                  转草稿
                </el-button>
                <el-button
                  v-if="group.status !== 'published'"
                  text
                  @click="changeGroupStatus(group.code, 'published')"
                >
                  发布
                </el-button>
                <el-button
                  v-if="group.status !== 'archived'"
                  text
                  @click="changeGroupStatus(group.code, 'archived')"
                >
                  归档
                </el-button>
              </div>
            </div>

            <el-button
              text
              type="danger"
              :disabled="group.isDefault"
              @click="removeGroup(group.code)"
            >
              删除
            </el-button>
          </div>
        </div>

        <el-card shadow="never">
          <template #header>
            <div class="question-bank-editor__card-title question-bank-editor__card-title--small">
              新增分类
            </div>
          </template>

          <div class="question-bank-editor__field-grid question-bank-editor__field-grid--three">
            <label class="question-bank-editor__field">
              <span class="question-bank-editor__field-label">code</span>
              <el-input v-model="groupForm.code" placeholder="例如 starter" />
            </label>

            <label class="question-bank-editor__field">
              <span class="question-bank-editor__field-label">名称</span>
              <el-input v-model="groupForm.label" placeholder="例如 入门推荐" />
            </label>

            <label class="question-bank-editor__field question-bank-editor__field--wide">
              <span class="question-bank-editor__field-label">描述</span>
              <el-input v-model="groupForm.description" placeholder="可选" />
            </label>
          </div>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="groupDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="creatingGroup" @click="submitCreateGroup">
          新增分类
        </el-button>
      </template>
    </el-dialog>

    <input
      ref="importFileInput"
      type="file"
      accept=".json,application/json"
      class="question-bank-page__hidden-input"
      @change="handleImportFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import JSON5 from 'json5';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  createQuestionBankGroup,
  createQuestionBankTest,
  deleteQuestionBankGroup,
  fetchQuestionBankDetail,
  fetchQuestionBankGroups,
  fetchQuestionBankTests,
  updateQuestionBankDetail,
  updateQuestionBankGroupStatus,
  updateQuestionBankTestStatus,
  type CreateQuestionBankTestPayload,
  type EmotionQuestionBankDetail,
  type EmotionThresholdConfig,
  type LifecycleStatus,
  type PersonalityProfileConfig,
  type PersonalityQuestionBankDetail,
  type QuestionBankCategory,
  type QuestionBankDetail,
  type QuestionBankGroup,
  type QuestionBankOption,
  type QuestionBankQuestion,
  type QuestionBankTestSummary,
  type SharePosterConfig,
  type UpdateQuestionBankDetailPayload,
} from '../api/question-bank';

type CategoryItem = { value: QuestionBankCategory; label: string };
type DetailMode = 'view' | 'edit';
type EditableDimension = { key: string; label: string };
type EditableProfile = {
  title: string;
  summary: string;
  strengthsText: string;
  suggestionsText: string;
};
type CategoryFilterValue = '' | QuestionBankCategory;
type QuestionBankImportPayload = {
  category: QuestionBankCategory;
  code: string;
  groupCode: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  sharePoster: SharePosterConfig;
  questions: Array<{
    questionId?: string;
    prompt: string;
    options: QuestionBankOption[];
  }>;
  dimensionLabels?: Record<string, string>;
  profiles?: Record<string, PersonalityProfileConfig>;
  disclaimer?: string;
  relaxSteps?: string[];
  thresholds?: EmotionThresholdConfig[];
};
type JsonSchema = Record<string, unknown>;

const defaultCategories: CategoryItem[] = [
  { value: 'personality', label: '性格测评' },
  { value: 'emotion', label: '情绪自检' },
];

const categories = ref<CategoryItem[]>(defaultCategories);
const tests = ref<QuestionBankTestSummary[]>([]);
const activeTest = ref<QuestionBankDetail | null>(null);
const editableQuestions = ref<QuestionBankQuestion[]>([]);
const editableDimensions = ref<EditableDimension[]>([]);
const editableProfiles = ref<Record<string, EditableProfile>>({});
const loadingList = ref(false);
const loadingDetail = ref(false);
const saving = ref(false);
const creating = ref(false);
const creatingGroup = ref(false);
const importing = ref(false);
const selectedKey = ref('');
const detailMode = ref<DetailMode>('view');
const detailDrawerVisible = ref(false);
const createDialogVisible = ref(false);
const importDialogVisible = ref(false);
const groupDialogVisible = ref(false);
const groupDialogCategory = ref<QuestionBankCategory>('personality');
const importJsonText = ref('');
const importFileInput = ref<HTMLInputElement | null>(null);
const groupMap = reactive<Record<QuestionBankCategory, QuestionBankGroup[]>>({
  personality: [],
  emotion: [],
});

const filterForm = reactive({
  category: '' as CategoryFilterValue,
  keyword: '',
});

const editableMeta = reactive({
  title: '',
  subtitle: '',
  description: '',
  intro: '',
  durationMinutes: 3,
  tagsText: '',
  groupCode: 'default',
});

const editableEmotionConfig = reactive({
  disclaimer: '',
  relaxStepsText: '',
  thresholds: [] as EmotionThresholdConfig[],
});

const editablePoster = reactive<SharePosterConfig>({
  headlineTemplate: '',
  subtitleTemplate: '',
  accentText: '',
  footerText: '',
  themeName: '',
});

const createForm = reactive<CreateQuestionBankTestPayload>({
  category: 'personality',
  groupCode: 'default',
  code: '',
  title: '',
  subtitle: '',
  description: '',
  cloneFromCode: '',
});

const groupForm = reactive({
  code: '',
  label: '',
  description: '',
});

const filteredTests = computed(() => {
  const keyword = filterForm.keyword.trim().toLowerCase();

  return tests.value.filter((item) => {
    const matchedCategory = !filterForm.category || item.category === filterForm.category;
    if (!matchedCategory) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [item.title, item.subtitle, item.code, item.groupLabel]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(keyword));
  });
});

const activeGroups = computed(() =>
  activeTest.value ? groupMap[activeTest.value.category] ?? [] : [],
);

const currentGroups = computed(() => groupMap[groupDialogCategory.value] ?? []);

const createDialogGroups = computed(() => groupMap[createForm.category] ?? []);

const cloneSourceTests = computed(() =>
  tests.value.filter((item) => item.category === createForm.category),
);

const isDetailReadonly = computed(() => detailMode.value === 'view');

const detailDrawerTitle = computed(() => {
  if (!activeTest.value) {
    return detailMode.value === 'view' ? '查看题库' : '修改题库';
  }

  return `${detailMode.value === 'view' ? '查看' : '修改'} · ${activeTest.value.title}`;
});

watch(
  () => createForm.category,
  (value) => {
    createForm.groupCode = groupMap[value]?.[0]?.code ?? 'default';
  },
);

async function bootstrap() {
  await loadGroupMap();
  await loadTests();
}

async function loadGroupMap() {
  try {
    const [personalityGroups, emotionGroups] = await Promise.all([
      fetchQuestionBankGroups('personality'),
      fetchQuestionBankGroups('emotion'),
    ]);
    groupMap.personality = personalityGroups;
    groupMap.emotion = emotionGroups;
  } catch (error) {
    console.warn('load question bank groups failed', error);
    ElMessage.error('题库分类读取失败');
  }
}

async function loadTests(keepSelection = false) {
  try {
    loadingList.value = true;
    const payload = await fetchQuestionBankTests();
    categories.value = (payload.categories as CategoryItem[]) || defaultCategories;
    tests.value = payload.tests;

    if (keepSelection && selectedKey.value) {
      const exists = tests.value.some(
        (item) => `${item.category}:${item.code}` === selectedKey.value,
      );

      if (!exists) {
        selectedKey.value = '';
        activeTest.value = null;
        detailDrawerVisible.value = false;
      }
    }
  } catch (error) {
    console.warn('load question bank tests failed', error);
    ElMessage.error('题库列表读取失败');
  } finally {
    loadingList.value = false;
  }
}

async function openTest(item: QuestionBankTestSummary, mode: DetailMode) {
  try {
    loadingDetail.value = true;
    detailMode.value = mode;
    detailDrawerVisible.value = true;
    selectedKey.value = `${item.category}:${item.code}`;
    const detail = await fetchQuestionBankDetail(item.category, item.code);
    applyDetail(detail);
  } catch (error) {
    console.warn('load question bank detail failed', error);
    ElMessage.error('题库详情读取失败');
  } finally {
    loadingDetail.value = false;
  }
}

function switchToEditMode() {
  detailMode.value = 'edit';
}

function applyDetail(detail: QuestionBankDetail) {
  activeTest.value = detail;
  editableMeta.title = detail.title;
  editableMeta.subtitle = detail.subtitle;
  editableMeta.description = detail.description;
  editableMeta.intro = detail.intro;
  editableMeta.durationMinutes = detail.durationMinutes;
  editableMeta.tagsText = detail.tags.join('\n');
  editableMeta.groupCode = detail.groupCode;
  editableQuestions.value = detail.questions.map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
  }));
  editablePoster.headlineTemplate = detail.sharePoster.headlineTemplate;
  editablePoster.subtitleTemplate = detail.sharePoster.subtitleTemplate;
  editablePoster.accentText = detail.sharePoster.accentText;
  editablePoster.footerText = detail.sharePoster.footerText;
  editablePoster.themeName = detail.sharePoster.themeName;

  if (detail.optionSchema === 'personality') {
    applyPersonalityConfig(detail);
    editableEmotionConfig.disclaimer = '';
    editableEmotionConfig.relaxStepsText = '';
    editableEmotionConfig.thresholds = [];
  } else {
    editableDimensions.value = [];
    editableProfiles.value = {};
    applyEmotionConfig(detail);
  }
}

function applyPersonalityConfig(detail: PersonalityQuestionBankDetail) {
  editableDimensions.value = Object.entries(detail.dimensionLabels).map(([key, label]) => ({
    key,
    label,
  }));

  editableProfiles.value = Object.fromEntries(
    editableDimensions.value.map((dimension) => {
      const profile = detail.profiles[dimension.key] ?? {
        title: `${dimension.label}优势型`,
        summary: `你的${dimension.label}更突出，适合继续补充更细的结果画像。`,
        strengths: [],
        suggestions: [],
      };

      return [
        dimension.key,
        {
          title: profile.title,
          summary: profile.summary,
          strengthsText: profile.strengths.join('\n'),
          suggestionsText: profile.suggestions.join('\n'),
        },
      ];
    }),
  );

  syncProfilesWithDimensions();
}

function applyEmotionConfig(detail: EmotionQuestionBankDetail) {
  editableEmotionConfig.disclaimer = detail.disclaimer;
  editableEmotionConfig.relaxStepsText = detail.relaxSteps.join('\n');
  editableEmotionConfig.thresholds = detail.thresholds.map((item) => ({ ...item }));
}

function openCreateDialog() {
  createForm.category = normalizeCategoryValue(filterForm.category) ?? activeTest.value?.category ?? 'personality';
  createForm.groupCode = groupMap[createForm.category]?.[0]?.code ?? 'default';
  createForm.code = '';
  createForm.title = '';
  createForm.subtitle = '';
  createForm.description = '';
  createForm.cloneFromCode = '';
  createDialogVisible.value = true;
}

async function submitCreateTest() {
  if (!createForm.code.trim() || !createForm.title.trim()) {
    ElMessage.warning('请先填写 code 和标题');
    return;
  }

  try {
    creating.value = true;
    const detail = await createQuestionBankTest({
      category: createForm.category,
      groupCode: createForm.groupCode,
      code: createForm.code.trim(),
      title: createForm.title.trim(),
      subtitle: createForm.subtitle?.trim() || undefined,
      description: createForm.description?.trim() || undefined,
      cloneFromCode: createForm.cloneFromCode?.trim() || undefined,
    });

    filterForm.category = detail.category;
    selectedKey.value = `${detail.category}:${detail.code}`;
    createDialogVisible.value = false;
    detailMode.value = 'edit';
    detailDrawerVisible.value = true;
    applyDetail(detail);
    await loadTests(true);
    ElMessage.success('题库已创建，当前为草稿状态');
  } catch (error) {
    console.warn('create question bank test failed', error);
    ElMessage.error(resolveErrorMessage(error, '新增题库失败'));
  } finally {
    creating.value = false;
  }
}

function openImportDialog() {
  importJsonText.value = '';
  importDialogVisible.value = true;
}

function triggerImportFile() {
  importFileInput.value?.click();
}

async function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    importJsonText.value = await file.text();
  } catch (error) {
    console.warn('read import file failed', error);
    ElMessage.error('读取 JSON 文件失败');
  } finally {
    input.value = '';
  }
}

async function submitImportJson() {
  if (!importJsonText.value.trim()) {
    ElMessage.warning('请先粘贴或选择 JSON 内容');
    return;
  }

  try {
    importing.value = true;
    const parsed = parseImportedJson(importJsonText.value);
    const payload = normalizeImportedQuestionBank(parsed);
    const resolvedGroup = resolveImportGroupCode(payload.category, payload.groupCode);
    const detail = await upsertQuestionBankByImport({
      ...payload,
      groupCode: resolvedGroup.groupCode,
    });

    filterForm.category = detail.category;
    selectedKey.value = `${detail.category}:${detail.code}`;
    importDialogVisible.value = false;
    detailMode.value = 'edit';
    detailDrawerVisible.value = true;
    applyDetail(detail);
    await loadTests(true);

    ElMessage.success(
      resolvedGroup.adjusted
        ? 'JSON 已导入，分组不存在时已自动回退到默认分类'
        : 'JSON 已成功导入',
    );
  } catch (error) {
    console.warn('import question bank json failed', error);
    ElMessage.error(resolveErrorMessage(error, 'JSON 导入失败'));
  } finally {
    importing.value = false;
  }
}

async function upsertQuestionBankByImport(
  payload: QuestionBankImportPayload,
): Promise<QuestionBankDetail> {
  const exists = tests.value.find(
    (item) => item.category === payload.category && item.code === payload.code,
  );

  if (!exists) {
    await createQuestionBankTest({
      category: payload.category,
      code: payload.code,
      groupCode: payload.groupCode,
      title: payload.title,
      subtitle: payload.subtitle,
      description: payload.description,
    });
  }

  return updateQuestionBankDetail(
    payload.category,
    payload.code,
    buildPayloadFromImport(payload),
  );
}

function exportJsonSchema() {
  const category = normalizeCategoryValue(filterForm.category) ?? activeTest.value?.category ?? null;
  const schema = buildQuestionBankJsonSchema(category);
  const suffix = category ?? 'all';
  downloadJsonFile(
    `fortune-hub-question-bank-${suffix}-schema.json`,
    JSON.stringify(schema, null, 2),
  );
  ElMessage.success('JSON Schema 已导出');
}

function openGroupDialog() {
  groupDialogCategory.value =
    normalizeCategoryValue(filterForm.category) ?? activeTest.value?.category ?? 'personality';
  groupForm.code = '';
  groupForm.label = '';
  groupForm.description = '';
  groupDialogVisible.value = true;
}

async function submitCreateGroup() {
  if (!groupForm.code.trim() || !groupForm.label.trim()) {
    ElMessage.warning('请先填写分类 code 和名称');
    return;
  }

  try {
    creatingGroup.value = true;
    const groups = await createQuestionBankGroup({
      category: groupDialogCategory.value,
      code: groupForm.code.trim(),
      label: groupForm.label.trim(),
      description: groupForm.description.trim() || undefined,
    });
    groupMap[groupDialogCategory.value] = groups;
    groupForm.code = '';
    groupForm.label = '';
    groupForm.description = '';
    ElMessage.success('分类已新增，当前为草稿状态');
  } catch (error) {
    console.warn('create question bank group failed', error);
    ElMessage.error(resolveErrorMessage(error, '新增分类失败'));
  } finally {
    creatingGroup.value = false;
  }
}

async function removeGroup(code: string) {
  try {
    const groups = await deleteQuestionBankGroup(groupDialogCategory.value, code);
    groupMap[groupDialogCategory.value] = groups;
    ElMessage.success('分类已删除');
  } catch (error) {
    console.warn('delete question bank group failed', error);
    ElMessage.error(resolveErrorMessage(error, '分类删除失败'));
  }
}

async function changeGroupStatus(code: string, status: LifecycleStatus) {
  try {
    const groups = await updateQuestionBankGroupStatus(groupDialogCategory.value, code, status);
    groupMap[groupDialogCategory.value] = groups;
    await loadTests(true);
    ElMessage.success(`分类已切换为${statusLabel(status)}`);
  } catch (error) {
    console.warn('change question bank group status failed', error);
    ElMessage.error(resolveErrorMessage(error, '分类状态切换失败'));
  }
}

function addDimension() {
  const nextIndex = editableDimensions.value.length + 1;
  editableDimensions.value.push({
    key: `dimension${nextIndex}`,
    label: `维度 ${nextIndex}`,
  });
  syncProfilesWithDimensions();
}

function removeDimension(index: number) {
  const [removed] = editableDimensions.value.splice(index, 1);
  if (removed) {
    delete editableProfiles.value[removed.key];
  }
  syncProfilesWithDimensions();
}

function syncProfilesWithDimensions() {
  const nextProfiles: Record<string, EditableProfile> = {};

  editableDimensions.value = editableDimensions.value.map((dimension, index) => ({
    key: dimension.key.trim() || `dimension${index + 1}`,
    label: dimension.label.trim() || `维度 ${index + 1}`,
  }));

  for (const dimension of editableDimensions.value) {
    nextProfiles[dimension.key] =
      editableProfiles.value[dimension.key] ?? createDefaultProfileState(dimension.label);
  }

  editableProfiles.value = nextProfiles;

  for (const question of editableQuestions.value) {
    for (const option of question.options) {
      if (!option.dimension || !nextProfiles[option.dimension]) {
        option.dimension = editableDimensions.value[0]?.key ?? '';
      }
    }
  }
}

function addThreshold() {
  editableEmotionConfig.thresholds.push({
    maxScore: 7,
    level: 'watch',
    title: '待补充标题',
    subtitle: '待补充副标题',
    summary: '待补充结果总结',
    primarySuggestion: '待补充主要建议',
    supportSignal: '待补充支持提醒',
  });
}

function removeThreshold(index: number) {
  editableEmotionConfig.thresholds.splice(index, 1);
}

function addQuestion() {
  if (!activeTest.value) {
    return;
  }

  editableQuestions.value.push({
    id: '',
    questionId: `${activeTest.value.code}-${editableQuestions.value.length + 1}`,
    prompt: '',
    sortOrder: editableQuestions.value.length + 1,
    options: createDefaultOptions(activeTest.value.optionSchema),
  });
}

function removeQuestion(index: number) {
  editableQuestions.value.splice(index, 1);
}

function moveQuestion(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= editableQuestions.value.length) {
    return;
  }

  const clone = [...editableQuestions.value];
  const [current] = clone.splice(index, 1);
  clone.splice(target, 0, current);
  editableQuestions.value = clone;
}

function addOption(question: QuestionBankQuestion) {
  question.options.push({
    key: String.fromCharCode(65 + question.options.length),
    label: '',
    score: activeTest.value?.optionSchema === 'emotion' ? 0 : 3,
    ...(activeTest.value?.optionSchema === 'personality'
      ? { dimension: editableDimensions.value[0]?.key ?? '' }
      : {}),
  });
}

function removeOption(question: QuestionBankQuestion, optionIndex: number) {
  question.options.splice(optionIndex, 1);
}

async function saveTest() {
  if (!activeTest.value) {
    return;
  }

  if (!editableMeta.title.trim() || !editableMeta.subtitle.trim()) {
    ElMessage.warning('请先完善标题和副标题');
    return;
  }

  if (!editableMeta.groupCode) {
    ElMessage.warning('请先选择运营分类');
    return;
  }

  if (activeTest.value.optionSchema === 'personality' && editableDimensions.value.length === 0) {
    ElMessage.warning('至少保留一个维度');
    return;
  }

  if (
    activeTest.value.optionSchema === 'emotion' &&
    editableEmotionConfig.thresholds.length === 0
  ) {
    ElMessage.warning('至少保留一个阈值段');
    return;
  }

  try {
    saving.value = true;
    const detail = await updateQuestionBankDetail(
      activeTest.value.category,
      activeTest.value.code,
      buildSavePayload(),
    );
    applyDetail(detail);
    await loadTests(true);
    ElMessage.success('题库配置已保存');
  } catch (error) {
    console.warn('save question bank failed', error);
    ElMessage.error(resolveErrorMessage(error, '题库保存失败'));
  } finally {
    saving.value = false;
  }
}

async function changeTestStatus(status: LifecycleStatus) {
  if (!activeTest.value) {
    return;
  }

  try {
    const detail = await updateQuestionBankTestStatus(
      activeTest.value.category,
      activeTest.value.code,
      status,
    );
    applyDetail(detail);
    await loadTests(true);
    ElMessage.success(`题库已切换为${statusLabel(status)}`);
  } catch (error) {
    console.warn('change question bank test status failed', error);
    ElMessage.error(resolveErrorMessage(error, '题库状态切换失败'));
  }
}

function buildSavePayload(): UpdateQuestionBankDetailPayload {
  return buildPayloadFromImport({
    category: activeTest.value?.category ?? 'personality',
    code: activeTest.value?.code ?? '',
    groupCode: editableMeta.groupCode,
    title: editableMeta.title.trim(),
    subtitle: editableMeta.subtitle.trim(),
    description: editableMeta.description.trim(),
    intro: editableMeta.intro.trim(),
    durationMinutes: Number(editableMeta.durationMinutes) || 3,
    tags: splitLines(editableMeta.tagsText),
    sharePoster: {
      headlineTemplate: editablePoster.headlineTemplate.trim(),
      subtitleTemplate: editablePoster.subtitleTemplate.trim(),
      accentText: editablePoster.accentText.trim(),
      footerText: editablePoster.footerText.trim(),
      themeName: editablePoster.themeName.trim(),
    },
    questions: editableQuestions.value.map((question, index) => ({
      questionId: question.questionId || `${activeTest.value?.code}-${index + 1}`,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        key: option.key,
        label: option.label,
        score: Number(option.score),
        ...(activeTest.value?.optionSchema === 'personality'
          ? { dimension: option.dimension || editableDimensions.value[0]?.key || '' }
          : {}),
      })),
    })),
    ...(activeTest.value?.optionSchema === 'personality'
      ? {
          dimensionLabels: Object.fromEntries(
            editableDimensions.value
              .map((item) => [item.key.trim(), item.label.trim()] as const)
              .filter(([key, label]) => key && label),
          ),
          profiles: Object.fromEntries(
            Object.entries(editableProfiles.value).map(([key, value]) => [
              key,
              {
                title: value.title.trim(),
                summary: value.summary.trim(),
                strengths: splitLines(value.strengthsText),
                suggestions: splitLines(value.suggestionsText),
              } satisfies PersonalityProfileConfig,
            ]),
          ),
        }
      : {
          disclaimer: editableEmotionConfig.disclaimer.trim(),
          relaxSteps: splitLines(editableEmotionConfig.relaxStepsText),
          thresholds: editableEmotionConfig.thresholds.map((item) => ({
            ...item,
            maxScore: Number(item.maxScore),
          })),
        }),
  });
}

function buildPayloadFromImport(
  payload: QuestionBankImportPayload,
): UpdateQuestionBankDetailPayload {
  const basePayload: UpdateQuestionBankDetailPayload = {
    title: payload.title,
    subtitle: payload.subtitle,
    description: payload.description,
    intro: payload.intro,
    durationMinutes: payload.durationMinutes,
    tags: payload.tags,
    groupCode: payload.groupCode,
    sharePoster: payload.sharePoster,
    questions: payload.questions.map((question, index) => ({
      questionId: question.questionId || `${payload.code}-${index + 1}`,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        key: option.key,
        label: option.label,
        score: Number(option.score),
        ...(payload.category === 'personality'
          ? { dimension: option.dimension || Object.keys(payload.dimensionLabels ?? {})[0] || '' }
          : {}),
      })),
    })),
  };

  if (payload.category === 'personality') {
    return {
      ...basePayload,
      dimensionLabels: payload.dimensionLabels,
      profiles: payload.profiles,
    };
  }

  return {
    ...basePayload,
    disclaimer: payload.disclaimer,
    relaxSteps: payload.relaxSteps,
    thresholds: payload.thresholds,
  };
}

function createDefaultOptions(schema: 'personality' | 'emotion'): QuestionBankOption[] {
  if (schema === 'emotion') {
    return ['A', 'B', 'C', 'D'].map((key, index) => ({
      key,
      label: '',
      score: index,
    }));
  }

  const [firstKey, secondKey, thirdKey] = editableDimensions.value.map((item) => item.key);

  return [
    { key: 'A', label: '', score: 4, dimension: firstKey ?? '' },
    { key: 'B', label: '', score: 3, dimension: secondKey ?? firstKey ?? '' },
    { key: 'C', label: '', score: 3, dimension: thirdKey ?? secondKey ?? firstKey ?? '' },
  ];
}

function createDefaultProfileState(label: string): EditableProfile {
  return {
    title: `${label}优势型`,
    summary: `你的${label}更突出，适合继续补充更细的结果画像。`,
    strengthsText: `在${label}相关场景里更容易表现自然\n适合继续补充更具体的优势描述`,
    suggestionsText: '建议补一条更具体的行动建议\n建议把文案写得更贴近用户日常语言',
  };
}

function resetFilters() {
  filterForm.category = '';
  filterForm.keyword = '';
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function statusLabel(status: LifecycleStatus | string) {
  if (status === 'published') {
    return '已发布';
  }

  if (status === 'archived') {
    return '已归档';
  }

  return '草稿';
}

function statusTagType(status: LifecycleStatus | string) {
  if (status === 'published') {
    return 'success';
  }

  if (status === 'archived') {
    return 'warning';
  }

  return 'info';
}

function normalizeCategoryValue(value: unknown): QuestionBankCategory | null {
  if (value === 'personality' || value === 'emotion') {
    return value;
  }

  return null;
}

function normalizeImportedQuestionBank(value: unknown): QuestionBankImportPayload {
  const record = asRecord(value);
  const category = normalizeCategoryValue(record.category);

  if (!category) {
    throw new Error('JSON 中的 category 必须是 personality 或 emotion');
  }

  const code = normalizeCode(record.code);
  const title = requireString(record.title, 'title 不能为空');
  const subtitle = pickString(record.subtitle, `${title} · 测评结果`);
  const description = pickString(record.description, `${title}题库导入项`);
  const intro = pickString(record.intro, '请根据直觉选择最符合你的选项。');
  const durationMinutes = normalizeMinInteger(record.durationMinutes, 3, 1);
  const tags = normalizeStringArray(record.tags);
  const sharePoster = normalizeSharePoster(record.sharePoster, title);
  const groupCode = normalizeOptionalCode(record.groupCode) || 'default';

  if (category === 'personality') {
    const dimensionLabels = normalizeDimensionLabels(record.dimensionLabels);
    const profiles = normalizeProfiles(record.profiles, dimensionLabels);
    const questions = normalizeQuestions(record.questions, category, Object.keys(dimensionLabels));

    return {
      category,
      code,
      groupCode,
      title,
      subtitle,
      description,
      intro,
      durationMinutes,
      tags,
      sharePoster,
      questions,
      dimensionLabels,
      profiles,
    };
  }

  const thresholds = normalizeThresholds(record.thresholds);
  const relaxSteps = normalizeStringArray(record.relaxSteps);

  return {
    category,
    code,
    groupCode,
    title,
    subtitle,
    description,
    intro,
    durationMinutes,
    tags,
    sharePoster,
    questions: normalizeQuestions(record.questions, category, []),
    disclaimer: pickString(record.disclaimer, '本结果仅用于自我观察，不构成医疗建议。'),
    relaxSteps,
    thresholds,
  };
}

function parseImportedJson(raw: string): unknown {
  const normalized = normalizeImportedJsonSource(raw);

  try {
    return JSON.parse(normalized);
  } catch (jsonError) {
    try {
      return JSON5.parse(normalized);
    } catch (json5Error) {
      throw buildImportParseError(normalized, jsonError, json5Error);
    }
  }
}

function normalizeImportedJsonSource(raw: string) {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json|json5)?\s*([\s\S]*?)\s*```/i);

  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  const objectStart = text.search(/[\[{]/);
  if (objectStart > 0) {
    const rootChar = text[objectStart];
    const endChar = rootChar === '{' ? '}' : ']';
    const objectEnd = text.lastIndexOf(endChar);

    if (objectEnd > objectStart) {
      text = text.slice(objectStart, objectEnd + 1).trim();
    }
  }

  return text;
}

function buildImportParseError(
  source: string,
  jsonError: unknown,
  json5Error: unknown,
) {
  const error = json5Error instanceof Error ? json5Error : jsonError;
  const location = extractParseLocation(source, error);
  const locationText = location
    ? `第 ${location.line} 行第 ${location.column} 列附近`
    : '导入内容中';

  return new Error(
    `JSON 解析失败，${locationText} 有语法问题。请检查是否存在未闭合引号、尾随逗号、非法注释，或把 AI 返回的说明文字一并粘贴进来了。`,
  );
}

function extractParseLocation(source: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  const lineColumnMatch =
    message.match(/at\s+(\d+):(\d+)/i) ||
    message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (lineColumnMatch) {
    return {
      line: Number(lineColumnMatch[1]),
      column: Number(lineColumnMatch[2]),
    };
  }

  const positionMatch = message.match(/position\s+(\d+)/i);
  if (!positionMatch) {
    return null;
  }

  return locateOffset(source, Number(positionMatch[1]));
}

function locateOffset(source: string, offset: number) {
  if (!Number.isFinite(offset) || offset < 0) {
    return null;
  }

  const safeOffset = Math.min(offset, source.length);
  const prefix = source.slice(0, safeOffset);
  const lines = prefix.split('\n');

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function normalizeQuestions(
  value: unknown,
  category: QuestionBankCategory,
  dimensionKeys: string[],
) {
  const records = asArray(value);

  if (records.length === 0) {
    throw new Error('questions 至少需要包含 1 道题');
  }

  return records.map((item, questionIndex) => {
    const record = asRecord(item);
    const options = asArray(record.options);

    if (options.length < 2) {
      throw new Error(`questions[${questionIndex}].options 至少需要 2 个选项`);
    }

    return {
      questionId: pickString(record.questionId, `question-${questionIndex + 1}`),
      prompt: requireString(record.prompt, `questions[${questionIndex}].prompt 不能为空`),
      options: options.map((optionItem, optionIndex) => {
        const optionRecord = asRecord(optionItem);
        const option: QuestionBankOption = {
          key: pickString(optionRecord.key, String.fromCharCode(65 + optionIndex)).slice(0, 8),
          label: requireString(
            optionRecord.label,
            `questions[${questionIndex}].options[${optionIndex}].label 不能为空`,
          ),
          score: normalizePositiveInteger(optionRecord.score, 0),
        };

        if (category === 'personality') {
          option.dimension =
            pickString(optionRecord.dimension, '') || dimensionKeys[0] || 'dimension1';
        }

        return option;
      }),
    };
  });
}

function normalizeDimensionLabels(value: unknown) {
  const record = asRecord(value);
  const result = Object.fromEntries(
    Object.entries(record)
      .map(([key, label]) => [key.trim(), String(label ?? '').trim()] as const)
      .filter(([key, label]) => key && label),
  );

  if (Object.keys(result).length === 0) {
    throw new Error('personality 题库必须提供 dimensionLabels');
  }

  return result;
}

function normalizeProfiles(
  value: unknown,
  dimensionLabels: Record<string, string>,
): Record<string, PersonalityProfileConfig> {
  const record = asRecord(value);

  return Object.fromEntries(
    Object.entries(dimensionLabels).map(([key, label]) => {
      const profile = asRecord(record[key]);

      return [
        key,
        {
          title: pickString(profile.title, `${label}优势型`),
          summary: pickString(profile.summary, `你的${label}更突出。`),
          strengths: normalizeStringArray(profile.strengths),
          suggestions: normalizeStringArray(profile.suggestions),
        } satisfies PersonalityProfileConfig,
      ];
    }),
  );
}

function normalizeThresholds(value: unknown) {
  const records = asArray(value);

  if (records.length === 0) {
    throw new Error('emotion 题库必须提供 thresholds');
  }

  return records.map((item, index) => {
    const record = asRecord(item);
    const level = pickString(record.level, 'watch');

    if (!['steady', 'watch', 'support', 'urgent'].includes(level)) {
      throw new Error(`thresholds[${index}].level 不合法`);
    }

    return {
      maxScore: normalizePositiveInteger(record.maxScore, 0),
      level: level as EmotionThresholdConfig['level'],
      title: requireString(record.title, `thresholds[${index}].title 不能为空`),
      subtitle: pickString(record.subtitle, ''),
      summary: pickString(record.summary, ''),
      primarySuggestion: pickString(record.primarySuggestion, ''),
      supportSignal: pickString(record.supportSignal, ''),
    };
  });
}

function normalizeSharePoster(value: unknown, title: string): SharePosterConfig {
  const record = asRecord(value);

  return {
    headlineTemplate: pickString(record.headlineTemplate, '{resultTitle}'),
    subtitleTemplate: pickString(record.subtitleTemplate, `我刚完成了${title}`),
    accentText: pickString(record.accentText, 'Fortune Hub'),
    footerText: pickString(record.footerText, '把看见自己的过程记录下来。'),
    themeName: pickString(record.themeName, 'fresh-mint'),
  };
}

function normalizeStringArray(value: unknown) {
  return asArray(value)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  return normalizeMinInteger(value, fallback, 0);
}

function normalizeMinInteger(value: unknown, fallback: number, min: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(min, Math.floor(numberValue));
}

function questionBankRowKey(row: QuestionBankTestSummary) {
  return `${row.category}:${row.code}`;
}

function normalizeCode(value: unknown) {
  const code = requireString(value, 'code 不能为空');

  if (!/^[a-z0-9-]+$/.test(code)) {
    throw new Error('code 仅支持小写字母、数字和中划线');
  }

  return code;
}

function normalizeOptionalCode(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  return normalizeCode(value.trim());
}

function requireString(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function pickString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function resolveImportGroupCode(category: QuestionBankCategory, preferred: string) {
  const groups = groupMap[category] ?? [];

  if (preferred && groups.some((group) => group.code === preferred)) {
    return {
      groupCode: preferred,
      adjusted: false,
    };
  }

  return {
    groupCode: groups[0]?.code ?? 'default',
    adjusted: Boolean(preferred),
  };
}

function buildQuestionBankJsonSchema(category: QuestionBankCategory | null): JsonSchema {
  const personalitySchema = createPersonalityImportSchema();
  const emotionSchema = createEmotionImportSchema();

  if (category === 'personality') {
    return personalitySchema;
  }

  if (category === 'emotion') {
    return emotionSchema;
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Fortune Hub Question Bank Import Schema',
    description: '导入 Fortune Hub 题库时使用的 JSON Schema，支持 personality 和 emotion 两类题库。',
    oneOf: [personalitySchema, emotionSchema],
  };
}

function createSharedRootProperties() {
  return {
    code: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: '题库唯一编码，仅支持小写字母、数字和中划线。',
    },
    groupCode: {
      type: 'string',
      description: '运营分类编码，不存在时会自动回落到默认分类。',
    },
    title: {
      type: 'string',
      description: '题库标题。',
    },
    subtitle: {
      type: 'string',
      description: '题库副标题。',
    },
    description: {
      type: 'string',
      description: '题库简介，用于列表和详情顶部展示。',
    },
    intro: {
      type: 'string',
      description: '答题引导文案。',
    },
    durationMinutes: {
      type: 'integer',
      minimum: 1,
      description: '预计耗时，单位分钟。',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: '题库标签列表。',
    },
    sharePoster: {
      type: 'object',
      additionalProperties: false,
      required: [
        'headlineTemplate',
        'subtitleTemplate',
        'accentText',
        'footerText',
        'themeName',
      ],
      properties: {
        headlineTemplate: { type: 'string' },
        subtitleTemplate: { type: 'string' },
        accentText: { type: 'string' },
        footerText: { type: 'string' },
        themeName: { type: 'string' },
      },
      description: '结果页分享海报配置。',
    },
    questions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['prompt', 'options'],
        properties: {
          questionId: {
            type: 'string',
            description: '题目编码，可选。',
          },
          prompt: {
            type: 'string',
            description: '题干内容。',
          },
          options: {
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['key', 'label', 'score'],
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                dimension: {
                  type: 'string',
                  description: 'personality 题库时必填，对应维度 key。',
                },
                score: {
                  type: 'integer',
                  minimum: 0,
                },
              },
            },
          },
        },
      },
    },
  };
}

function createPersonalityImportSchema(): JsonSchema {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Fortune Hub Personality Question Bank Import Schema',
    type: 'object',
    additionalProperties: false,
    required: [
      'category',
      'code',
      'groupCode',
      'title',
      'subtitle',
      'description',
      'intro',
      'durationMinutes',
      'tags',
      'sharePoster',
      'dimensionLabels',
      'profiles',
      'questions',
    ],
    properties: {
      category: {
        const: 'personality',
      },
      ...createSharedRootProperties(),
      dimensionLabels: {
        type: 'object',
        description: '维度 key 到维度名称的映射。',
        additionalProperties: {
          type: 'string',
        },
      },
      profiles: {
        type: 'object',
        description: '每个维度对应的结果画像配置。',
        additionalProperties: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'summary', 'strengths', 'suggestions'],
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            strengths: {
              type: 'array',
              items: { type: 'string' },
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  };
}

function createEmotionImportSchema(): JsonSchema {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Fortune Hub Emotion Question Bank Import Schema',
    type: 'object',
    additionalProperties: false,
    required: [
      'category',
      'code',
      'groupCode',
      'title',
      'subtitle',
      'description',
      'intro',
      'durationMinutes',
      'tags',
      'sharePoster',
      'disclaimer',
      'relaxSteps',
      'thresholds',
      'questions',
    ],
    properties: {
      category: {
        const: 'emotion',
      },
      ...createSharedRootProperties(),
      disclaimer: {
        type: 'string',
      },
      relaxSteps: {
        type: 'array',
        items: { type: 'string' },
      },
      thresholds: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'maxScore',
            'level',
            'title',
            'subtitle',
            'summary',
            'primarySuggestion',
            'supportSignal',
          ],
          properties: {
            maxScore: { type: 'integer', minimum: 0 },
            level: {
              type: 'string',
              enum: ['steady', 'watch', 'support', 'urgent'],
            },
            title: { type: 'string' },
            subtitle: { type: 'string' },
            summary: { type: 'string' },
            primarySuggestion: { type: 'string' },
            supportSignal: { type: 'string' },
          },
        },
      },
    },
  };
}

function downloadJsonFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const responseMessage = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }

    if (Array.isArray(responseMessage)) {
      const firstMessage = responseMessage.find(
        (item) => typeof item === 'string' && item.trim(),
      );
      if (typeof firstMessage === 'string') {
        return firstMessage;
      }
    }
  }

  return fallback;
}

onMounted(() => {
  void bootstrap();
});
</script>

<style scoped lang="scss">
.question-bank-page {
  display: grid;
  gap: 16px;
}

.question-bank-page__toolbar,
.question-bank-page__table-card {
  border: none;
}

.question-bank-page__toolbar-head,
.question-bank-page__filters,
.question-bank-editor__header,
.question-bank-editor__card-header,
.question-bank-editor__question-header,
.question-bank-editor__options-head,
.question-bank-group-list__item,
.question-bank-dialog__actions {
  display: flex;
  gap: 12px;
}

.question-bank-page__toolbar-head,
.question-bank-editor__header,
.question-bank-editor__card-header,
.question-bank-editor__question-header,
.question-bank-editor__options-head,
.question-bank-group-list__item {
  justify-content: space-between;
  align-items: flex-start;
}

.question-bank-page__toolbar-actions,
.question-bank-editor__header-actions,
.question-bank-page__row-actions,
.question-bank-group-list__actions,
.question-bank-editor__question-actions,
.question-bank-editor__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-bank-page__eyebrow,
.question-bank-editor__field-label,
.question-bank-page__name-meta,
.question-bank-page__table-sub,
.question-bank-editor__question-index,
.question-bank-editor__poster-theme,
.question-bank-editor__card-helper {
  font-size: 12px;
  color: #7d8ba1;
}

.question-bank-page__eyebrow {
  margin-bottom: 6px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.question-bank-page__title,
.question-bank-editor__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: #182131;
}

.question-bank-page__text,
.question-bank-page__name-sub,
.question-bank-editor__summary,
.question-bank-group-list__meta,
.question-bank-editor__question-id {
  font-size: 14px;
  line-height: 1.7;
  color: #5f6c81;
}

.question-bank-page__filters {
  margin-top: 16px;
  align-items: center;
}

.question-bank-page__filter-item {
  width: 220px;
}

.question-bank-page__filter-item--wide {
  width: 320px;
}

.question-bank-page__name-cell {
  display: grid;
  gap: 4px;
}

.question-bank-page__name-main,
.question-bank-group-list__title,
.question-bank-editor__card-title,
.question-bank-editor__sub-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #182131;
}

.question-bank-page__empty {
  padding: 48px 0;
  text-align: center;
  color: #7d8ba1;
}

.question-bank-editor {
  display: grid;
  gap: 16px;
  padding-right: 8px;
}

.question-bank-editor__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f7f9fc;
}

.question-bank-editor__card,
.question-bank-editor__sub-card {
  border-radius: 18px;
}

.question-bank-editor__field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.question-bank-editor__field-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.question-bank-editor__field {
  display: grid;
  gap: 8px;
}

.question-bank-editor__field--wide {
  grid-column: 1 / -1;
}

.question-bank-editor__poster-preview {
  margin-top: 16px;
}

.question-bank-editor__poster-shell {
  display: grid;
  gap: 12px;
  padding: 24px;
  border-radius: 22px;
  background: linear-gradient(145deg, #d8ecff 0%, #f6fbff 100%);
  color: #182131;
}

.question-bank-editor__poster-title {
  font-size: 24px;
  font-weight: 700;
}

.question-bank-editor__poster-subtitle,
.question-bank-editor__poster-footer {
  font-size: 14px;
  line-height: 1.7;
  color: #607086;
}

.question-bank-editor__poster-accent {
  font-size: 16px;
  font-weight: 600;
  color: #3c6fd9;
}

.question-bank-editor__stack {
  display: grid;
  gap: 12px;
}

.question-bank-editor__question-code {
  font-size: 13px;
  color: #7d8ba1;
}

.question-bank-editor__option-list {
  display: grid;
  gap: 10px;
}

.question-bank-editor__option-row {
  display: grid;
  grid-template-columns: 88px 1fr 160px 120px auto;
  gap: 10px;
  align-items: center;
}

.question-bank-dialog {
  display: grid;
  gap: 16px;
}

.question-bank-group-list {
  display: grid;
  gap: 10px;
}

.question-bank-group-list__item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f7f9fc;
}

.question-bank-page__hidden-input {
  display: none;
}

@media (max-width: 1200px) {
  .question-bank-editor__field-grid,
  .question-bank-editor__field-grid--three {
    grid-template-columns: 1fr;
  }

  .question-bank-editor__option-row {
    grid-template-columns: 88px 1fr;
  }
}

@media (max-width: 900px) {
  .question-bank-page__toolbar-head,
  .question-bank-page__filters,
  .question-bank-editor__header,
  .question-bank-editor__card-header,
  .question-bank-editor__question-header,
  .question-bank-editor__options-head,
  .question-bank-group-list__item {
    flex-direction: column;
  }

  .question-bank-page__filter-item,
  .question-bank-page__filter-item--wide {
    width: 100%;
  }
}
</style>
