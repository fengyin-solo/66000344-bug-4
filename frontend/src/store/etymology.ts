import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph, rootNodeId, wordNodeId } from '../mock/data'
import type { WordNode, WordLink } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

const STORAGE_KEY = 'etymology-ui-state'

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const useEtymologyStore = defineStore('etymology', () => {
  const fullGraph = buildGraph()
  const saved = loadState()

  const searchQuery = ref(saved.searchQuery || '')
  const selectedFamily = ref(saved.selectedFamily || 'all')
  // 选中只存 id，渲染时从当前筛选结果中解析，避免持有已不可见节点的旧引用
  const selectedId = ref<string | null>(saved.selectedId ?? null)
  // 列表/图谱请求把视图平移到 selectedId 的序号，平移后由视图清空
  const focusRequest = ref(0)

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs => {
      const q = searchQuery.value.trim().toLowerCase()
      const matchSearch = !q
        || cs.root.toLowerCase().includes(q)
        || cs.meaning.toLowerCase().includes(q)
        || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = selectedFamily.value === 'all' || cs.family === selectedFamily.value
      return matchSearch && matchFamily
    })
  )

  // 以同一套筛选结果派生图谱：只保留当前可见同源词组内的节点与关系
  const filteredGraph = computed<{ nodes: WordNode[]; links: WordLink[] }>(() => {
    const visibleNodeIds = new Set<string>()
    filteredCognates.value.forEach(cs => {
      const ci = COGNATE_SETS.indexOf(cs)
      visibleNodeIds.add(rootNodeId(ci))
      Object.keys(cs.languages).forEach(lang => visibleNodeIds.add(wordNodeId(ci, lang)))
    })
    const nodes = fullGraph.nodes.filter(n => visibleNodeIds.has(n.id))
    const links = fullGraph.links.filter(l => {
      const sid = typeof l.source === 'object' ? (l.source as WordNode).id : l.source
      const tid = typeof l.target === 'object' ? (l.target as WordNode).id : l.target
      return visibleNodeIds.has(sid) && visibleNodeIds.has(tid)
    })
    return { nodes, links }
  })

  const nodeById = computed(() => {
    const map = new Map<string, WordNode>()
    filteredGraph.value.nodes.forEach(n => map.set(n.id, n))
    return map
  })

  const selectedNode = computed(() =>
    selectedId.value ? nodeById.value.get(selectedId.value) ?? null : null
  )

  // 条件变化后收敛选中：当前选中仍可见则保留，否则落到结果中第一个词根节点；结果为空则清空
  function reconcileSelection() {
    const nodes = filteredGraph.value.nodes
    if (selectedId.value && nodes.some(n => n.id === selectedId.value)) return
    selectedId.value = nodes.find(n => n.language === 'Proto-IE')?.id ?? nodes[0]?.id ?? null
  }

  watch(filteredGraph, reconcileSelection, { immediate: true })

  function selectNode(id: string | null, focus = false) {
    selectedId.value = id
    if (id && focus) focusRequest.value++
  }

  watch(
    [searchQuery, selectedFamily, selectedId],
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        searchQuery: searchQuery.value,
        selectedFamily: selectedFamily.value,
        selectedId: selectedId.value,
      }))
    },
    { immediate: true }
  )

  return {
    searchQuery, selectedFamily, selectedId, focusRequest,
    filteredCognates, filteredGraph, selectedNode,
    selectNode, rootNodeId,
  }
})
