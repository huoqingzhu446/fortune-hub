export interface BirthPlaceOption {
  code: string;
  label: string;
  province: string;
  country: string;
  longitude: number;
  latitude: number;
  timezoneOffset: number;
  keywords: string[];
}

export const BIRTH_PLACE_CATALOG: BirthPlaceOption[] = [
  { code: 'hangzhou', label: '杭州', province: '浙江', country: '中国', longitude: 120.16, latitude: 30.25, timezoneOffset: 8, keywords: ['浙江', 'hz'] },
  { code: 'beijing', label: '北京', province: '北京', country: '中国', longitude: 116.4, latitude: 39.9, timezoneOffset: 8, keywords: ['bj'] },
  { code: 'shanghai', label: '上海', province: '上海', country: '中国', longitude: 121.47, latitude: 31.23, timezoneOffset: 8, keywords: ['sh'] },
  { code: 'guangzhou', label: '广州', province: '广东', country: '中国', longitude: 113.26, latitude: 23.13, timezoneOffset: 8, keywords: ['广东', 'gz'] },
  { code: 'shenzhen', label: '深圳', province: '广东', country: '中国', longitude: 114.06, latitude: 22.54, timezoneOffset: 8, keywords: ['广东', 'sz'] },
  { code: 'nanjing', label: '南京', province: '江苏', country: '中国', longitude: 118.78, latitude: 32.06, timezoneOffset: 8, keywords: ['江苏', 'nj'] },
  { code: 'xuzhou', label: '徐州', province: '江苏', country: '中国', longitude: 117.18, latitude: 34.26, timezoneOffset: 8, keywords: ['江苏', 'xz'] },
  { code: 'wuxi', label: '无锡', province: '江苏', country: '中国', longitude: 120.31, latitude: 31.49, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'changzhou', label: '常州', province: '江苏', country: '中国', longitude: 119.95, latitude: 31.78, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'suzhou', label: '苏州', province: '江苏', country: '中国', longitude: 120.58, latitude: 31.3, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'nantong', label: '南通', province: '江苏', country: '中国', longitude: 120.89, latitude: 31.98, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'lianyungang', label: '连云港', province: '江苏', country: '中国', longitude: 119.22, latitude: 34.6, timezoneOffset: 8, keywords: ['江苏', 'lyg'] },
  { code: 'huaian', label: '淮安', province: '江苏', country: '中国', longitude: 119.02, latitude: 33.61, timezoneOffset: 8, keywords: ['江苏', 'huai an'] },
  { code: 'yancheng', label: '盐城', province: '江苏', country: '中国', longitude: 120.16, latitude: 33.35, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'yangzhou', label: '扬州', province: '江苏', country: '中国', longitude: 119.41, latitude: 32.39, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'zhenjiang', label: '镇江', province: '江苏', country: '中国', longitude: 119.45, latitude: 32.2, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'taizhou-jiangsu', label: '泰州', province: '江苏', country: '中国', longitude: 119.92, latitude: 32.46, timezoneOffset: 8, keywords: ['江苏', 'taizhou'] },
  { code: 'suqian', label: '宿迁', province: '江苏', country: '中国', longitude: 118.28, latitude: 33.96, timezoneOffset: 8, keywords: ['江苏'] },
  { code: 'tianjin', label: '天津', province: '天津', country: '中国', longitude: 117.2, latitude: 39.13, timezoneOffset: 8, keywords: ['tj'] },
  { code: 'shijiazhuang', label: '石家庄', province: '河北', country: '中国', longitude: 114.51, latitude: 38.04, timezoneOffset: 8, keywords: ['河北', 'sjz'] },
  { code: 'taiyuan', label: '太原', province: '山西', country: '中国', longitude: 112.55, latitude: 37.87, timezoneOffset: 8, keywords: ['山西'] },
  { code: 'hohhot', label: '呼和浩特', province: '内蒙古', country: '中国', longitude: 111.75, latitude: 40.84, timezoneOffset: 8, keywords: ['内蒙古', 'huhehaote'] },
  { code: 'chengdu', label: '成都', province: '四川', country: '中国', longitude: 104.06, latitude: 30.67, timezoneOffset: 8, keywords: ['四川', 'cd'] },
  { code: 'chongqing', label: '重庆', province: '重庆', country: '中国', longitude: 106.55, latitude: 29.56, timezoneOffset: 8, keywords: ['cq'] },
  { code: 'xian', label: '西安', province: '陕西', country: '中国', longitude: 108.94, latitude: 34.34, timezoneOffset: 8, keywords: ['陕西', 'xi an'] },
  { code: 'wuhan', label: '武汉', province: '湖北', country: '中国', longitude: 114.31, latitude: 30.59, timezoneOffset: 8, keywords: ['湖北', 'wh'] },
  { code: 'changsha', label: '长沙', province: '湖南', country: '中国', longitude: 112.94, latitude: 28.23, timezoneOffset: 8, keywords: ['湖南'] },
  { code: 'zhengzhou', label: '郑州', province: '河南', country: '中国', longitude: 113.62, latitude: 34.75, timezoneOffset: 8, keywords: ['河南'] },
  { code: 'jinan', label: '济南', province: '山东', country: '中国', longitude: 117.12, latitude: 36.65, timezoneOffset: 8, keywords: ['山东', 'ji nan'] },
  { code: 'qingdao', label: '青岛', province: '山东', country: '中国', longitude: 120.38, latitude: 36.07, timezoneOffset: 8, keywords: ['山东'] },
  { code: 'yantai', label: '烟台', province: '山东', country: '中国', longitude: 121.45, latitude: 37.46, timezoneOffset: 8, keywords: ['山东'] },
  { code: 'weifang', label: '潍坊', province: '山东', country: '中国', longitude: 119.16, latitude: 36.71, timezoneOffset: 8, keywords: ['山东'] },
  { code: 'linyi', label: '临沂', province: '山东', country: '中国', longitude: 118.36, latitude: 35.1, timezoneOffset: 8, keywords: ['山东'] },
  { code: 'shenyang', label: '沈阳', province: '辽宁', country: '中国', longitude: 123.43, latitude: 41.8, timezoneOffset: 8, keywords: ['辽宁'] },
  { code: 'dalian', label: '大连', province: '辽宁', country: '中国', longitude: 121.61, latitude: 38.91, timezoneOffset: 8, keywords: ['辽宁'] },
  { code: 'changchun', label: '长春', province: '吉林', country: '中国', longitude: 125.32, latitude: 43.82, timezoneOffset: 8, keywords: ['吉林'] },
  { code: 'harbin', label: '哈尔滨', province: '黑龙江', country: '中国', longitude: 126.64, latitude: 45.76, timezoneOffset: 8, keywords: ['黑龙江'] },
  { code: 'hefei', label: '合肥', province: '安徽', country: '中国', longitude: 117.23, latitude: 31.82, timezoneOffset: 8, keywords: ['安徽'] },
  { code: 'wuhu', label: '芜湖', province: '安徽', country: '中国', longitude: 118.38, latitude: 31.33, timezoneOffset: 8, keywords: ['安徽'] },
  { code: 'ningbo', label: '宁波', province: '浙江', country: '中国', longitude: 121.55, latitude: 29.87, timezoneOffset: 8, keywords: ['浙江'] },
  { code: 'wenzhou', label: '温州', province: '浙江', country: '中国', longitude: 120.7, latitude: 28.0, timezoneOffset: 8, keywords: ['浙江'] },
  { code: 'jiaxing', label: '嘉兴', province: '浙江', country: '中国', longitude: 120.76, latitude: 30.75, timezoneOffset: 8, keywords: ['浙江'] },
  { code: 'shaoxing', label: '绍兴', province: '浙江', country: '中国', longitude: 120.58, latitude: 30.03, timezoneOffset: 8, keywords: ['浙江'] },
  { code: 'jinhua', label: '金华', province: '浙江', country: '中国', longitude: 119.65, latitude: 29.08, timezoneOffset: 8, keywords: ['浙江'] },
  { code: 'taizhou-zhejiang', label: '台州', province: '浙江', country: '中国', longitude: 121.42, latitude: 28.66, timezoneOffset: 8, keywords: ['浙江', 'taizhou'] },
  { code: 'fuzhou', label: '福州', province: '福建', country: '中国', longitude: 119.3, latitude: 26.08, timezoneOffset: 8, keywords: ['福建'] },
  { code: 'xiamen', label: '厦门', province: '福建', country: '中国', longitude: 118.09, latitude: 24.48, timezoneOffset: 8, keywords: ['福建'] },
  { code: 'quanzhou', label: '泉州', province: '福建', country: '中国', longitude: 118.68, latitude: 24.87, timezoneOffset: 8, keywords: ['福建'] },
  { code: 'nanchang', label: '南昌', province: '江西', country: '中国', longitude: 115.86, latitude: 28.68, timezoneOffset: 8, keywords: ['江西'] },
  { code: 'kunming', label: '昆明', province: '云南', country: '中国', longitude: 102.83, latitude: 24.88, timezoneOffset: 8, keywords: ['云南'] },
  { code: 'guiyang', label: '贵阳', province: '贵州', country: '中国', longitude: 106.63, latitude: 26.65, timezoneOffset: 8, keywords: ['贵州'] },
  { code: 'nanning', label: '南宁', province: '广西', country: '中国', longitude: 108.37, latitude: 22.82, timezoneOffset: 8, keywords: ['广西'] },
  { code: 'haikou', label: '海口', province: '海南', country: '中国', longitude: 110.2, latitude: 20.04, timezoneOffset: 8, keywords: ['海南'] },
  { code: 'sanya', label: '三亚', province: '海南', country: '中国', longitude: 109.51, latitude: 18.25, timezoneOffset: 8, keywords: ['海南'] },
  { code: 'lanzhou', label: '兰州', province: '甘肃', country: '中国', longitude: 103.84, latitude: 36.06, timezoneOffset: 8, keywords: ['甘肃'] },
  { code: 'xining', label: '西宁', province: '青海', country: '中国', longitude: 101.78, latitude: 36.62, timezoneOffset: 8, keywords: ['青海'] },
  { code: 'yinchuan', label: '银川', province: '宁夏', country: '中国', longitude: 106.23, latitude: 38.49, timezoneOffset: 8, keywords: ['宁夏'] },
  { code: 'lhasa', label: '拉萨', province: '西藏', country: '中国', longitude: 91.13, latitude: 29.65, timezoneOffset: 8, keywords: ['西藏'] },
  { code: 'urumqi', label: '乌鲁木齐', province: '新疆', country: '中国', longitude: 87.62, latitude: 43.82, timezoneOffset: 8, keywords: ['新疆', 'wulumuqi'] },
  { code: 'hongkong', label: '香港', province: '香港', country: '中国', longitude: 114.17, latitude: 22.32, timezoneOffset: 8, keywords: ['hong kong', 'hk'] },
  { code: 'macau', label: '澳门', province: '澳门', country: '中国', longitude: 113.54, latitude: 22.2, timezoneOffset: 8, keywords: ['aomen', 'macao'] },
  { code: 'taipei', label: '台北', province: '台湾', country: '中国', longitude: 121.56, latitude: 25.04, timezoneOffset: 8, keywords: ['台湾'] },
  { code: 'singapore', label: '新加坡', province: '新加坡', country: '新加坡', longitude: 103.85, latitude: 1.29, timezoneOffset: 8, keywords: ['sg'] },
  { code: 'tokyo', label: '东京', province: '东京都', country: '日本', longitude: 139.69, latitude: 35.69, timezoneOffset: 9, keywords: ['日本'] },
  { code: 'seoul', label: '首尔', province: '首尔', country: '韩国', longitude: 126.98, latitude: 37.57, timezoneOffset: 9, keywords: ['韩国'] },
  { code: 'london', label: '伦敦', province: '英格兰', country: '英国', longitude: -0.13, latitude: 51.51, timezoneOffset: 0, keywords: ['英国'] },
  { code: 'new-york', label: '纽约', province: '纽约州', country: '美国', longitude: -74.01, latitude: 40.71, timezoneOffset: -5, keywords: ['new york', 'newyork'] },
  { code: 'los-angeles', label: '洛杉矶', province: '加利福尼亚州', country: '美国', longitude: -118.24, latitude: 34.05, timezoneOffset: -8, keywords: ['los angeles', 'la'] },
  { code: 'sydney', label: '悉尼', province: '新南威尔士州', country: '澳大利亚', longitude: 151.21, latitude: -33.87, timezoneOffset: 10, keywords: ['澳大利亚'] },
];

export function searchBirthPlaceCatalog(keyword = '', limit = 10) {
  const normalizedKeyword = normalizeBirthPlaceKeyword(keyword);
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 30);

  if (!normalizedKeyword) {
    return BIRTH_PLACE_CATALOG.slice(0, safeLimit);
  }

  return BIRTH_PLACE_CATALOG.map((place, index) => ({
    place,
    index,
    score: scoreBirthPlace(place, normalizedKeyword),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, safeLimit)
    .map((item) => item.place);
}

function scoreBirthPlace(place: BirthPlaceOption, keyword: string) {
  const label = normalizeBirthPlaceKeyword(place.label);
  const code = normalizeBirthPlaceKeyword(place.code);
  const province = normalizeBirthPlaceKeyword(place.province);
  const country = normalizeBirthPlaceKeyword(place.country);
  const keywords = place.keywords.map(normalizeBirthPlaceKeyword);

  if (label === keyword || code === keyword) {
    return 100;
  }

  if (label.startsWith(keyword) || code.startsWith(keyword)) {
    return 80;
  }

  if (label.includes(keyword) || code.includes(keyword)) {
    return 60;
  }

  if (keywords.some((item) => item === keyword)) {
    return 55;
  }

  if (keywords.some((item) => item.includes(keyword))) {
    return 40;
  }

  if (province.includes(keyword) || country.includes(keyword)) {
    return 20;
  }

  return 0;
}

function normalizeBirthPlaceKeyword(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '');
}
