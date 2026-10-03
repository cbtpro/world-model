// 简体中文语言包（默认/基准语言，其余语言包需与此结构保持一致）
const messages = {
  meta: {
    title: '宇宙星体模型演示',
    description: '探索月球等天体的交互式 3D 模型与历史地点。',
  },
  topBar: {
    zenEnter: '开启禅模式',
    zenButton: '禅',
  },
  language: {
    label: '语言',
  },
  bodySelector: {
    title: '天体',
  },
  variantSelector: {
    title: '模型变体',
  },
  infoPanel: {
    moonSource: '月球数据来源：NASA SVS #14959',
    defaultSource: '太阳、地球与月球同场景展示；轨道距离与模型大小为教学示意比例',
  },
  controls: {
    zenExit: '退出禅模式',
    bodyInfo: '天体信息',
    darkSideBrightness: '暗部亮度',
    timeSection: '时间模拟',
    viewSection: '视图与定位',
    lunarSites: '月球地点',

    panelLabel: '场景控制面板',
    title: '场景控制',
    collapse: '折叠',
    expand: '展开',
    collapseAria: '折叠场景控制',
    expandAria: '展开场景控制',
    distance: '视距',
    zoomInAria: '拉近视角',
    zoomOutAria: '拉远视角',
    simulationTime: '模拟时间',
    pauseTime: '暂停时间',
    playTime: '播放时间',
    timelineAria: '模拟时间轴',
    speed: '时间流速',
    speedUnit: '{speed}× 现实时间',
    coordinatesLabel: '{name}实时坐标（示意单位）',
    auxiliaryLines: '显示辅助线',
    backToNow: '回到当前时间',
    resetView: '重置视角',
    locating: '正在获取位置…',
    locateButton: '定位当前位置并显示在地球',
    locateNeedsHttps: '浏览器定位需要 HTTPS 或 localhost 页面',
    locateUnsupported: '此浏览器不支持获取当前位置',
    locateSuccess: '已定位：{lat}°, {lng}°',
    locateDenied: '定位权限被拒绝，请在浏览器设置中允许访问位置',
    locateTimeout: '获取位置超时，请重试',
    locateFailed: '无法获取当前位置，请检查设备定位设置',
  },
  landmarkNavigator: {
    panelLabel: '月球历史地点导航',
    eyebrow: '月球地图',
    title: '历史地点',
    count: '{count} 个地点',
    craterGroup: '著名环形山',
    momentGroup: '历史瞬间',
    missionGroup: '登月与探测',
  },
  loading: {
    initScene: '初始化宇宙场景',
    initialLoad: '加载太阳、地球与月球',
    modelLoad: '加载「{name}」模型',
  },
  bodies: {
    sun: {
      name: '太阳',
      description: '自包含的太阳光球模型，与地球、月球共同展示',
      variants: {
        color: {
          name: '颜色贴图',
          description: '太阳着色球体',
        },
      },
    },
    earth: {
      name: '地球',
      description: 'NASA Blue Marble 地球模型，与太阳、月球共同展示',
      variants: {
        color: {
          name: '颜色贴图',
          description: '地球颜色贴图',
        },
      },
    },
    moon: {
      name: '月球',
      description: 'NASA Lunar Reconnaissance Orbiter (LRO) 月球 3D 模型',
      variants: {
        color: {
          name: '颜色贴图',
          description: 'COLOR MAP ONLY — 月球颜色贴图包裹于球面，无地形起伏',
        },
        grid: {
          name: '颜色 + 网格',
          description: 'COLOR MAP AND GRID — 颜色贴图叠加经纬度网格线',
        },
        topo: {
          name: '颜色 + 地形',
          description: 'COLOR MAP AND HEIGHT MAP — 颜色贴图叠加高度图，可见月球地形起伏',
        },
      },
    },
  },
  landmarks: {
    tycho: {
      name: '第谷环形山',
      coordinates: '南纬 43.31° · 西经 11.36°',
      detail: '南部高地著名撞击坑，明亮的辐射纹从坑缘向外延伸。',
    },
    copernicus: {
      name: '哥白尼环形山',
      coordinates: '北纬 9.62° · 西经 20.08°',
      detail: '雨海以南的大型撞击坑，拥有明显的中央峰和辐射纹。',
    },
    aristarchus: {
      name: '阿里斯塔克环形山',
      coordinates: '北纬 23.7° · 西经 47.4°',
      detail: '月面最明亮的撞击坑之一，位于风暴洋高原。',
    },
    'apollo-11': {
      name: '阿波罗 11 号',
      coordinates: '北纬 0.674° · 东经 23.473°',
      detail: '1969 年人类首次载人登月，着陆于静海。',
    },
    'armstrong-footprint': {
      name: '阿姆斯特朗的第一步',
      coordinates: '阿波罗 11 号着陆区（具体脚印坐标未单独测定）',
      detail: '1969 年 7 月 20 日，尼尔·阿姆斯特朗在鹰号登月舱梯脚踏上月面。标记使用阿波罗 11 号着陆区坐标。',
    },
    'apollo-12': {
      name: '阿波罗 12 号',
      coordinates: '南纬 3.012° · 西经 23.421°',
      detail: '1969 年着陆于风暴洋，宇航员勘察了勘测者 3 号探测器。',
    },
    'apollo-14': {
      name: '阿波罗 14 号',
      coordinates: '南纬 3.645° · 西经 17.471°',
      detail: '1971 年着陆于弗拉·毛罗高地。',
    },
    'apollo-15': {
      name: '阿波罗 15 号',
      coordinates: '北纬 26.132° · 东经 3.634°',
      detail: '1971 年首次执行载人月球车任务，着陆于哈德利-亚平宁地区。',
    },
    'apollo-16': {
      name: '阿波罗 16 号',
      coordinates: '南纬 8.973° · 东经 15.501°',
      detail: '1972 年着陆于笛卡尔高地。',
    },
    'apollo-17': {
      name: '阿波罗 17 号',
      coordinates: '北纬 20.19° · 东经 30.772°',
      detail: '1972 年阿波罗计划最后一次载人登月，着陆于陶拉斯-利特罗山谷。',
    },
    'luna-9': {
      name: '月球 9 号',
      coordinates: '北纬 7.08° · 西经 64.37°',
      detail: '1966 年首次实现月面软着陆，并传回月面图像。',
    },
    'luna-2': {
      name: '月球 2 号',
      coordinates: '北纬约 29.1° · 月面正面',
      detail: '1959 年首个抵达月球表面的人造探测器，撞击于雨海区域。',
    },
    'change-3': {
      name: '嫦娥三号 / 玉兔一号',
      coordinates: '北纬约 44.12° · 西经约 19.51°',
      detail: '2013 年着陆于雨海北部，是中国首次月面软着陆任务。',
    },
    'luna-16': {
      name: '月球 16 号',
      coordinates: '南纬约 0.68° · 东经约 56.3°',
      detail: '1970 年首次由无人探测器自动采集月壤并返回地球，着陆于丰富海。',
    },
    'luna-24': {
      name: '月球 24 号',
      coordinates: '北纬约 12.75° · 东经约 62.2°',
      detail: '1976 年在危海区域采样并返回月壤，是 2020 年前最后一次成功月球采样返回任务。',
    },
    'change-5': {
      name: '嫦娥五号',
      coordinates: '北纬约 43.06° · 西经约 51.92°',
      detail: '2020 年着陆于风暴洋吕姆克山脉附近，并完成月球采样返回。',
    },
    'change-4': {
      name: '嫦娥四号',
      coordinates: '南纬 45.457° · 东经 177.588°',
      detail: '2019 年首次实现月球背面软着陆，位于冯·卡门撞击坑内。',
    },
  },
  orbiters: {
    lro: '月球勘测轨道飞行器',
    kaguya: '月球女神（SELENE）',
    'chandrayaan-1': '月船一号',
  },
}

export default messages
export type MessageSchema = typeof messages
