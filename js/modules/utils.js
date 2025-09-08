// --- 通用工具函数 ---

/**
 * @description 返回设置为本地 00:00:00 的日期副本
 * @param {Date|string|number} dateLike - 可被 Date 构造的值
 * @returns {Date}
 */
export function normalizeDate(dateLike) {
    const d = new Date(dateLike);
    const copy = new Date(d.getTime());
    copy.setHours(0, 0, 0, 0);
    return copy;
}

/**
 * @description 判断 ISO 日期字符串是否已过期（基于本地日期，截止日 < 今天）
 * @param {string|null|undefined} iso - 形如 YYYY-MM-DD 的日期或可被 Date 解析的字符串
 * @returns {boolean}
 */
export function isOverdueISO(iso) {
    if (!iso) return false;
    const today = normalizeDate(new Date());
    const due = normalizeDate(iso);
    return due.getTime() < today.getTime();
}

/**
 * @description 判断 ISO 日期字符串是否在接下来 N 天内（包含今天与第 N 天）
 * @param {string|null|undefined} iso
 * @param {number} days
 * @returns {boolean}
 */
export function isWithinNextDaysISO(iso, days) {
    if (!iso) return false;
    const today = normalizeDate(new Date());
    const end = normalizeDate(new Date());
    end.setDate(end.getDate() + days);
    const due = normalizeDate(iso);
    return due.getTime() >= today.getTime() && due.getTime() <= end.getTime();
}

