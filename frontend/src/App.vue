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
            <div v-if="!store.filteredGraph.nodes.length" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
              当前筛选条件下没有可显示的词
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
          <div v-if="store.selectedNode" class="bg-slate-800 rounded-lg p-4 border border-cyan-700">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-bold text-slate-400">选中节点</h3>
              <button class="text-xs text-slate-500 hover:text-slate-300" @click="store.selectNode(null)">取消选择 ✕</button>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" :style="{backgroundColor: familyColor(store.selectedNode.family)}"></span>
              <div class="text-lg font-bold text-cyan-400">{{ store.selectedNode.word }}</div>
            </div>
            <div class="text-sm text-slate-400">{{ store.selectedNode.language }} — {{ store.selectedNode.meaning }}</div>
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
              <tr v-for="(cs, ci) in store.filteredCognates" :key="cs.root"
                  class="border-t border-slate-700 cursor-pointer transition-colors"
                  :class="store.selectedId === store.rootNodeId(cognateIndex(cs)) ? 'bg-cyan-900/40 hover:bg-cyan-900/50' : 'hover:bg-slate-700'"
                  @click="store.selectNode(store.rootNodeId(cognateIndex(cs)), true)">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
              </tr>
              <tr v-if="!store.filteredCognates.length">
                <td colspan="8" class="px-2 py-6 text-center text-slate-500">没有匹配的同源词组</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import type { D3ZoomEvent } from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES, COGNATE_SETS } from './store/etymology'
import type { WordNode } from './types'

const HEIGHT = 460
const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)

interface SimNode extends d3.SimulationNodeDatum { id: string; _data: WordNode }
interface SimLink extends d3.SimulationLinkDatum<SimNode> { source: string | SimNode; target: string | SimNode }

const familyColor = (family: string) => LANGUAGE_FAMILIES.find(f => f.id === family)?.color ?? '#64748b'
const cognateIndex = (cs: { root: string }) => COGNATE_SETS.findIndex(c => c.root === cs.root)

let sim: d3.Simulation<SimNode, SimLink> | null = null
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let rootG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let linkSel: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null = null
let nodeSel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown> | null = null
const simNodeMap = new Map<string, SimNode>()
let resizeObserver: ResizeObserver | null = null
let initialFocusDone = false

// 数据变化时增量同步：已存在的节点保留坐标，新增节点入场，退出节点移除；zoom 变换与视图位置不动
function syncGraph() {
  if (!sim || !linkSel || !nodeSel || !svgRef.value) return
  const W = svgRef.value.clientWidth || 700
  const desired = store.filteredGraph

  const nextNodes: SimNode[] = desired.nodes.map(n => {
    const existing = simNodeMap.get(n.id)
    if (existing) { existing._data = n; return existing }
    const created: SimNode = {
      id: n.id, _data: n,
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: HEIGHT / 2 + (Math.random() - 0.5) * 80,
    }
    simNodeMap.set(n.id, created)
    return created
  })
  const nextIds = new Set(nextNodes.map(n => n.id))
  Array.from(simNodeMap.keys()).forEach(id => { if (!nextIds.has(id)) simNodeMap.delete(id) })

  const nextLinks: SimLink[] = desired.links.map(l => ({
    source: typeof l.source === 'object' ? (l.source as WordNode).id : l.source,
    target: typeof l.target === 'object' ? (l.target as WordNode).id : l.target,
  }))

  const linkKey = (l: SimLink) =>
    (typeof l.source === 'object' ? l.source.id : l.source) + '-->' +
    (typeof l.target === 'object' ? l.target.id : l.target)

  linkSel = linkSel.data(nextLinks, linkKey)
  linkSel.exit().remove()
  const linkEnter = linkSel.enter().append('line')
    .attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)
  linkSel = linkEnter.merge(linkSel)

  nodeSel = nodeSel.data(nextNodes, d => d.id)
  nodeSel.exit().remove()
  const nodeEnter = nodeSel.enter().append('g').style('cursor', 'pointer')
    .call(d3.drag<SVGGElement, SimNode>()
      .on('start', (e, d) => { if (!e.active) sim!.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => { if (!e.active) sim!.alphaTarget(0); d.fx = null; d.fy = null }))
    .on('click', (_: any, d) => store.selectNode(d.id))
  nodeEnter.append('circle').attr('stroke', '#1e293b').attr('stroke-width', 1.5)
  nodeEnter.append('text').attr('dy', -14).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#e2e8f0')
    .style('pointer-events', 'none')
  nodeEnter.append('title')
  nodeSel = nodeEnter.merge(nodeSel)
  nodeSel.select('circle')
    .attr('r', d => d._data.language === 'Proto-IE' ? 12 : 7)
    .attr('fill', d => familyColor(d._data.family))
  nodeSel.select('text').text(d => d._data.word.length > 8 ? d._data.word.slice(0, 8) + '…' : d._data.word)
  nodeSel.select('title').text(d => `${d._data.word} (${d._data.language}): ${d._data.meaning}`)

  sim.nodes(nextNodes)
  ;(sim.force('link') as d3.ForceLink<SimNode, SimLink>).links(nextLinks)
  sim.alpha(0.6).restart()
  applyHighlight()
}

// 高亮：选中节点及其邻接节点/连线突出，其余淡出；无选中时恢复
function applyHighlight() {
  if (!linkSel || !nodeSel) return
  const selectedId = store.selectedId
  if (!selectedId) {
    nodeSel.style('opacity', 1)
    nodeSel.select('circle').attr('stroke', '#1e293b').attr('stroke-width', 1.5)
    linkSel.attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)
    return
  }
  const neighbors = new Set<string>([selectedId])
  const isLinked = (l: SimLink) => {
    const s = typeof l.source === 'object' ? l.source.id : l.source
    const t = typeof l.target === 'object' ? l.target.id : l.target
    if (s === selectedId) neighbors.add(t)
    if (t === selectedId) neighbors.add(s)
    return s === selectedId || t === selectedId
  }
  nodeSel.style('opacity', d => neighbors.has(d.id) ? 1 : 0.2)
  nodeSel.select('circle')
    .attr('stroke', d => d.id === selectedId ? '#22d3ee' : '#1e293b')
    .attr('stroke-width', d => d.id === selectedId ? 3 : 1.5)
  linkSel
    .attr('stroke', l => isLinked(l) ? '#22d3ee' : '#475569')
    .attr('stroke-width', l => isLinked(l) ? 2 : 1)
    .attr('opacity', l => isLinked(l) ? 0.9 : 0.12)
}

// 列表切换词条时把对应节点平移到视口中心（保持用户当前缩放级别）
function focusSelected() {
  if (!svgRef.value || !zoom) return
  const node = store.selectedId ? simNodeMap.get(store.selectedId) : null
  if (!node || node.x == null || node.y == null) return
  const W = svgRef.value.clientWidth || 700
  const k = d3.zoomTransform(svgRef.value).k
  const target = d3.zoomIdentity.translate(W / 2, HEIGHT / 2).scale(k).translate(-node.x, -node.y)
  d3.select(svgRef.value).transition().duration(450).call(zoom.transform as any, target)
}

// 筛选结果变化：同一数据驱动图谱增量更新（选中已在 store 中随结果收敛）
watch(() => store.filteredGraph, syncGraph)
watch(() => store.selectedId, () => applyHighlight())
watch(() => store.focusRequest, (n, old) => { if (old != null && n > old) focusSelected() })

onMounted(() => {
  const svgEl = svgRef.value!
  const W = svgEl.clientWidth || 700
  const svg = d3.select(svgEl)
  rootG = svg.append('g')

  sim = d3.forceSimulation<SimNode>([])
    .force('link', d3.forceLink<SimNode, SimLink>().id(d => d.id).distance(55))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(W / 2, HEIGHT / 2))
    .force('collision', d3.forceCollide(22))
    .on('tick', () => {
      linkSel?.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
      nodeSel?.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

  zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3])
    .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
      rootG!.attr('transform', String(event.transform))
    })
  svg.call(zoom)

  linkSel = rootG.append('g').selectAll<SVGLineElement, SimLink>('line')
  nodeSel = rootG.append('g').selectAll<SVGGElement, SimNode>('g')

  syncGraph()

  // 刷新恢复选中后，等初始布局稳定再把选中节点移入视野
  setTimeout(() => {
    if (!initialFocusDone && store.selectedId) {
      initialFocusDone = true
      focusSelected()
    }
  }, 600)

  // 容器尺寸变化：只更新中心力并轻微重启布局，不重置 zoom 变换，避免缩放位置与节点关系错位
  resizeObserver = new ResizeObserver(() => {
    if (!svgRef.value || !sim) return
    const w = svgRef.value.clientWidth || 700
    sim.force('center', d3.forceCenter(w / 2, HEIGHT / 2))
    sim.alpha(0.15).restart()
  })
  resizeObserver.observe(svgEl)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  sim?.stop()
})
</script>
