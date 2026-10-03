// English language pack
import type { MessageSchema } from './zh-CN'

const messages: MessageSchema = {
  meta: {
    title: 'Universe Model Demo',
    description: 'Explore interactive 3D models of celestial bodies like the Moon and their historic landing sites.',
  },
  topBar: {
    zenEnter: 'Enter zen mode',
    zenButton: 'Zen',
  },
  language: {
    label: 'Language',
  },
  bodySelector: {
    title: 'Bodies',
  },
  variantSelector: {
    title: 'Model Variant',
  },
  infoPanel: {
    moonSource: 'Moon data source: NASA SVS #14959',
    defaultSource: 'Sun, Earth, and Moon shown together; orbital distances and model sizes are illustrative, not to scale',
  },
  controls: {
    zenExit: 'Exit zen mode',
    bodyInfo: 'Body Information',
    darkSideBrightness: 'Dark-side Brightness',
    timeSection: 'Time Simulation',
    viewSection: 'View & Location',
    lunarSites: 'Lunar Sites',

    panelLabel: 'Scene controls panel',
    title: 'Scene Controls',
    collapse: 'Collapse',
    expand: 'Expand',
    collapseAria: 'Collapse scene controls',
    expandAria: 'Expand scene controls',
    distance: 'Distance',
    zoomInAria: 'Zoom in',
    zoomOutAria: 'Zoom out',
    simulationTime: 'Simulated Time',
    pauseTime: 'Pause time',
    playTime: 'Play time',
    timelineAria: 'Simulation timeline',
    speed: 'Time Speed',
    speedUnit: '{speed}× real time',
    coordinatesLabel: '{name} live coordinates (illustrative units)',
    auxiliaryLines: 'Show auxiliary lines',
    backToNow: 'Back to now',
    resetView: 'Reset view',
    locating: 'Getting location…',
    locateButton: 'Locate me and show on Earth',
    locateNeedsHttps: 'Browser geolocation requires HTTPS or localhost',
    locateUnsupported: 'This browser does not support geolocation',
    locateSuccess: 'Located: {lat}°, {lng}°',
    locateDenied: 'Location permission denied — allow location access in your browser settings',
    locateTimeout: 'Getting location timed out, please try again',
    locateFailed: 'Could not get your location, please check device location settings',
  },
  landmarkNavigator: {
    panelLabel: 'Lunar historic landmark navigator',
    eyebrow: 'Lunar Map',
    title: 'Historic Sites',
    count: '{count} sites',
    craterGroup: 'Notable Craters',
    momentGroup: 'Historic Moments',
    missionGroup: 'Landings & Missions',
  },
  loading: {
    initScene: 'Initializing universe scene',
    initialLoad: 'Loading the Sun, Earth, and Moon',
    modelLoad: 'Loading "{name}" model',
  },
  bodies: {
    sun: {
      name: 'Sun',
      description: 'A self-contained model of the solar photosphere, shown together with Earth and the Moon',
      variants: {
        color: {
          name: 'Color Map',
          description: 'Shaded sun sphere',
        },
      },
    },
    earth: {
      name: 'Earth',
      description: 'NASA Blue Marble Earth model, shown together with the Sun and Moon',
      variants: {
        color: {
          name: 'Color Map',
          description: 'Earth color map texture',
        },
      },
    },
    moon: {
      name: 'Moon',
      description: 'NASA Lunar Reconnaissance Orbiter (LRO) 3D Moon model',
      variants: {
        color: {
          name: 'Color Map',
          description: 'COLOR MAP ONLY — lunar color texture wrapped on a sphere, no terrain relief',
        },
        grid: {
          name: 'Color + Grid',
          description: 'COLOR MAP AND GRID — color texture overlaid with latitude/longitude gridlines',
        },
        topo: {
          name: 'Color + Terrain',
          description: 'COLOR MAP AND HEIGHT MAP — color texture overlaid with a height map, showing lunar terrain relief',
        },
      },
    },
  },
  landmarks: {
    tycho: {
      name: 'Tycho Crater',
      coordinates: '43.31°S · 11.36°W',
      detail: 'A famous impact crater in the southern highlands, with bright rays extending outward from its rim.',
    },
    copernicus: {
      name: 'Copernicus Crater',
      coordinates: '9.62°N · 20.08°W',
      detail: 'A large impact crater south of Mare Imbrium, with a prominent central peak and ray system.',
    },
    aristarchus: {
      name: 'Aristarchus Crater',
      coordinates: '23.7°N · 47.4°W',
      detail: 'One of the brightest craters on the Moon, located on the Aristarchus plateau in Oceanus Procellarum.',
    },
    'apollo-11': {
      name: 'Apollo 11',
      coordinates: '0.674°N · 23.473°E',
      detail: "Humanity's first crewed Moon landing in 1969, touching down in the Sea of Tranquility.",
    },
    'armstrong-footprint': {
      name: "Armstrong's First Step",
      coordinates: 'Apollo 11 landing site (exact footprint coordinates not individually surveyed)',
      detail: "On July 20, 1969, Neil Armstrong stepped onto the lunar surface from the Eagle lander's ladder. Marked using the Apollo 11 landing site coordinates.",
    },
    'apollo-12': {
      name: 'Apollo 12',
      coordinates: '3.012°S · 23.421°W',
      detail: 'Landed in Oceanus Procellarum in 1969; the crew inspected the Surveyor 3 probe.',
    },
    'apollo-14': {
      name: 'Apollo 14',
      coordinates: '3.645°S · 17.471°W',
      detail: 'Landed at the Fra Mauro highlands in 1971.',
    },
    'apollo-15': {
      name: 'Apollo 15',
      coordinates: '26.132°N · 3.634°E',
      detail: 'First mission to carry a crewed lunar rover, landing in the Hadley–Apennine region in 1971.',
    },
    'apollo-16': {
      name: 'Apollo 16',
      coordinates: '8.973°S · 15.501°E',
      detail: 'Landed in the Descartes highlands in 1972.',
    },
    'apollo-17': {
      name: 'Apollo 17',
      coordinates: '20.19°N · 30.772°E',
      detail: 'The final crewed Moon landing of the Apollo program in 1972, at the Taurus–Littrow valley.',
    },
    'luna-9': {
      name: 'Luna 9',
      coordinates: '7.08°N · 64.37°W',
      detail: 'Achieved the first soft landing on the Moon in 1966 and transmitted images from the surface.',
    },
    'luna-2': {
      name: 'Luna 2',
      coordinates: 'Approx. 29.1°N · lunar near side',
      detail: 'The first man-made object to reach the lunar surface in 1959, impacting in the Mare Imbrium region.',
    },
    'change-3': {
      name: "Chang'e 3 / Yutu Rover",
      coordinates: 'Approx. 44.12°N · 19.51°W',
      detail: "China's first soft landing on the Moon, touching down in northern Mare Imbrium in 2013.",
    },
    'luna-16': {
      name: 'Luna 16',
      coordinates: 'Approx. 0.68°S · 56.3°E',
      detail: 'First robotic sample-return mission in 1970, collecting lunar soil and returning it to Earth from Mare Fecunditatis.',
    },
    'luna-24': {
      name: 'Luna 24',
      coordinates: 'Approx. 12.75°N · 62.2°E',
      detail: 'Collected and returned lunar soil from Mare Crisium in 1976, the last successful lunar sample-return mission before 2020.',
    },
    'change-5': {
      name: "Chang'e 5",
      coordinates: 'Approx. 43.06°N · 51.92°W',
      detail: 'Landed near Mons Rümker in Oceanus Procellarum in 2020 and completed a lunar sample return.',
    },
    'change-4': {
      name: "Chang'e 4",
      coordinates: '45.457°S · 177.588°E',
      detail: "First soft landing on the Moon's far side in 2019, inside Von Kármán crater.",
    },
  },
  orbiters: {
    lro: 'Lunar Reconnaissance Orbiter',
    kaguya: 'Kaguya (SELENE)',
    'chandrayaan-1': 'Chandrayaan-1',
  },
}

export default messages
