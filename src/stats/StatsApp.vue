<template>
  <div class="page">
    <!-- 登录 -->
    <div v-if="!authed" class="login-wrap">
      <form class="login-card" @submit.prevent="login">
        <div class="login-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <h1>访问数据看板</h1>
        <p class="muted">zhengyun.online · 仅站主可查看</p>
        <input v-model="password" type="password" placeholder="访问密码" autocomplete="current-password" />
        <button type="submit" :disabled="loading || !password">{{ loading ? '验证中…' : '进入看板' }}</button>
        <p v-if="error" class="err">{{ error }}</p>
        <p class="tip">数据来源：服务器访问日志，已过滤爬虫与扫描器；完整 IP 仅短期保留，用于识别回访与安全分析</p>
      </form>
    </div>

    <!-- 看板 -->
    <div v-else class="board">
      <header class="head">
        <div>
          <h1>访问数据</h1>
          <p class="muted">
            zhengyun.online
            <span v-if="data?.coverage?.firstDay"> · 数据区间 {{ data.coverage.firstDay }} 至 {{ data.coverage.lastDay }}</span>
          </p>
        </div>
        <div class="head-actions">
          <div class="seg">
            <button v-for="r in [7, 30, 90]" :key="r" :class="{ on: range === r }" @click="setRange(r)">
              {{ r }} 天
            </button>
          </div>
          <button class="ghost" :disabled="refreshing" @click="refresh">{{ refreshing ? '刷新中…' : '刷新' }}</button>
          <button class="ghost" @click="logout">退出</button>
        </div>
      </header>

      <p v-if="error" class="err">{{ error }}</p>

      <!-- 指标卡 -->
      <section class="cards">
        <div class="card">
          <p class="label">今日访问量</p>
          <p class="num">{{ cards.todayPv }}</p>
          <p class="delta" :class="deltaClass">{{ deltaText }}</p>
        </div>
        <div class="card">
          <p class="label">今日访客</p>
          <p class="num">{{ cards.todayUv }}</p>
          <p class="hint">按 IP+浏览器去重</p>
        </div>
        <div class="card">
          <p class="label">近 {{ range }} 天</p>
          <p class="num">{{ cards.rangePv }}<span class="unit">PV</span></p>
          <p class="hint">{{ cards.rangeUv }} 位访客</p>
        </div>
        <div class="card">
          <p class="label">累计 / 已拦截</p>
          <p class="num">{{ cards.totalPv }}<span class="unit">PV</span></p>
          <p class="hint">{{ cards.bots }} 次爬虫与扫描</p>
        </div>
      </section>

      <!-- 趋势 -->
      <section class="panel">
        <div class="panel-head">
          <h2>访问趋势</h2>
          <div class="legend">
            <span><i class="dot pv"></i>PV 访问量</span>
            <span><i class="dot uv"></i>UV 访客数</span>
          </div>
        </div>
        <div ref="trendEl" class="chart chart-trend"></div>
      </section>

      <div class="cols">
        <section class="panel">
          <div class="panel-head"><h2>来源渠道</h2></div>
          <div ref="sourceEl" class="chart chart-sm"></div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>设备分布</h2></div>
          <div ref="deviceEl" class="chart chart-sm"></div>
        </section>
      </div>

      <div class="cols">
        <section class="panel">
          <div class="panel-head"><h2>热门页面</h2></div>
          <div ref="pageEl" class="chart" :style="{ height: pageChartHeight }"></div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>浏览器与系统</h2></div>
          <div ref="browserEl" class="chart" :style="{ height: pageChartHeight }"></div>
        </section>
      </div>

      <div class="cols">
        <section class="panel">
          <div class="panel-head"><h2>外部来源域名</h2></div>
          <ul v-if="data?.referers?.length" class="list">
            <li v-for="r in data.referers" :key="r.name">
              <span class="name">{{ r.name }}</span><span class="val">{{ r.value }}</span>
            </li>
          </ul>
          <p v-else class="empty">暂无外部链接来源</p>
        </section>
        <section class="panel">
          <div class="panel-head">
            <h2>实时访客</h2>
            <div class="head-tools">
              <span class="live">最近 20 条</span>
              <button class="mini" @click="showFullIp = !showFullIp">
                {{ showFullIp ? '隐藏 IP' : '显示完整 IP' }}
              </button>
            </div>
          </div>
          <div v-if="data?.recent?.length" class="recent">
            <div class="row head-row">
              <span>时间</span><span>来源 IP</span><span>页面</span><span>来源</span><span>设备</span>
            </div>
            <div v-for="(v, i) in data.recent" :key="i" class="row">
              <span class="t">{{ (v.t || '').slice(5) }}</span>
              <span class="ip">{{ showFullIp ? (v.ip || '—') : maskIp(v.ip) }}</span>
              <span class="trunc">{{ v.page }}</span>
              <span>{{ v.source }}</span>
              <span class="trunc">{{ v.device }} · {{ v.browser }}</span>
            </div>
          </div>
          <p v-else class="empty">还没有访客记录（日志采集每 10 分钟一次）</p>
        </section>
      </div>

      <footer class="foot">
        数据每 10 分钟从访问日志增量汇总一次 · 完整 IP 仅保留最近 200 条实时记录，用于识别回访与安全分析
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const GREEN = '#0F6E56';
const GREEN_LIGHT = '#5DCAA5';
const BLUE = '#378ADD';
const AMBER = '#BA7517';
const GRAY = '#888780';
const PALETTE = [GREEN, BLUE, AMBER, GREEN_LIGHT, '#7F77DD', GRAY, '#D4537E'];

const authed = ref(false);
const password = ref('');
const loading = ref(false);
const refreshing = ref(false);
const error = ref('');
const range = ref(30);
const data = ref(null);
const showFullIp = ref(false);

// 默认掩码：IPv4 隐藏最后一段，IPv6 隐藏后 4 组
function maskIp(ip) {
  if (!ip) return '—';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}:****`;
  }
  const seg = ip.split('.');
  if (seg.length === 4) return `${seg[0]}.${seg[1]}.${seg[2]}.*`;
  return ip;
}

const trendEl = ref(null);
const sourceEl = ref(null);
const deviceEl = ref(null);
const pageEl = ref(null);
const browserEl = ref(null);
const charts = {};

const cards = computed(() => data.value?.cards || {});
const deltaText = computed(() => {
  const t = cards.value.todayPv || 0;
  const y = cards.value.yesterdayPv || 0;
  if (!y) return t ? '昨日暂无记录' : '暂无数据';
  const d = Math.round(((t - y) / y) * 100);
  return `${d >= 0 ? '↑' : '↓'} ${Math.abs(d)}% 环比昨日`;
});
const deltaClass = computed(() => {
  const t = cards.value.todayPv || 0;
  const y = cards.value.yesterdayPv || 0;
  if (!y) return '';
  return t >= y ? 'up' : 'down';
});
const pageChartHeight = computed(() => {
  const n = Math.max(data.value?.pages?.length || 0, data.value?.browsers?.length || 0, 4);
  return `${Math.max(180, n * 32 + 40)}px`;
});

async function api(path, options = {}) {
  const res = await fetch(`/api/stats${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `请求失败（${res.status}）`);
  return json;
}

async function login() {
  error.value = '';
  loading.value = true;
  try {
    await api('/login', { method: 'POST', body: JSON.stringify({ password: password.value }) });
    authed.value = true;
    password.value = '';
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function logout() {
  await api('/logout', { method: 'POST' }).catch(() => {});
  authed.value = false;
  data.value = null;
}

async function load() {
  try {
    data.value = await api(`/summary?days=${range.value}`);
    await nextTick();
    render();
  } catch (e) {
    error.value = e.message;
    if (/登录/.test(e.message)) authed.value = false;
  }
}

async function refresh() {
  refreshing.value = true;
  error.value = '';
  try {
    await api('/collect', { method: 'POST' });
    data.value = await api(`/summary?days=${range.value}`);
    await nextTick();
    render();
  } catch (e) {
    error.value = e.message;
  } finally {
    refreshing.value = false;
  }
}

function setRange(r) {
  range.value = r;
  load();
}

function mount(key, el) {
  if (!el) return null;
  if (!charts[key]) charts[key] = echarts.init(el);
  return charts[key];
}

function render() {
  if (!data.value) return;
  const d = data.value;

  const trend = mount('trend', trendEl.value);
  trend?.setOption({
    grid: { left: 40, right: 16, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: d.trend.map((p) => p.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11, interval: Math.ceil(d.trend.length / 10) }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        data: d.trend.map((p) => p.pv),
        itemStyle: { color: GREEN },
        areaStyle: { color: 'rgba(15,110,86,0.10)' },
        lineStyle: { width: 2 }
      },
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        symbolSize: 4,
        data: d.trend.map((p) => p.uv),
        itemStyle: { color: BLUE },
        lineStyle: { width: 1.5, type: 'dashed' }
      }
    ]
  });

  const donut = (el, key, items) => {
    const c = mount(key, el);
    c?.setOption({
      color: PALETTE,
      tooltip: { trigger: 'item', formatter: '{b}：{c} 次（{d}%）' },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#4b5563' } },
      series: [
        {
          type: 'pie',
          radius: ['48%', '70%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          label: { show: false },
          data: (items || []).map((i) => ({ name: i.name, value: i.value }))
        }
      ]
    });
  };

  donut(sourceEl.value, 'source', d.sources);
  donut(deviceEl.value, 'device', d.devices);

  const hbar = (el, key, items, color) => {
    const c = mount(key, el);
    const rows = (items || []).slice().reverse();
    c?.setOption({
      grid: { left: 96, right: 24, top: 10, bottom: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#9ca3af', fontSize: 11 }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
      yAxis: {
        type: 'category',
        data: rows.map((i) => i.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 12 }
      },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          data: rows.map((i) => i.value),
          itemStyle: { color, borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', color: '#6b7280', fontSize: 11 }
        }
      ]
    });
  };

  hbar(pageEl.value, 'page', d.pages, GREEN);
  hbar(browserEl.value, 'browser', d.browsers, BLUE);
}

const onResize = () => Object.values(charts).forEach((c) => c.resize());

onMounted(async () => {
  window.addEventListener('resize', onResize);
  try {
    const s = await api('/session');
    if (s.authenticated) {
      authed.value = true;
      await load();
    }
  } catch {
    /* 未登录就停在登录页 */
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  Object.values(charts).forEach((c) => c.dispose());
});

watch(range, () => nextTick(render));
</script>

<style>
:root {
  --ink: #111827;
  --muted: #6b7280;
  --line: #e9ecef;
  --bg: #f7f9f8;
  --green: #0f6e56;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Inter', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
.page { min-height: 100vh; }

.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.login-card {
  width: 100%; max-width: 380px; background: #fff; border: 1px solid var(--line);
  border-radius: 24px; padding: 36px 32px; text-align: center;
}
.login-icon {
  width: 56px; height: 56px; margin: 0 auto 18px; border-radius: 50%;
  background: #e8f5f0; color: var(--green); display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.login-card h1 { font-size: 20px; margin: 0 0 6px; font-weight: 600; }
.login-card .muted { font-size: 13px; color: var(--muted); margin: 0 0 22px; }
.login-card input {
  width: 100%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px;
  font-size: 14px; outline: none; margin-bottom: 12px; background: #fbfdfc;
}
.login-card input:focus { border-color: var(--green); background: #fff; }
.login-card button {
  width: 100%; padding: 12px; border: none; border-radius: 12px; background: var(--green);
  color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity .15s;
}
.login-card button:disabled { opacity: .5; cursor: not-allowed; }
.login-card .tip { font-size: 11px; color: #9ca3af; line-height: 1.7; margin: 18px 0 0; }
.err { color: #b91c1c; font-size: 13px; margin: 12px 0 0; }

.board { max-width: 1200px; margin: 0 auto; padding: 28px 20px 48px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
.head h1 { font-size: 22px; margin: 0 0 4px; font-weight: 600; }
.muted { color: var(--muted); font-size: 13px; margin: 0; }
.head-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.seg { display: flex; background: #fff; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.seg button {
  border: none; background: transparent; padding: 7px 14px; font-size: 13px; cursor: pointer; color: var(--muted);
}
.seg button.on { background: var(--green); color: #fff; }
.ghost {
  border: 1px solid var(--line); background: #fff; color: #374151; border-radius: 10px;
  padding: 7px 14px; font-size: 13px; cursor: pointer;
}
.ghost:hover { border-color: #cbd5d1; }
.ghost:disabled { opacity: .6; cursor: default; }

.cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 16px 18px; }
.card .label { font-size: 12px; color: var(--muted); margin: 0 0 8px; }
.card .num { font-size: 26px; font-weight: 600; margin: 0; line-height: 1.2; }
.card .unit { font-size: 12px; font-weight: 400; color: var(--muted); margin-left: 4px; }
.card .hint { font-size: 11px; color: #9ca3af; margin: 6px 0 0; }
.card .delta { font-size: 11px; margin: 6px 0 0; color: var(--muted); }
.card .delta.up { color: #3b6d11; }
.card .delta.down { color: #b91c1c; }

.panel { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 16px 18px; margin-bottom: 16px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.panel-head h2 { font-size: 14px; font-weight: 600; margin: 0; }
.legend { display: flex; gap: 14px; font-size: 11px; color: var(--muted); }
.legend .dot { display: inline-block; width: 10px; height: 2px; margin-right: 5px; vertical-align: middle; }
.legend .dot.pv { background: #0f6e56; }
.legend .dot.uv { background: #378add; }
.chart { width: 100%; }
.chart-trend { height: 260px; }
.chart-sm { height: 220px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.list { list-style: none; margin: 6px 0 0; padding: 0; }
.list li { display: flex; justify-content: space-between; font-size: 13px; padding: 7px 0; border-bottom: 1px dashed #f1f3f2; }
.list li:last-child { border-bottom: none; }
.list .name { color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list .val { color: var(--muted); font-variant-numeric: tabular-nums; }

.recent { margin-top: 6px; font-size: 12px; }
.recent .row { display: grid; grid-template-columns: 82px 108px 1fr 78px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #f1f3f2; color: #4b5563; }
.recent .row:last-child { border-bottom: none; }
.recent .head-row { color: #9ca3af; font-size: 11px; }
.recent .t { font-variant-numeric: tabular-nums; }
.recent .ip { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: #374151; }
.recent .trunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-tools { display: flex; align-items: center; gap: 8px; }
.mini {
  border: 1px solid var(--line); background: #fff; color: #4b5563; border-radius: 8px;
  padding: 3px 9px; font-size: 11px; cursor: pointer;
}
.mini:hover { border-color: #cbd5d1; color: var(--green); }
.live { font-size: 11px; color: #3b6d11; background: #eaf3de; padding: 2px 8px; border-radius: 99px; }
.empty { font-size: 13px; color: #9ca3af; margin: 16px 0; }
.foot { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 8px; line-height: 1.8; }

@media (max-width: 880px) {
  .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cols { grid-template-columns: 1fr; }
  .recent .row { grid-template-columns: 76px 96px 1fr; }
  .recent .row > span:nth-child(4),
  .recent .row > span:nth-child(5) { display: none; }
}
</style>
