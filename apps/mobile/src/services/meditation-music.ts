import type { MeditationMusicItem } from '../types/lucky';

export const defaultMeditationMusicLibrary: MeditationMusicItem[] = [
  {
    id: 'evening-body-scan',
    title: '睡前身体扫描',
    subtitle: '从脚到头慢慢放松，适合睡前 15 分钟关闭白天的紧绷。',
    category: 'sleep',
    categoryLabel: '睡前安睡',
    durationMinutes: 12,
    atmosphere: '低频环境音',
    scene: '入睡困难、身体紧绷、脑内还在复盘白天时使用。',
    guide: ['调暗灯光，放下手机', '从脚趾开始逐段放松', '结束后不再处理复杂信息'],
    tags: ['安睡', '身体放松', '晚间'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
  },
  {
    id: 'box-breath-reset',
    title: '四拍呼吸复位',
    subtitle: '吸气、停顿、呼气、停顿各四拍，快速把注意力带回身体。',
    category: 'breath',
    categoryLabel: '呼吸减压',
    durationMinutes: 5,
    atmosphere: '极简提示音',
    scene: '焦虑上头、会议前、通勤中或需要马上降速时使用。',
    guide: ['吸气 4 拍', '停顿 4 拍', '呼气 4 拍，再停顿 4 拍'],
    tags: ['急救', '短练习', '呼吸'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/woodland_night.ogg',
  },
  {
    id: 'forest-focus',
    title: '林间专注启动',
    subtitle: '先稳定呼吸，再给今天最重要的一件事留出清晰入口。',
    category: 'focus',
    categoryLabel: '专注启动',
    durationMinutes: 10,
    atmosphere: '自然环境音',
    scene: '开始工作、学习前，或注意力碎片化时使用。',
    guide: ['写下一个任务', '跟随 10 次自然呼吸', '结束后立刻开始第一步'],
    tags: ['专注', '工作前', '清晰'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
  },
  {
    id: 'tidal-emotion-reset',
    title: '潮汐情绪复位',
    subtitle: '允许情绪像潮水一样来去，练习不评判地观察和安放。',
    category: 'healing',
    categoryLabel: '情绪修复',
    durationMinutes: 8,
    atmosphere: '海浪与低频铺底',
    scene: '情绪起伏、委屈、烦躁或需要重新稳定身体节奏时使用。',
    guide: ['给情绪命名', '把注意力放到胸口或腹部', '用一句温柔的话收束'],
    tags: ['情绪', '接纳', '复位'],
    previewUrl: 'https://actions.google.com/sounds/v1/water/dripping_water.ogg',
  },
  {
    id: 'morning-grounding',
    title: '晨间安定练习',
    subtitle: '用 7 分钟确认身体、环境和今天的优先级，让一天不被推着走。',
    category: 'meditation',
    categoryLabel: '基础静心',
    durationMinutes: 7,
    atmosphere: '清晨轻环境音',
    scene: '起床后、出门前，或想给一天定一个稳定基调时使用。',
    guide: ['感受双脚和坐骨', '观察三处环境声音', '确认今天只先做好一件事'],
    tags: ['晨间', '安定', '意图'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
  },
  {
    id: 'shoulder-release',
    title: '肩颈松开练习',
    subtitle: '把注意力放到肩颈、下颌和眼周，适合久坐后的身体修复。',
    category: 'body',
    categoryLabel: '身体扫描',
    durationMinutes: 9,
    atmosphere: '柔和白噪',
    scene: '久坐、肩颈紧、头脑疲惫但又不想睡觉时使用。',
    guide: ['觉察肩膀高度', '放松下颌和眼周', '缓慢转动肩颈后记录身体变化'],
    tags: ['肩颈', '久坐', '身体觉察'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
  },
];

export function findMeditationMusic(id?: string) {
  if (!id) {
    return null;
  }

  return defaultMeditationMusicLibrary.find((item) => item.id === id) ?? null;
}
