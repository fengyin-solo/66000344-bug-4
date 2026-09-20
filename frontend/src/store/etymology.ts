import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph, rootNodeId } from '../mock/data'
import type { WordNode } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS, rootNodeId }

const STORAGE_KEY = 'etymology:selectedNode'

function readStoredId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

export const useEtymologyStore = defineStore('etymology', () => {
  const searchQuery = ref('')
  const selectedFamily = ref('all')
  // 刷新后恢复上次选中
  const selectedNodeId = ref<string | null>(readStoredId())

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs => {
      const q = searchQuery.value.trim().toLowerCase()
      const matchSearch = !q || cs.root.toLowerCase().includes(q) || cs.meaning.includes(q) || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = selectedFamily.value === 'all' || cs.family === selectedFamily.value
      return matchSearch && matchFamily
    })
  )

  // 图谱与列表共用同一份筛选结果：条件变化时只保留当前范围的关系
  const graph = computed(() => buildGraph(filteredCognates.value))

  // 详情面板只展示当前图谱中可见的节点，隐藏对象自动退出详情
  const selectedNode = computed<WordNode | null>(() =>
    graph.value.nodes.find(n => n.id === selectedNodeId.value) ?? null
  )

  function selectNode(id: string | null) {
    selectedNodeId.value = id
  }

  // 条件变化后：被隐藏的选中节点退出高亮，选中状态按新结果落到合理节点
  watch(graph, (g) => {
    if (selectedNodeId.value && !g.nodes.some(n => n.id === selectedNodeId.value)) {
      selectedNodeId.value = g.nodes.find(n => n.id.startsWith('root:'))?.id ?? g.nodes[0]?.id ?? null
    }
  }, { immediate: true })

  watch(selectedNodeId, (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* 隐私模式等场景下忽略持久化失败 */ }
  })

  return { graph, selectedNode, selectedNodeId, selectNode, searchQuery, selectedFamily, filteredCognates }
})
