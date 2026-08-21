// 广告、促销与主商户字段保持和 iOS Codable 结构一致。
// 审批、订单和统计属于学校 Web 演示层，未来接 API 时可独立替换。

export const advertisementRecords = [
  {
    adID: 1001,
    saleID: 2001,
    startTime: '2026-08-20T00:00:00+08:00',
    endTime: '2026-09-15T23:59:59+08:00',
    type: 'L',
    img: 'https://static.example.test/campura/ads/coffee-autumn.webp',
  },
  {
    adID: 1002,
    saleID: 2002,
    startTime: '2026-08-22T00:00:00+08:00',
    endTime: '2026-09-06T23:59:59+08:00',
    type: 'S',
    img: 'https://static.example.test/campura/ads/stationery-kit.webp',
  },
  {
    adID: 1003,
    saleID: 2003,
    startTime: '2026-08-21T00:00:00+08:00',
    endTime: '2026-09-10T23:59:59+08:00',
    type: 'L',
    img: 'https://static.example.test/campura/ads/tea-new.webp',
  },
  {
    adID: 1004,
    saleID: 2004,
    startTime: '2026-08-12T00:00:00+08:00',
    endTime: '2026-09-02T23:59:59+08:00',
    type: 'S',
    img: 'https://static.example.test/campura/ads/print-week.webp',
  },
  {
    adID: 1005,
    saleID: 2005,
    startTime: '2026-08-15T00:00:00+08:00',
    endTime: '2026-09-20T23:59:59+08:00',
    type: 'L',
    img: 'https://static.example.test/campura/ads/sports-season.webp',
  },
  {
    adID: 1006,
    saleID: 2006,
    startTime: '2026-08-23T00:00:00+08:00',
    endTime: '2026-09-01T23:59:59+08:00',
    type: 'S',
    img: 'https://static.example.test/campura/ads/bakery-night.webp',
  },
  {
    adID: 1007,
    saleID: 2007,
    startTime: '2026-08-05T00:00:00+08:00',
    endTime: '2026-08-30T23:59:59+08:00',
    type: 'S',
    img: 'https://static.example.test/campura/ads/laundry-card.webp',
  },
  {
    adID: 1008,
    saleID: 2008,
    startTime: '2026-08-25T00:00:00+08:00',
    endTime: '2026-09-18T23:59:59+08:00',
    type: 'L',
    img: 'https://static.example.test/campura/ads/photo-club.webp',
  },
]

export const saleEventRecords = [
  { saleID: 2001, productID: 3101, saleRule: '开学季咖啡第二杯半价', startTime: '2026-08-20T00:00:00+08:00', endTime: '2026-09-15T23:59:59+08:00' },
  { saleID: 2002, productID: 3201, saleRule: '新生文具套装立减 12 元', startTime: '2026-08-22T00:00:00+08:00', endTime: '2026-09-06T23:59:59+08:00' },
  { saleID: 2003, productID: 3301, saleRule: '桂花乌龙新品试饮', startTime: '2026-08-21T00:00:00+08:00', endTime: '2026-09-10T23:59:59+08:00' },
  { saleID: 2004, productID: 3401, saleRule: '打印满 20 页赠装订', startTime: '2026-08-12T00:00:00+08:00', endTime: '2026-09-02T23:59:59+08:00' },
  { saleID: 2005, productID: 3501, saleRule: '运动季全场八五折', startTime: '2026-08-15T00:00:00+08:00', endTime: '2026-09-20T23:59:59+08:00' },
  { saleID: 2006, productID: 3601, saleRule: '晚间面包任选三件 20 元', startTime: '2026-08-23T00:00:00+08:00', endTime: '2026-09-01T23:59:59+08:00' },
  { saleID: 2007, productID: null, saleRule: '洗衣储值满 100 送 15', startTime: '2026-08-05T00:00:00+08:00', endTime: '2026-08-30T23:59:59+08:00' },
  { saleID: 2008, productID: 3801, saleRule: '毕业证件照学生专享', startTime: '2026-08-25T00:00:00+08:00', endTime: '2026-09-18T23:59:59+08:00' },
]

export const mainShopRecords = [
  {
    shopID: 4001,
    shopName: '北门校园咖啡',
    shopAddress: ['北校区', '生活服务中心', '1F-08'],
    shopSlogan: '把清醒留在每一节早课之前',
    subShopsList: null,
    productsList: [3101],
    adIDs: [1001],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2001],
    schoolID: 1,
    areaID: 1,
    accountID: 5101,
  },
  {
    shopID: 4002,
    shopName: '知行文具便利店',
    shopAddress: ['主校区', '二号宿舍楼', '西侧商铺 03'],
    shopSlogan: '从第一支笔开始准备新学期',
    subShopsList: null,
    productsList: [3201],
    adIDs: [1002],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2002],
    schoolID: 1,
    areaID: 2,
    accountID: 5102,
  },
  {
    shopID: 4003,
    shopName: '一杯茶事',
    shopAddress: ['主校区', '学生餐厅', '2F-17'],
    shopSlogan: '慢一点，喝杯校园里的茶',
    subShopsList: null,
    productsList: [3301],
    adIDs: [1003],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2003],
    schoolID: 1,
    areaID: 2,
    accountID: 5103,
  },
  {
    shopID: 4004,
    shopName: '蓝图图文中心',
    shopAddress: ['主校区', '图书馆', '东侧 01'],
    shopSlogan: '让每一份作业更体面',
    subShopsList: null,
    productsList: [3401],
    adIDs: [1004],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2004],
    schoolID: 1,
    areaID: 2,
    accountID: 5104,
  },
  {
    shopID: 4005,
    shopName: '跃动体育用品',
    shopAddress: ['南校区', '体育馆', '入口右侧'],
    shopSlogan: '新学期，从一场好球开始',
    subShopsList: null,
    productsList: [3501],
    adIDs: [1005],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2005],
    schoolID: 1,
    areaID: 3,
    accountID: 5105,
  },
  {
    shopID: 4006,
    shopName: '麦香烘焙',
    shopAddress: ['北校区', '学生餐厅', '1F-05'],
    shopSlogan: '晚自习后也有刚出炉的香气',
    subShopsList: null,
    productsList: [3601],
    adIDs: [1006],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2006],
    schoolID: 1,
    areaID: 1,
    accountID: 5106,
  },
  {
    shopID: 4007,
    shopName: '轻净自助洗衣',
    shopAddress: ['主校区', '五号宿舍楼', 'B1'],
    shopSlogan: '把时间留给更重要的事',
    subShopsList: null,
    productsList: null,
    adIDs: [1007],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2007],
    schoolID: 1,
    areaID: 2,
    accountID: 5107,
  },
  {
    shopID: 4008,
    shopName: '拾光摄影工作室',
    shopAddress: ['南校区', '大学生活动中心', '203'],
    shopSlogan: '为校园里的每个重要时刻留影',
    subShopsList: null,
    productsList: [3801],
    adIDs: [1008],
    shopLogo: null,
    shopImg: null,
    saleIDs: [2008],
    schoolID: 1,
    areaID: 3,
    accountID: 5108,
  },
]

export const initialAdReviews = [
  { adID: 1001, status: 'pending', submittedAt: '2026-08-18T09:20:00+08:00', reviewedAt: null, reviewer: null, reason: '' },
  { adID: 1002, status: 'pending', submittedAt: '2026-08-18T15:45:00+08:00', reviewedAt: null, reviewer: null, reason: '' },
  { adID: 1003, status: 'pending', submittedAt: '2026-08-19T08:15:00+08:00', reviewedAt: null, reviewer: null, reason: '' },
  { adID: 1004, status: 'approved', submittedAt: '2026-08-11T14:10:00+08:00', reviewedAt: '2026-08-12T09:05:00+08:00', reviewer: '学校管理员', reason: '' },
  { adID: 1005, status: 'approved', submittedAt: '2026-08-13T11:30:00+08:00', reviewedAt: '2026-08-14T10:20:00+08:00', reviewer: '学校管理员', reason: '' },
  { adID: 1006, status: 'rejected', submittedAt: '2026-08-15T16:40:00+08:00', reviewedAt: '2026-08-16T09:30:00+08:00', reviewer: '学校管理员', reason: '素材文字过密' },
  { adID: 1007, status: 'approved', submittedAt: '2026-08-03T10:15:00+08:00', reviewedAt: '2026-08-04T13:20:00+08:00', reviewer: '学校管理员', reason: '' },
  { adID: 1008, status: 'rejected', submittedAt: '2026-08-16T13:05:00+08:00', reviewedAt: '2026-08-17T15:45:00+08:00', reviewer: '学校管理员', reason: '投放时间与校级活动冲突' },
]

export const adOrders = [
  { orderID: 'AD-260819-001', adID: 1001, packageName: '首页横幅 · 27 天', price: 620 },
  { orderID: 'AD-260819-002', adID: 1002, packageName: '信息流卡片 · 16 天', price: 220 },
  { orderID: 'AD-260819-003', adID: 1003, packageName: '首页横幅 · 21 天', price: 520 },
  { orderID: 'AD-260812-004', adID: 1004, packageName: '信息流卡片 · 22 天', price: 260 },
  { orderID: 'AD-260815-005', adID: 1005, packageName: '首页横幅 · 37 天', price: 780 },
  { orderID: 'AD-260823-006', adID: 1006, packageName: '信息流卡片 · 10 天', price: 160 },
  { orderID: 'AD-260805-007', adID: 1007, packageName: '信息流卡片 · 26 天', price: 280 },
  { orderID: 'AD-260825-008', adID: 1008, packageName: '首页横幅 · 25 天', price: 590 },
]

export const adDailyMetrics = [
  { date: '2026-08-13', submitted: 2, approved: 1, rejected: 0, pending: 1, impressions: 12480, clicks: 412 },
  { date: '2026-08-14', submitted: 3, approved: 1, rejected: 1, pending: 2, impressions: 13920, clicks: 468 },
  { date: '2026-08-15', submitted: 2, approved: 0, rejected: 1, pending: 3, impressions: 15130, clicks: 503 },
  { date: '2026-08-16', submitted: 1, approved: 1, rejected: 1, pending: 2, impressions: 14680, clicks: 487 },
  { date: '2026-08-17', submitted: 4, approved: 2, rejected: 1, pending: 3, impressions: 16820, clicks: 571 },
  { date: '2026-08-18', submitted: 3, approved: 1, rejected: 0, pending: 5, impressions: 17490, clicks: 612 },
  { date: '2026-08-19', submitted: 2, approved: 1, rejected: 1, pending: 3, impressions: 18360, clicks: 658 },
]

export const mockReferenceTime = '2026-08-19T12:00:00+08:00'

export function buildAdvertisementViewModels(reviewRecords = initialAdReviews) {
  return advertisementRecords.map((advertisement) => {
    const saleEvent = saleEventRecords.find((item) => item.saleID === advertisement.saleID)
    const mainShop = mainShopRecords.find((item) => item.adIDs?.includes(advertisement.adID))
    const review = reviewRecords.find((item) => item.adID === advertisement.adID)
    const order = adOrders.find((item) => item.adID === advertisement.adID)

    return {
      ...advertisement,
      saleEvent,
      mainShop,
      review,
      order,
      status: review?.status || 'pending',
    }
  })
}

export function buildAdDashboardStats(items, referenceTime = mockReferenceTime) {
  const referenceDate = new Date(referenceTime)
  const pendingItems = items.filter((item) => item.status === 'pending')
  const reviewedItems = items.filter((item) => item.status !== 'pending')
  const approvedItems = items.filter((item) => item.status === 'approved')
  const waitingHours = pendingItems.map((item) => (
    Math.max(0, referenceDate.getTime() - new Date(item.review?.submittedAt).getTime()) / 3_600_000
  ))
  const weekStart = new Date('2026-08-13T00:00:00+08:00')
  const processedThisWeek = reviewedItems.filter((item) => (
    item.review?.reviewedAt && new Date(item.review.reviewedAt) >= weekStart
  )).length
  const activeApprovedItems = approvedItems.filter((item) => (
    new Date(item.startTime) <= referenceDate
      && (!item.endTime || new Date(item.endTime) >= referenceDate)
  ))
  const rejectionCounts = items
    .filter((item) => item.status === 'rejected')
    .reduce((counts, item) => {
      const reason = item.review?.reason?.trim() || '未填写原因'
      counts[reason] = (counts[reason] || 0) + 1
      return counts
    }, {})

  return {
    pendingCount: pendingItems.length,
    averageWaitingHours: waitingHours.length
      ? Math.round(waitingHours.reduce((sum, value) => sum + value, 0) / waitingHours.length)
      : 0,
    approvalRate: reviewedItems.length
      ? Math.round((approvedItems.length / reviewedItems.length) * 100)
      : 0,
    processedThisWeek,
    totalRevenue: items.reduce((sum, item) => sum + (item.order?.price || 0), 0),
    activeAdsCount: activeApprovedItems.length,
    activeLargeAds: activeApprovedItems.filter((item) => item.type === 'L').length,
    activeSmallAds: activeApprovedItems.filter((item) => item.type === 'S').length,
    impressions: adDailyMetrics.reduce((sum, item) => sum + item.impressions, 0),
    clicks: adDailyMetrics.reduce((sum, item) => sum + item.clicks, 0),
    rejectionReasons: Object.entries(rejectionCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function cloneInitialAdReviews() {
  return initialAdReviews.map((review) => ({ ...review }))
}
