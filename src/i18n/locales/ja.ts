// 日本語言語パック
import type { MessageSchema } from './zh-CN'

const messages: MessageSchema = {
  meta: {
    title: '宇宙モデルデモ',
    description: '月などの天体のインタラクティブな3Dモデルと歴史的な着陸地点を探索できます。',
  },
  topBar: {
    zenEnter: '禅モードを開始',
    zenButton: '禅',
  },
  language: {
    label: '言語',
  },
  bodySelector: {
    title: '天体',
  },
  variantSelector: {
    title: 'モデルバリエーション',
  },
  infoPanel: {
    moonSource: '月のデータ出典：NASA SVS #14959',
    defaultSource: '太陽・地球・月を同じシーンに表示しています。軌道距離とモデルサイズは説明用の縮尺です',
  },
  controls: {
    orbitDemo: '公転デモ',
    daysPerSecond: '1秒あたり{days}日',
    hoursPerSecond: '1秒あたり{hours}時間',

    zenExit: '禅モードを終了',
    bodyInfo: '天体情報',
    darkSideBrightness: '暗部の明るさ',
    timeSection: '時間シミュレーション',
    viewSection: '表示と位置情報',
    lunarSites: '月の地点',

    panelLabel: 'シーン操作パネル',
    title: 'シーン操作',
    collapse: '折りたたむ',
    expand: '展開',
    collapseAria: 'シーン操作を折りたたむ',
    expandAria: 'シーン操作を展開',
    distance: '視距離',
    zoomInAria: 'ズームイン',
    zoomOutAria: 'ズームアウト',
    simulationTime: 'シミュレーション時刻',
    pauseTime: '時間を一時停止',
    playTime: '時間を再生',
    timelineAria: 'シミュレーションタイムライン',
    speed: '時間の速さ',
    speedUnit: '実時間の{speed}倍',
    coordinatesLabel: '{name}のリアルタイム座標（説明用単位）',
    auxiliaryLines: '補助線を表示',
    backToNow: '現在時刻に戻る',
    resetView: '視点をリセット',
    locating: '位置情報を取得中…',
    locateButton: '現在地を取得して地球上に表示',
    locateNeedsHttps: '位置情報の取得には HTTPS または localhost が必要です',
    locateUnsupported: 'このブラウザは位置情報の取得に対応していません',
    locateSuccess: '位置を取得しました：{lat}°, {lng}°',
    locateDenied: '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください',
    locateTimeout: '位置情報の取得がタイムアウトしました。もう一度お試しください',
    locateFailed: '現在地を取得できませんでした。端末の位置情報設定を確認してください',
  },
  landmarkNavigator: {
    panelLabel: '月の史跡ナビゲーター',
    eyebrow: '月面マップ',
    title: '史跡',
    count: '{count} 件の地点',
    craterGroup: '有名なクレーター',
    momentGroup: '歴史的瞬間',
    missionGroup: '着陸・探査ミッション',
  },
  loading: {
    initScene: '宇宙シーンを初期化しています',
    initialLoad: '太陽・地球・月を読み込み中',
    modelLoad: '「{name}」モデルを読み込み中',
  },
  bodies: {
    sun: {
      name: '太陽',
      description: '地球・月と共に表示される、独立した太陽光球モデル',
      variants: {
        color: {
          name: 'カラーマップ',
          description: '陰影付きの太陽球体',
        },
      },
    },
    earth: {
      name: '地球',
      description: '太陽・月と共に表示される NASA Blue Marble 地球モデル',
      variants: {
        color: {
          name: 'カラーマップ',
          description: '地球のカラーマップテクスチャ',
        },
      },
    },
    moon: {
      name: '月',
      description: 'NASA 月偵察衛星（LRO）による月の3Dモデル',
      variants: {
        color: {
          name: 'カラーマップ',
          description: 'COLOR MAP ONLY — 球面に貼り付けた月のカラーマップのみで、地形の起伏はありません',
        },
        grid: {
          name: 'カラー + グリッド',
          description: 'COLOR MAP AND GRID — カラーマップに経緯度グリッド線を重ねたもの',
        },
        topo: {
          name: 'カラー + 地形',
          description: 'COLOR MAP AND HEIGHT MAP — カラーマップに高度マップを重ね、月の地形起伏が見えるもの',
        },
      },
    },
  },
  landmarks: {
    tycho: {
      name: 'ティコ・クレーター',
      coordinates: '南緯43.31° · 西経11.36°',
      detail: '南部高地にある有名な衝突クレーターで、縁から外側へ明るい光条が伸びている。',
    },
    copernicus: {
      name: 'コペルニクス・クレーター',
      coordinates: '北緯9.62° · 西経20.08°',
      detail: '雨の海の南にある大型の衝突クレーターで、明瞭な中央丘と光条を持つ。',
    },
    aristarchus: {
      name: 'アリスタルコス・クレーター',
      coordinates: '北緯23.7° · 西経47.4°',
      detail: '月面で最も明るいクレーターの一つで、嵐の大洋のアリスタルコス台地に位置する。',
    },
    'apollo-11': {
      name: 'アポロ11号',
      coordinates: '北緯0.674° · 東経23.473°',
      detail: '1969年、人類初の有人月面着陸。静かの海に着陸した。',
    },
    'armstrong-footprint': {
      name: 'アームストロングの第一歩',
      coordinates: 'アポロ11号着陸地点（足跡の正確な座標は個別に測定されていない）',
      detail: '1969年7月20日、ニール・アームストロングが着陸船「イーグル」のはしごから月面に足を踏み出した。アポロ11号着陸地点の座標を使用している。',
    },
    'apollo-12': {
      name: 'アポロ12号',
      coordinates: '南緯3.012° · 西経23.421°',
      detail: '1969年、嵐の大洋に着陸。乗組員はサーベイヤー3号探査機を調査した。',
    },
    'apollo-14': {
      name: 'アポロ14号',
      coordinates: '南緯3.645° · 西経17.471°',
      detail: '1971年、フラ・マウロ高地に着陸。',
    },
    'apollo-15': {
      name: 'アポロ15号',
      coordinates: '北緯26.132° · 東経3.634°',
      detail: '1971年、有人月面車を初めて使用したミッション。ハドリー・アペニン地域に着陸。',
    },
    'apollo-16': {
      name: 'アポロ16号',
      coordinates: '南緯8.973° · 東経15.501°',
      detail: '1972年、デカルト高地に着陸。',
    },
    'apollo-17': {
      name: 'アポロ17号',
      coordinates: '北緯20.19° · 東経30.772°',
      detail: '1972年、アポロ計画最後の有人月面着陸。タウルス・リットロー渓谷に着陸。',
    },
    'luna-9': {
      name: 'ルナ9号',
      coordinates: '北緯7.08° · 西経64.37°',
      detail: '1966年、月面への初の軟着陸を達成し、月面の画像を送信した。',
    },
    'luna-2': {
      name: 'ルナ2号',
      coordinates: '北緯約29.1° · 月の表側',
      detail: '1959年、月面に到達した初の人工物。雨の海付近に衝突した。',
    },
    'change-3': {
      name: '嫦娥3号／玉兎号',
      coordinates: '北緯約44.12° · 西経約19.51°',
      detail: '2013年、雨の海北部に着陸。中国初の月面軟着陸ミッション。',
    },
    'luna-16': {
      name: 'ルナ16号',
      coordinates: '南緯約0.68° · 東経約56.3°',
      detail: '1970年、無人探査機として初めて月の土壌を自動採取し地球に持ち帰った。豊かの海に着陸。',
    },
    'luna-24': {
      name: 'ルナ24号',
      coordinates: '北緯約12.75° · 東経約62.2°',
      detail: '1976年、危機の海で土壌を採取し地球に持ち帰った。2020年以前では最後の月サンプルリターン成功例。',
    },
    'change-5': {
      name: '嫦娥5号',
      coordinates: '北緯約43.06° · 西経約51.92°',
      detail: '2020年、嵐の大洋のリュムケル山付近に着陸し、月のサンプルリターンを完了した。',
    },
    'change-4': {
      name: '嫦娥4号',
      coordinates: '南緯45.457° · 東経177.588°',
      detail: '2019年、月の裏側への初の軟着陸を達成。フォン・カルマン・クレーター内に着陸。',
    },
  },
  orbiters: {
    lro: '月偵察衛星（LRO）',
    kaguya: 'かぐや（SELENE）',
    'chandrayaan-1': 'チャンドラヤーン1号',
  },
}

export default messages
