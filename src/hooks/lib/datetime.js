/**
 * DateTime Utility for Hooks
 * 提供北京时间 (UTC+8) 相关工具函数
 */

/**
 * 获取北京时间的 ISO 格式字符串
 * @returns {string} 格式: YYYY-MM-DDTHH:mm:ss.sss+08:00
 */
function toBeijingISOString() {
  const now = new Date();
  // 北京时间 = UTC + 8小时
  const beijingOffset = 8 * 60; // 分钟
  const localOffset = now.getTimezoneOffset(); // 本地时区偏移（分钟，东区为负）
  const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000);

  // 格式化为 ISO 格式 + 时区标识
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  const hours = String(beijingTime.getHours()).padStart(2, '0');
  const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
  const ms = String(beijingTime.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+08:00`;
}

module.exports = { toBeijingISOString };
