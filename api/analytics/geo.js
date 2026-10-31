// ip2region xdb v2 离线查询：整个文件读进内存（~11MB），每次查询微秒级
// 数据来源：lionsoul2014/ip2region（Apache-2.0），xdb 文件部署在 data/ 目录、不进 git
//
// 查询结果格式：国家|区域|省份|城市|ISP，如「中国|0|广东省|深圳|电信」
// 我们只取省份（海外取国家），不做更细粒度的定位。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_XDB = process.env.ANALYTICS_XDB || path.join(__dirname, '..', '..', 'data', 'ip2region.xdb');

const VECTOR_BASE = 256;
const SEGMENT_BASE = VECTOR_BASE + 256 * 256 * 8;
const SEGMENT_SIZE = 14;

let buf = null;

export function initGeo(dbPath = DEFAULT_XDB) {
  buf = null;
  try {
    const b = fs.readFileSync(dbPath);
    const version = b.readUInt16LE(0);
    if (version !== 2) {
      console.warn(`[geo] ip2region xdb 版本为 ${version}，当前只支持 v2，省份解析不可用`);
      return { ok: false, version };
    }
    buf = b;
    console.log(`[geo] ip2region 已加载：${(buf.length / 1024 / 1024).toFixed(1)}MB，${dbPath}`);
    return { ok: true, version: 2 };
  } catch (e) {
    console.warn(`[geo] 未能加载 ip2region.xdb（${e.message}），省份解析不可用`);
    return { ok: false };
  }
}

function ipToU32(ip) {
  const seg = String(ip || '').split('.');
  if (seg.length !== 4) return null;
  let n = 0;
  for (const x of seg) {
    const v = Number(x);
    if (!Number.isInteger(v) || v < 0 || v > 255 || !/^\d+$/.test(x)) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

/** 原始查询，返回「国家|区域|省|市|ISP」或空串 */
export function lookup(ip) {
  if (!buf) return '';
  const n = ipToU32(ip);
  if (n === null) return '';

  const il0 = (n >>> 24) & 0xff;
  const il1 = (n >>> 16) & 0xff;
  const vOff = VECTOR_BASE + (il0 * 256 + il1) * 8;
  const sPtr = buf.readUInt32LE(vOff);
  const ePtr = buf.readUInt32LE(vOff + 4);
  if (sPtr === 0 || ePtr < sPtr) return '';

  let low = 0;
  let high = Math.floor((ePtr - sPtr) / SEGMENT_SIZE);
  let hitOff = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const off = sPtr + mid * SEGMENT_SIZE;
    const sip = buf.readUInt32LE(off);
    if (n < sip) {
      high = mid - 1;
      continue;
    }
    const eip = buf.readUInt32LE(off + 4);
    if (n > eip) {
      low = mid + 1;
      continue;
    }
    hitOff = off;
    break;
  }
  if (hitOff < 0) return '';

  const dataLen = buf.readUInt16LE(hitOff + 8);
  const dataPtr = buf.readUInt32LE(hitOff + 10);
  if (!dataLen || dataPtr + dataLen > buf.length) return '';
  return buf.toString('utf8', dataPtr, dataPtr + dataLen);
}

/** 只取省份；海外取国家；查不到归「未知」 */
export function provinceOf(ip) {
  const region = lookup(ip);
  if (!region) return '未知';
  const [country = '', , prov = ''] = region.split('|');
  if (country && country !== '中国') return country;
  return prov || country || '未知';
}
