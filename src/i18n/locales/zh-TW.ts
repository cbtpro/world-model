// 繁體中文语言包
import type { MessageSchema } from './zh-CN'

const messages: MessageSchema = {
  meta: {
    title: '宇宙星體模型演示',
    description: '探索月球等天體的互動式 3D 模型與歷史地點。',
  },
  topBar: {
    zenEnter: '開啟禪模式',
    zenButton: '禪',
  },
  language: {
    label: '語言',
  },
  bodySelector: {
    title: '天體',
  },
  variantSelector: {
    title: '模型變體',
  },
  infoPanel: {
    moonSource: '月球數據來源：NASA SVS #14959',
    defaultSource: '太陽、地球與月球同場景展示；軌道距離與模型大小為教學示意比例',
  },
  controls: {
    zenExit: '退出禪模式',
    bodyInfo: '天體資訊',
    darkSideBrightness: '暗部亮度',
    timeSection: '時間模擬',
    viewSection: '視圖與定位',
    lunarSites: '月球地點',

    panelLabel: '場景控制面板',
    title: '場景控制',
    collapse: '折疊',
    expand: '展開',
    collapseAria: '折疊場景控制',
    expandAria: '展開場景控制',
    distance: '視距',
    zoomInAria: '拉近視角',
    zoomOutAria: '拉遠視角',
    simulationTime: '模擬時間',
    pauseTime: '暫停時間',
    playTime: '播放時間',
    timelineAria: '模擬時間軸',
    speed: '時間流速',
    speedUnit: '{speed}× 現實時間',
    coordinatesLabel: '{name}即時座標（示意單位）',
    auxiliaryLines: '顯示輔助線',
    backToNow: '回到目前時間',
    resetView: '重置視角',
    locating: '正在取得位置…',
    locateButton: '定位目前位置並顯示在地球',
    locateNeedsHttps: '瀏覽器定位需要 HTTPS 或 localhost 頁面',
    locateUnsupported: '此瀏覽器不支援取得目前位置',
    locateSuccess: '已定位：{lat}°, {lng}°',
    locateDenied: '定位權限被拒絕，請在瀏覽器設定中允許存取位置',
    locateTimeout: '取得位置逾時，請重試',
    locateFailed: '無法取得目前位置，請檢查裝置定位設定',
  },
  landmarkNavigator: {
    panelLabel: '月球歷史地點導航',
    eyebrow: '月球地圖',
    title: '歷史地點',
    count: '{count} 個地點',
    craterGroup: '著名環形山',
    momentGroup: '歷史瞬間',
    missionGroup: '登月與探測',
  },
  loading: {
    initScene: '初始化宇宙場景',
    initialLoad: '載入太陽、地球與月球',
    modelLoad: '載入「{name}」模型',
  },
  bodies: {
    sun: {
      name: '太陽',
      description: '自包含的太陽光球模型，與地球、月球共同展示',
      variants: {
        color: {
          name: '顏色貼圖',
          description: '太陽著色球體',
        },
      },
    },
    earth: {
      name: '地球',
      description: 'NASA Blue Marble 地球模型，與太陽、月球共同展示',
      variants: {
        color: {
          name: '顏色貼圖',
          description: '地球顏色貼圖',
        },
      },
    },
    moon: {
      name: '月球',
      description: 'NASA Lunar Reconnaissance Orbiter (LRO) 月球 3D 模型',
      variants: {
        color: {
          name: '顏色貼圖',
          description: 'COLOR MAP ONLY — 月球顏色貼圖包覆於球面，無地形起伏',
        },
        grid: {
          name: '顏色 + 網格',
          description: 'COLOR MAP AND GRID — 顏色貼圖疊加經緯度網格線',
        },
        topo: {
          name: '顏色 + 地形',
          description: 'COLOR MAP AND HEIGHT MAP — 顏色貼圖疊加高度圖，可見月球地形起伏',
        },
      },
    },
  },
  landmarks: {
    tycho: {
      name: '第谷環形山',
      coordinates: '南緯 43.31° · 西經 11.36°',
      detail: '南部高地著名撞擊坑，明亮的輻射紋從坑緣向外延伸。',
    },
    copernicus: {
      name: '哥白尼環形山',
      coordinates: '北緯 9.62° · 西經 20.08°',
      detail: '雨海以南的大型撞擊坑，擁有明顯的中央峰和輻射紋。',
    },
    aristarchus: {
      name: '阿里斯塔克環形山',
      coordinates: '北緯 23.7° · 西經 47.4°',
      detail: '月面最明亮的撞擊坑之一，位於風暴洋高原。',
    },
    'apollo-11': {
      name: '阿波羅 11 號',
      coordinates: '北緯 0.674° · 東經 23.473°',
      detail: '1969 年人類首次載人登月，著陸於靜海。',
    },
    'armstrong-footprint': {
      name: '阿姆斯壯的第一步',
      coordinates: '阿波羅 11 號著陸區（具體腳印座標未單獨測定）',
      detail: '1969 年 7 月 20 日，尼爾·阿姆斯壯在鷹號登月艙梯腳踏上月面。標記使用阿波羅 11 號著陸區座標。',
    },
    'apollo-12': {
      name: '阿波羅 12 號',
      coordinates: '南緯 3.012° · 西經 23.421°',
      detail: '1969 年著陸於風暴洋，太空人勘察了測量者 3 號探測器。',
    },
    'apollo-14': {
      name: '阿波羅 14 號',
      coordinates: '南緯 3.645° · 西經 17.471°',
      detail: '1971 年著陸於弗拉·毛羅高地。',
    },
    'apollo-15': {
      name: '阿波羅 15 號',
      coordinates: '北緯 26.132° · 東經 3.634°',
      detail: '1971 年首次執行載人月球車任務，著陸於哈德利-亞平寧地區。',
    },
    'apollo-16': {
      name: '阿波羅 16 號',
      coordinates: '南緯 8.973° · 東經 15.501°',
      detail: '1972 年著陸於笛卡兒高地。',
    },
    'apollo-17': {
      name: '阿波羅 17 號',
      coordinates: '北緯 20.19° · 東經 30.772°',
      detail: '1972 年阿波羅計畫最後一次載人登月，著陸於陶拉斯-利特羅山谷。',
    },
    'luna-9': {
      name: '月球 9 號',
      coordinates: '北緯 7.08° · 西經 64.37°',
      detail: '1966 年首次實現月面軟著陸，並傳回月面影像。',
    },
    'luna-2': {
      name: '月球 2 號',
      coordinates: '北緯約 29.1° · 月面正面',
      detail: '1959 年首個抵達月球表面的人造探測器，撞擊於雨海區域。',
    },
    'change-3': {
      name: '嫦娥三號 / 玉兔一號',
      coordinates: '北緯約 44.12° · 西經約 19.51°',
      detail: '2013 年著陸於雨海北部，是中國首次月面軟著陸任務。',
    },
    'luna-16': {
      name: '月球 16 號',
      coordinates: '南緯約 0.68° · 東經約 56.3°',
      detail: '1970 年首次由無人探測器自動採集月壤並返回地球，著陸於豐富海。',
    },
    'luna-24': {
      name: '月球 24 號',
      coordinates: '北緯約 12.75° · 東經約 62.2°',
      detail: '1976 年在危海區域採樣並返回月壤，是 2020 年前最後一次成功月球採樣返回任務。',
    },
    'change-5': {
      name: '嫦娥五號',
      coordinates: '北緯約 43.06° · 西經約 51.92°',
      detail: '2020 年著陸於風暴洋呂姆克山脈附近，並完成月球採樣返回。',
    },
    'change-4': {
      name: '嫦娥四號',
      coordinates: '南緯 45.457° · 東經 177.588°',
      detail: '2019 年首次實現月球背面軟著陸，位於馮·卡門撞擊坑內。',
    },
  },
  orbiters: {
    lro: '月球勘測軌道飛行器',
    kaguya: '輝夜姬號（SELENE）',
    'chandrayaan-1': '月船一號',
  },
}

export default messages
