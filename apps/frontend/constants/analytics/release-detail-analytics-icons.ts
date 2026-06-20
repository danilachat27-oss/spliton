/** Custom Spliton illustrations for release detail empty / sparse states. */
const BASE = "/images/ИКОНКИ/spliton_release_analytics_icons_named_10";

export const RELEASE_DETAIL_ANALYTICS_ICONS = {
  secondaryEmpty: `${BASE}/01_secondary_empty.png`,
  payoutsEmpty: `${BASE}/02_payouts_empty.png`,
  dataRoomEmpty: `${BASE}/03_data_room_empty.png`,
  chartEmpty: `${BASE}/04_chart_empty.png`,
  chartOnePoint: `${BASE}/05_chart_one_point.png`,
  videoNone: `${BASE}/06_video_none.png`,
  videoProcessing: `${BASE}/07_video_processing.png`,
  soldOutPulse: `${BASE}/08_sold_out_pulse.png`,
  guestPulse: `${BASE}/09_guest_pulse.png`,
  holderPulse: `${BASE}/10_holder_pulse.png`,
} as const;

export type ReleaseDetailAnalyticsIconKey = keyof typeof RELEASE_DETAIL_ANALYTICS_ICONS;
