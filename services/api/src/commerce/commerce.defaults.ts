export const DEFAULT_MEMBERSHIP_PRODUCTS = [
  {
    code: 'vip-7d',
    title: 'VIP 体验周',
    subtitle: '先体验完整版解读与海报权益',
    description: '适合先体验完整报告、无限海报生成与优先解锁入口。',
    priceFen: 1900,
    durationDays: 7,
    benefitsJson: ['完整版报告', '无限海报生成', '结果页优先解锁'],
    sortOrder: 10,
    status: 'published',
  },
  {
    code: 'vip-30d',
    title: 'VIP 月卡',
    subtitle: '完整内容解锁的标准方案',
    description: '适合持续查看八字、性格和情绪结果的完整版解读。',
    priceFen: 3900,
    durationDays: 30,
    benefitsJson: ['完整版报告', '无限海报生成', '历史记录完整解锁'],
    sortOrder: 20,
    status: 'published',
  },
  {
    code: 'vip-90d',
    title: 'VIP 季卡',
    subtitle: '适合长期内容体验与分享',
    description: '适合需要持续查看阶段性变化和反复生成分享海报的用户。',
    priceFen: 9900,
    durationDays: 90,
    benefitsJson: ['完整版报告', '无限海报生成', '历史记录完整解锁', '优先体验新能力'],
    sortOrder: 30,
    status: 'published',
  },
] as const;

export const DEFAULT_AD_CONFIGS = [
  {
    slotCode: 'unlock-full-report',
    title: '完整版报告激励位',
    placement: 'report_unlock',
    rewardType: 'unlock_full_report',
    rewardDescription: '观看激励视频后可解锁当前报告完整版。',
    enabled: true,
    configJson: {
      maxUnlocksPerDay: 6,
      rewardScope: 'single_record',
      CTA: '观看激励视频解锁完整版',
    },
  },
] as const;
