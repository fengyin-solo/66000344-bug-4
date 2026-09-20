<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <h1 class="text-2xl font-bold text-cyan-400">语言词源图谱与多语系演化追踪</h1>
      <p class="text-sm text-slate-500 mt-1">D3.js力导向图 · 印欧语系演化 · 同源词对照 · 500+词根</p>
    </header>
    <div class="p-4 space-y-4">
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-400">词源力导向网络</h3>
            <div class="flex gap-3 text-xs">
              <span v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full" :style="{backgroundColor: f.color}"></span>{{ f.name }}
              </span>
            </div>
          </div>
          <div class="relative">
            <svg ref="svgRef" class="w-full bg-slate-900 rounded" style="height:460px"></svg>
            <div v-if="store.graph.nodes.length === 0" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
              当前条件下无匹配的词源关系
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 class="text-sm font-bold text-slate-400 mb-3">语系概览</h3>
            <div class="space-y-2">
              <div v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-start gap-2 text-sm">
                <span class="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" :style="{backgroundColor: f.color}"></span>
                <div><div class="font-bold">{{ f.name }}</div><div class="text-xs text-slate-500">{{ f.era }} · {{ f.languages.join('/') }}</div></div>
              </div>
            </div>
          </div>
          <div v-if="store.selectedNode" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-bold text-slate-400">选中节点</h3>
              <button class="text-slate-500 hover:text-slate-300 text-xs" @click="store.selectNode(null)">✕ 取消</button>
            </div>
            <div class="text-lg font-bold text-cyan-400">{{ store.selectedNode.word }}</div>
            <div class="text-sm text-slate-400">{{ store.selectedNode.language }} — {{ store.selectedNode.meaning }}</div>
            <div class="text-xs text-slate-500 mt-1">
              <span class="inline-block w-2 h-2 rounded-full mr-1" :style="{backgroundColor: COLORS[store.selectedNode.family] || '#64748b'}"></span>
              {{ familyName(store.selectedNode.family) }} · {{ store.selectedNode.era }}
            </div>
          </div>
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 text-xs text-slate-400">
            <h3 class="text-sm font-bold text-slate-400 mb-2">Grimm定律</h3>
            <div class="space-y-1">
              <div class="bg-slate-900 rounded p-2"><span class="text-cyan-400">p→f: </span>pater → father</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-green-400">t→θ: </span>tres → three</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-orange-400">k→h: </span>cord → heart</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 class="text-sm font-bold text-slate-400 mb-3">同源词对照表</h3>
        <div class="flex gap-2 mb-3">
          <input v-model="store.searchQuery" placeholder="搜索词根/含义..." class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
          <select v-model="store.selectedFamily" class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
            <option value="all">全部语系</option>
            <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-slate-700">
              <tr>
                <th class="px-2 py-2 text-left text-slate-300">词根</th>
                <th class="px-2 py-2 text-left text-slate-300">含义</th>
                <th class="px-2 py-2 text-left text-cyan-400">英语</th>
                <th class="px-2 py-2 text-left text-blue-400">法语</th>
                <th class="px-2 py-2 text-left text-green-400">德语</th>
                <th class="px-2 py-2 text-left text-orange-400">西班牙语</th>
                <th class="px-2 py-2 text-left text-purple-400">俄语</th>
                <th class="px-2 py-2 text-left text-yellow-400">拉丁语</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cs in store.filteredCognates" :key="cs.root"
                  class="border-t border-slate-700 hover:bg-slate-700 cursor-pointer"
                  :class="{ 'bg-slate-700/70': isActiveRow(cs) }"
                  @click="onRowClick(cs)">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES, rootNodeId } from './store/etymology'
import type { CognateSet, WordNode } from './types'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)
const COLORS: Record<string, string> = { ie: '#3b82f6', st: '#22c55e', aa: '#f59e0b', ural: '#8b5cf6' }

type SimNode = WordNode & d3.SimulationNodeDatum
type SimLink = d3.SimulationLinkDatum<SimNode> & { type?: string }

let sim: d3.Simulation<SimNode, SimLink> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let currentTransform: d3.ZoomTransform = d3.zoomIdentity
let nodeSel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown> | null = null
let linkSel: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null
let circleSel: d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown> | null = null
let labelSel: d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown> | null = null
let resizeObserver: ResizeObserver | null = null
// 节点坐标缓存：筛选/重绘时让保留的节点停在原位，避免图谱跳动
const positionCache = new Map<string, { x: number; y: number }>()

function familyName(id: string) {
  return LANGUAGE_FAMILIES.find(f => f.id === id)?.name ?? id
}

function isActiveRow(cs: CognateSet) {
  const id = store.selectedNodeId
  const rid = rootNodeId(cs.root)
  return !!id && (id === rid || id.startsWith(rid + '|'))
}

function onRowClick(cs: CognateSet) {
  const id = rootNodeId(cs.root)
  store.selectNode(id)
  centerOnNode(id)
}

function linkActive(l: SimLink, id: string | null) {
  if (!id) return false
  const s = typeof l.source === 'object' ? l.source.id : l.source
  const t = typeof l.target === 'object' ? l.target.id : l.target
  return s === id || t === id
}

function updateHighlight() {
  const id = store.selectedNodeId
  circleSel
    ?.attr('r', d => d.id === id ? (d.language === 'Proto-IE' ? 14 : 9) : (d.language === 'Proto-IE' ? 12 : 7))
    .attr('stroke', d => d.id === id ? '#22d3ee' : '#1e293b')
    .attr('stroke-width', d => d.id === id ? 3 : 1.5)
  labelSel
    ?.attr('fill', d => d.id === id ? '#67e8f9' : '#e2e8f0')
    .attr('font-weight', d => d.id === id ? 'bold' : 'normal')
  linkSel
    ?.attr('stroke', d => linkActive(d, id) ? '#22d3ee' : '#475569')
    .attr('stroke-width', d => linkActive(d, id) ? 2 : 1)
    .attr('opacity', d => linkActive(d, id) ? 0.9 : 0.5)
}

function centerOnNode(id: string) {
  const svgEl = svgRef.value
  if (!svgEl || !sim || !zoomBehavior) return
  const node = sim.nodes().find(n => n.id === id)
  if (!node || node.x == null || node.y == null) return
  const W = svgEl.clientWidth || 700
  const H = svgEl.clientHeight || 460
  const k = Math.min(Math.max(currentTransform.k, 1), 1.6)
  const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-node.x, -node.y)
  d3.select(svgEl).transition().duration(600).call(zoomBehavior.transform, t)
}

function drawGraph() {
  const svgEl = svgRef.value
  if (!svgEl) return
  const W = svgEl.clientWidth || 700
  const H = svgEl.clientHeight || 460
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const nodes: SimNode[] = store.graph.nodes.map(n => ({ ...n, ...positionCache.get(n.id) }))
  const links: SimLink[] = store.graph.links.map(l => ({ ...l }))

  sim?.stop()
  sim = d3.forceSimulation<SimNode, SimLink>(nodes)
    .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(55))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(22))
    .alphaDecay(0.05)

  const g = svg.append('g')
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on('zoom', (e) => {
      currentTransform = e.transform
      g.attr('transform', e.transform.toString())
    })
  svg.call(zoomBehavior)
  // 重绘后恢复缩放/平移，视图与节点关系保持一致
  svg.call(zoomBehavior.transform, currentTransform)

  linkSel = g.append('g').selectAll<SVGLineElement, SimLink>('line').data(links).join('line')
    .attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)

  nodeSel = g.append('g').selectAll<SVGGElement, SimNode>('g').data(nodes).join('g')
    .call(d3.drag<SVGGElement, SimNode>()
      .on('start', (e, d) => { if (!e.active) sim?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => { if (!e.active) sim?.alphaTarget(0); d.fx = null; d.fy = null }))
    .on('click', (_: any, d) => store.selectNode(d.id))

  circleSel = nodeSel.append('circle')
    .attr('r', d => d.language === 'Proto-IE' ? 12 : 7)
    .attr('fill', d => COLORS[d.family] || '#64748b')
    .attr('stroke', '#1e293b').attr('stroke-width', 1.5)
  labelSel = nodeSel.append('text')
    .attr('dy', -14).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#e2e8f0')
    .text(d => d.word.length > 8 ? d.word.slice(0, 8) + '…' : d.word)
  nodeSel.append('title').text(d => `${d.word} (${d.language}): ${d.meaning}`)

  sim.on('tick', () => {
    linkSel
      ?.attr('x1', d => (d.source as SimNode).x ?? 0).attr('y1', d => (d.source as SimNode).y ?? 0)
      .attr('x2', d => (d.target as SimNode).x ?? 0).attr('y2', d => (d.target as SimNode).y ?? 0)
    nodeSel?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    nodes.forEach(n => { if (n.x != null && n.y != null) positionCache.set(n.id, { x: n.x, y: n.y }) })
  })
  updateHighlight()
}

// 筛选结果变化 → 图谱与列表按同一份数据重绘
watch(() => store.graph, () => drawGraph())
// 选中变化 → 同步高亮（被隐藏的节点已在 store 中移出选中）
watch(() => store.selectedNodeId, () => updateHighlight())

onMounted(() => {
  drawGraph()
  // 恢复刷新前的选中位置
  const restored = store.selectedNodeId
  if (restored) setTimeout(() => centerOnNode(restored), 700)
  // 窗口尺寸变化：重设中心力并轻微重启布局，缩放位置与节点关系不错位
  resizeObserver = new ResizeObserver(() => {
    if (!svgRef.value || !sim) return
    const W = svgRef.value.clientWidth || 700
    const H = svgRef.value.clientHeight || 460
    sim.force('center', d3.forceCenter(W / 2, H / 2))
    sim.alpha(0.3).restart()
  })
  if (svgRef.value) resizeObserver.observe(svgRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  sim?.stop()
})
</script>
