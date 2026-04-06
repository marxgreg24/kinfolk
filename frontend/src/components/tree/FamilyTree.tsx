import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/index'
import { useGetClanTree } from '@/hooks/useClan'
import Spinner from '@/components/ui/Spinner'
import Sidebar from '@/components/layout/Sidebar'
import type { Member } from '@/types/member'
import type { Relationship } from '@/types/relationship'

// ── Constants ──────────────────────────────────────────────────────────────────

const NODE_R    = 32   // circle radius
const H_GAP     = 80   // horizontal gap between nodes
const V_GAP     = 160  // vertical gap between generations
const NODE_STEP = NODE_R * 2 + H_GAP

// ── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '…' : s

// ── Types ────────────────────────────────────────────────────────────────────

type TooltipMember = Member & { birth_year?: number; gender?: string }
interface TooltipState { visible: boolean; x: number; y: number; member: TooltipMember | null }

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyTree = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: treeData, isLoading } = useGetClanTree(user?.clan_id ?? '')
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, member: null })

  useEffect(() => {
    const members: Member[] = treeData?.members ?? []
    const relationships: Relationship[] = treeData?.relationships ?? []
    if (!treeData || members.length === 0 || !svgRef.current) return

    d3.select(svgRef.current).selectAll('*').remove()

    const width  = containerRef.current?.clientWidth  ?? 900
    const height = containerRef.current?.clientHeight ?? 650

    // ── 1. Build lookup maps ──────────────────────────────────────────────────

    const memberById = new Map<string, Member>()
    members.forEach((m) => memberById.set(m.id, m))

    // Relationships store from_user_id (= user.id) but nodes are keyed by member.id.
    // Build user_id → member_id translation.
    const userToMember = new Map<string, string>()
    members.forEach((m) => { if (m.user_id) userToMember.set(m.user_id, m.id) })

    // ── 2. Normalise parent-child edges ──────────────────────────────────────
    // parentOf[p] = Set<childId>   childOf[c] = Set<parentId>
    const parentOf  = new Map<string, Set<string>>()
    const childOf   = new Map<string, Set<string>>()
    const spousePairs = new Set<string>() // sorted "a-b"

    members.forEach((m) => { parentOf.set(m.id, new Set()); childOf.set(m.id, new Set()) })

    relationships
      .filter((r) => r.status === 'active')
      .forEach((r) => {
        const fromId = userToMember.get(r.from_user_id) ?? r.from_user_id
        const toId   = r.to_member_id
        if (!memberById.has(fromId) || !memberById.has(toId)) return

        if (r.relationship_type === 'parent') {
          parentOf.get(fromId)?.add(toId)
          childOf.get(toId)?.add(fromId)
        } else if (r.relationship_type === 'child') {
          parentOf.get(toId)?.add(fromId)
          childOf.get(fromId)?.add(toId)
        } else if (r.relationship_type === 'spouse') {
          spousePairs.add([fromId, toId].sort().join('|'))
        }
      })

    // ── 3. Assign generations (BFS from roots) ────────────────────────────────

    const generation = new Map<string, number>()

    // Roots = members with no known parents
    const roots = members.filter((m) => (childOf.get(m.id)?.size ?? 0) === 0)
    const queue: { id: string; gen: number }[] = (roots.length ? roots : [members[0]])
      .map((m) => ({ id: m.id, gen: 0 }))

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!
      if (generation.has(id)) continue
      generation.set(id, gen)
      for (const childId of (parentOf.get(id) ?? [])) {
        if (!generation.has(childId)) queue.push({ id: childId, gen: gen + 1 })
      }
    }

    // Unvisited members (disconnected) → generation 0
    members.forEach((m) => { if (!generation.has(m.id)) generation.set(m.id, 0) })

    // Align spouses to the same (lower) generation
    spousePairs.forEach((pair) => {
      const [a, b] = pair.split('|')
      const minGen = Math.min(generation.get(a) ?? 0, generation.get(b) ?? 0)
      generation.set(a, minGen)
      generation.set(b, minGen)
    })

    // ── 4. Order members within each generation ───────────────────────────────
    // Place spouses adjacent to each other.

    const byGen = new Map<number, string[]>()
    generation.forEach((gen, id) => {
      if (!byGen.has(gen)) byGen.set(gen, [])
      byGen.get(gen)!.push(id)
    })

    byGen.forEach((ids, gen) => {
      const ordered: string[] = []
      const placed  = new Set<string>()

      // Seed order: children sorted by which parent is leftmost (pass 2 will refine)
      // Simple pass: keep existing order but pair spouses
      ids.forEach((id) => {
        if (placed.has(id)) return
        ordered.push(id)
        placed.add(id)
        // Immediately place spouse next
        spousePairs.forEach((pair) => {
          const [a, b] = pair.split('|')
          const spouse = a === id ? b : b === id ? a : null
          if (spouse && ids.includes(spouse) && !placed.has(spouse)) {
            ordered.push(spouse)
            placed.add(spouse)
          }
        })
      })

      byGen.set(gen, ordered)
    })

    // ── 5. Compute X/Y positions ──────────────────────────────────────────────

    const positions = new Map<string, { x: number; y: number }>()

    byGen.forEach((ids, gen) => {
      const totalW = ids.length * NODE_STEP - H_GAP
      const startX = width / 2 - totalW / 2 + NODE_R
      ids.forEach((id, i) => {
        positions.set(id, { x: startX + i * NODE_STEP, y: 80 + gen * V_GAP })
      })
    })

    // ── 6. SVG + zoom setup ───────────────────────────────────────────────────

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height)

    // Subtle dot-grid background
    const defs = svg.append('defs')
    defs.append('pattern')
      .attr('id', 'dot-grid').attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 28).attr('height', 28)
      .append('circle').attr('cx', 14).attr('cy', 14).attr('r', 1.2).attr('fill', '#e5e7eb')

    svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#dot-grid)')

    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()))
    svg.call(zoom)

    // Fit tree into viewport on load
    const allPos = Array.from(positions.values())
    const xs = allPos.map((p) => p.x), ys = allPos.map((p) => p.y)
    const minX = Math.min(...xs) - NODE_R - 20
    const maxX = Math.max(...xs) + NODE_R + 20
    const minY = Math.min(...ys) - NODE_R - 20
    const maxY = Math.max(...ys) + NODE_R + 40
    const treeW = maxX - minX, treeH = maxY - minY
    const scale = Math.min(0.95, Math.min(width / treeW, height / treeH) * 0.88)
    const tx = (width  - treeW * scale) / 2 - minX * scale
    const ty = (height - treeH * scale) / 2 - minY * scale
    zoom.transform(svg, d3.zoomIdentity.translate(tx, ty).scale(scale))

    // Clip paths for profile pictures
    members.forEach((m) => {
      defs.append('clipPath').attr('id', `clip-${m.id}`)
        .append('circle').attr('r', NODE_R - 2)
    })

    // ── 7. Draw generation labels (left rail) ─────────────────────────────────

    const maxGen = Math.max(...Array.from(byGen.keys()))
    const genLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

    for (let gen = 0; gen <= maxGen; gen++) {
      const y = 80 + gen * V_GAP
      g.append('text')
        .attr('x', minX - 28)
        .attr('y', y + 5)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Merriweather, serif')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#CDB53F')
        .attr('opacity', 0.7)
        .text(genLabels[gen] ?? `G${gen + 1}`)

      // Horizontal guide line
      g.append('line')
        .attr('x1', minX - 10).attr('y1', y)
        .attr('x2', maxX + 10).attr('y2', y)
        .attr('stroke', '#f3f4f6')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,6')
    }

    // ── 8. Draw edges ─────────────────────────────────────────────────────────

    const edgeG = g.append('g').attr('class', 'edges')

    // Spouse connectors: horizontal line between adjacent spouses at same level
    spousePairs.forEach((pair) => {
      const [a, b] = pair.split('|')
      const posA = positions.get(a), posB = positions.get(b)
      if (!posA || !posB || Math.abs(posA.y - posB.y) > 5) return
      const x1 = Math.min(posA.x, posB.x) + NODE_R
      const x2 = Math.max(posA.x, posB.x) - NODE_R
      const y  = posA.y

      // Double line for spouse (classic pedigree style)
      edgeG.append('line')
        .attr('x1', x1).attr('y1', y - 2)
        .attr('x2', x2).attr('y2', y - 2)
        .attr('stroke', '#CDB53F').attr('stroke-width', 1.5)
      edgeG.append('line')
        .attr('x1', x1).attr('y1', y + 2)
        .attr('x2', x2).attr('y2', y + 2)
        .attr('stroke', '#CDB53F').attr('stroke-width', 1.5)
    })

    // Parent → child: orthogonal elbow connectors grouped by parent
    // For each parent, gather children and draw a clean bracket
    parentOf.forEach((children, parentId) => {
      if (children.size === 0) return
      const parentPos = positions.get(parentId)
      if (!parentPos) return

      const childIds    = Array.from(children).filter((c) => positions.has(c))
      if (childIds.length === 0) return

      const childPositions = childIds.map((c) => positions.get(c)!)
      const midY = parentPos.y + V_GAP / 2

      // Vertical stem from parent bottom to midY
      edgeG.append('line')
        .attr('x1', parentPos.x).attr('y1', parentPos.y + NODE_R)
        .attr('x2', parentPos.x).attr('y2', midY)
        .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')

      if (childIds.length > 1) {
        // Horizontal crossbar spanning all children
        const xs = childPositions.map((p) => p.x)
        const barX1 = Math.min(...xs)
        const barX2 = Math.max(...xs)
        // Also include parent x in the bar
        const allX = [parentPos.x, ...xs]
        const fullX1 = Math.min(...allX)
        const fullX2 = Math.max(...allX)

        edgeG.append('line')
          .attr('x1', fullX1).attr('y1', midY)
          .attr('x2', fullX2).attr('y2', midY)
          .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
      }

      // Vertical drops from midY to each child top
      childPositions.forEach((cp) => {
        if (childIds.length === 1) {
          // Single child: just draw a bent elbow
          edgeG.append('path')
            .attr('d', `M ${parentPos.x} ${midY} L ${cp.x} ${midY} L ${cp.x} ${cp.y - NODE_R}`)
            .attr('fill', 'none')
            .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
        } else {
          edgeG.append('line')
            .attr('x1', cp.x).attr('y1', midY)
            .attr('x2', cp.x).attr('y2', cp.y - NODE_R)
            .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
        }
      })
    })

    // ── 9. Draw nodes ─────────────────────────────────────────────────────────

    const nodeG = g.selectAll<SVGGElement, Member>('g.node')
      .data(members)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => {
        const pos = positions.get(d.id)
        return `translate(${pos?.x ?? 0},${pos?.y ?? 0})`
      })
      .style('cursor', 'default')

    // Soft glow ring (current user highlight)
    nodeG
      .filter((d) => !!d.user_id && d.user_id === user?.id)
      .append('circle')
      .attr('r', NODE_R + 6)
      .attr('fill', 'rgba(205,181,63,0.18)')
      .attr('stroke', '#CDB53F')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')

    // Drop shadow via filter
    const filter = defs.append('filter').attr('id', 'node-shadow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%')
    filter.append('feDropShadow')
      .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 3)
      .attr('flood-color', 'rgba(0,0,0,0.10)')

    // White card circle
    nodeG.append('circle')
      .attr('r', NODE_R)
      .attr('fill', 'white')
      .attr('stroke', (d) => d.user_id ? '#CDB53F' : '#e5e7eb')
      .attr('stroke-width', (d) => d.user_id ? 2.5 : 1.5)
      .attr('filter', 'url(#node-shadow)')

    // Profile picture or initials
    nodeG.each(function (d) {
      const el = d3.select(this)
      if (d.profile_picture_url) {
        el.append('image')
          .attr('href', d.profile_picture_url)
          .attr('width', (NODE_R - 2) * 2)
          .attr('height', (NODE_R - 2) * 2)
          .attr('x', -(NODE_R - 2))
          .attr('y', -(NODE_R - 2))
          .attr('clip-path', `url(#clip-${d.id})`)
      } else {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '15px')
          .attr('font-weight', '700')
          .attr('fill', '#CDB53F')
          .attr('font-family', 'Merriweather, serif')
          .text(getInitials(d.full_name))
      }
    })

    // Full name below node
    nodeG.append('text')
      .attr('y', NODE_R + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#111827')
      .attr('font-family', 'Merriweather, serif')
      .text((d) => truncate(d.full_name, 15))

    // Hover tooltip
    nodeG
      .on('mouseover', (event: MouseEvent, d: Member) => {
        setTooltip({ visible: true, x: event.pageX, y: event.pageY, member: d as TooltipMember })
      })
      .on('mouseout', () => setTooltip({ visible: false, x: 0, y: 0, member: null }))

  }, [treeData])

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden"
          style={{ height: '100vh', background: '#fafaf8' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}

          {!isLoading && (!treeData || treeData.members.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.2} className="w-16 h-16">
                <circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/>
                <circle cx="18" cy="14" r="2"/><path d="M12 6v4M12 10l-4 2M12 10l4 2"/>
                <circle cx="12" cy="20" r="2"/><path d="M12 16v2"/>
              </svg>
              <p className="text-gray-400 text-sm font-merriweather text-center px-8">
                No clan members yet.<br />Your clan leader will add members to build the tree.
              </p>
            </div>
          )}

          {!isLoading && treeData && treeData.members.length > 0 && (
            <svg ref={svgRef} className="w-full h-full" />
          )}

          {/* Tooltip */}
          {tooltip.visible && tooltip.member && (
            <div
              style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 14, zIndex: 50 }}
              className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-sm font-merriweather pointer-events-none min-w-[140px]"
            >
              <p className="font-bold text-gray-900 mb-0.5">{tooltip.member.full_name}</p>
              {tooltip.member.email && <p className="text-xs text-gray-400 truncate">{tooltip.member.email}</p>}
              {tooltip.member.birth_year !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Born {tooltip.member.birth_year}</p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-5 left-72 bg-white/90 backdrop-blur-sm rounded-xl shadow border border-gray-100 px-4 py-3 text-xs font-merriweather">
            <p className="font-semibold text-gray-700 mb-2">Legend</p>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="28" height="12">
                <line x1="0" y1="6" x2="28" y2="6" stroke="#9ca3af" strokeWidth="1.5"/>
              </svg>
              <span className="text-gray-500">Parent – Child</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="28" height="12">
                <line x1="0" y1="4" x2="28" y2="4" stroke="#CDB53F" strokeWidth="1.5"/>
                <line x1="0" y1="8" x2="28" y2="8" stroke="#CDB53F" strokeWidth="1.5"/>
              </svg>
              <span className="text-gray-500">Spouse</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16">
                <circle cx="8" cy="8" r="7" fill="white" stroke="#CDB53F" strokeWidth="2"/>
              </svg>
              <span className="text-gray-500">Registered user</span>
            </div>
          </div>

          {/* Controls hint */}
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 px-3 py-2 text-[11px] text-gray-400 font-merriweather">
            Scroll to zoom · Drag to pan
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyTree
