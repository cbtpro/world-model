export type LunarLandmarkKind = 'crater' | 'mission' | 'moment'

export interface LunarLandmark {
  /** 地标唯一标识；显示名称/坐标说明/详情文本通过 i18n 按此 id 查找 */
  id: string
  kind: LunarLandmarkKind
  latitude: number
  longitude: number
  labelOffsetY?: number
}

export const lunarLandmarks: LunarLandmark[] = [
  {
    id: 'tycho',
    kind: 'crater',
    latitude: -43.31,
    longitude: -11.36,
  },
  {
    id: 'copernicus',
    kind: 'crater',
    latitude: 9.62,
    longitude: -20.08,
  },
  {
    id: 'aristarchus',
    kind: 'crater',
    latitude: 23.7,
    longitude: -47.4,
  },
  {
    id: 'apollo-11',
    kind: 'mission',
    latitude: 0.674,
    longitude: 23.473,
  },
  {
    id: 'armstrong-footprint',
    kind: 'moment',
    latitude: 0.674,
    longitude: 23.473,
    labelOffsetY: 12,
  },
  {
    id: 'apollo-12',
    kind: 'mission',
    latitude: -3.012,
    longitude: -23.421,
  },
  {
    id: 'apollo-14',
    kind: 'mission',
    latitude: -3.645,
    longitude: -17.471,
  },
  {
    id: 'apollo-15',
    kind: 'mission',
    latitude: 26.132,
    longitude: 3.634,
  },
  {
    id: 'apollo-16',
    kind: 'mission',
    latitude: -8.973,
    longitude: 15.501,
  },
  {
    id: 'apollo-17',
    kind: 'mission',
    latitude: 20.19,
    longitude: 30.772,
  },
  {
    id: 'luna-9',
    kind: 'mission',
    latitude: 7.08,
    longitude: -64.37,
  },
  {
    id: 'luna-2',
    kind: 'mission',
    latitude: 29.1,
    longitude: 0,
  },
  {
    id: 'change-3',
    kind: 'mission',
    latitude: 44.12,
    longitude: -19.51,
  },
  {
    id: 'luna-16',
    kind: 'mission',
    latitude: -0.68,
    longitude: 56.3,
  },
  {
    id: 'luna-24',
    kind: 'mission',
    latitude: 12.75,
    longitude: 62.2,
  },
  {
    id: 'change-5',
    kind: 'mission',
    latitude: 43.06,
    longitude: -51.92,
  },
  {
    id: 'change-4',
    kind: 'mission',
    latitude: -45.457,
    longitude: 177.588,
  },
]
