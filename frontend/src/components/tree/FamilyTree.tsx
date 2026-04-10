import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/index'
import { useGetClanTree, useGetClan } from '@/hooks/useClan'
import { useGetClanFamilies } from '@/hooks/useFamilies'
import Spinner from '@/components/ui/Spinner'
import Sidebar from '@/components/layout/Sidebar'
import type { Member } from '@/types/member'
import type { Relationship } from '@/types/relationship'
import type { Family } from '@/types/family'

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_R      = 30
const H_GAP       = 72
const V_GAP       = 130
const NODE_STEP   = NODE_R * 2 + H_GAP   // 132 px between node centres
const FAM_H_PAD   = 52                   // horizontal padding inside each family box
const FAM_V_PAD   = 16                   // vertical padding inside each family box
const FAM_GAP     = 100                  // gap between adjacent family boxes
const CLAN_Y      = 48                   // y-centre of the clan badge
const FAM_TOP     = CLAN_Y + 58          // y of the top edge of family boxes
const LABEL_H     = 40                   // family label strip height inside box
const FIRST_GEN_Y = FAM_TOP + FAM_V_PAD + LABEL_H + NODE_R  // y-centre of gen-0 nodes

// ── Types ─────────────────────────────────────────────────────────────────────
type TipMember = Member & { birth_year?: number; gender?: string }
interface Tooltip { visible: boolean; x: number; y: number; member: TipMember | null }

interface FamilyBlock {
  family: Family
  members: Member[]
  positions: Map<string, { x: number; y: number }>
  spousePairs: Set<string>
  parentOf: Map<string, Set<string>>
  boxX: number
  boxWidth: number
  boxHeightExpanded: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s

// ── Per-family layout ─────────────────────────────────────────────────────────
// Computes node positions and bounding-box dimensions for a single family.
// All x values are global (i.e. already offset by `offsetX`).
function layoutFamily(
  family: Family,
  familyMembers: Member[],
  relationships: Relationship[],
  userToMember: Map<string, string>,
  offsetX: number,
): FamilyBlock {
  const memberIds = new Set(familyMembers.map((m) => m.id))

  const parentOf    = new Map<string, Set<string>>()
  const childOf     = new Map<string, Set<string>>()
  const spousePairs = new Set<string>()
  familyMembers.forEach((m) => { parentOf.set(m.id, new Set()); childOf.set(m.id, new Set()) })

  // Build within-family edges only — skip cross-family relationships.
  relationships.filter((r) => r.status === 'active').forEach((r) => {
    const from = userToMember.get(r.from_user_id) ?? r.from_user_id
    const to   = r.to_member_id
    if (!memberIds.has(from) || !memberIds.has(to)) return

    if (r.relationship_type === 'parent') {
      parentOf.get(from)?.add(to); childOf.get(to)?.add(from)
    } else if (r.relationship_type === 'child') {
      parentOf.get(to)?.add(from); childOf.get(from)?.add(to)
    } else if (r.relationship_type === 'spouse') {
      spousePairs.add([from, to].sort().join('|'))
    }
  })

  // BFS from roots (members with no known parents) to assign generations.
  const generation = new Map<string, number>()
  const roots = familyMembers.filter((m) => (childOf.get(m.id)?.size ?? 0) === 0)
  const queue: { id: string; gen: number }[] = (roots.length ? roots : familyMembers.slice(0, 1))
    .map((m) => ({ id: m.id, gen: 0 }))

  while (queue.length) {
    const { id, gen } = queue.shift()!
    if (generation.has(id)) continue
    generation.set(id, gen)
    for (const c of (parentOf.get(id) ?? [])) {
      if (!generation.has(c)) queue.push({ id: c, gen: gen + 1 })
    }
  }
  // Disconnected members default to generation 0.
  familyMembers.forEach((m) => { if (!generation.has(m.id)) generation.set(m.id, 0) })

  // Align spouses to the same (lower) generation.
  spousePairs.forEach((pair) => {
    const [a, b] = pair.split('|')
    const min = Math.min(generation.get(a) ?? 0, generation.get(b) ?? 0)
    generation.set(a, min); generation.set(b, min)
  })

  // Group members by generation; place each spouse immediately after their partner.
  const byGen = new Map<number, string[]>()
  generation.forEach((gen, id) => {
    if (!byGen.has(gen)) byGen.set(gen, [])
    byGen.get(gen)!.push(id)
  })
  const genKeys = Array.from(byGen.keys())
  genKeys.forEach((gen) => {
    const genIds  = byGen.get(gen)!
    const ordered: string[] = []
    const placed  = new Set<string>()
    genIds.forEach((id) => {
      if (placed.has(id)) return
      ordered.push(id); placed.add(id)
      spousePairs.forEach((pair) => {
        const [a, b] = pair.split('|')
        const spouse = a === id ? b : b === id ? a : null
        if (spouse && genIds.includes(spouse) && !placed.has(spouse)) {
          ordered.push(spouse); placed.add(spouse)
        }
      })
    })
    byGen.set(gen, ordered)
  })

  // Widest generation row determines the family box width.
  let maxGenCount = 1
  byGen.forEach((ids) => { maxGenCount = Math.max(maxGenCount, ids.length) })
  const contentW  = maxGenCount * NODE_STEP - H_GAP
  const boxWidth  = contentW + 2 * FAM_H_PAD
  const maxGen    = byGen.size > 0 ? Math.max(...Array.from(byGen.keys())) : 0
  const boxHeightExpanded =
    FAM_V_PAD + LABEL_H + (maxGen + 1) * V_GAP + NODE_R + FAM_V_PAD

  // Compute global node positions centred within the family box.
  // Inverted: deepest descendants (highest gen number) sit at FIRST_GEN_Y (top, nearest the
  // family label) and grandparents/roots (gen 0) sit at the bottom.
  const positions = new Map<string, { x: number; y: number }>()
  byGen.forEach((ids, gen) => {
    const genW    = ids.length * NODE_STEP - H_GAP
    const localX0 = FAM_H_PAD + (contentW - genW) / 2 + NODE_R
    ids.forEach((id, i) => {
      positions.set(id, {
        x: offsetX + localX0 + i * NODE_STEP,
        y: FIRST_GEN_Y + (maxGen - gen) * V_GAP,
      })
    })
  })

  return {
    family,
    members: familyMembers,
    positions,
    spousePairs,
    parentOf,
    boxX: offsetX,
    boxWidth,
    boxHeightExpanded,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const FamilyTree = () => {
  const user   = useSelector((s: RootState) => s.auth.user)
  const clanId = user?.clan_id ?? ''

  const { data: treeData,    isLoading: treeLoading } = useGetClanTree(clanId)
  const { data: familiesRaw = [], isLoading: famLoading } = useGetClanFamilies(clanId)
  const { data: clan } = useGetClan(clanId)

  const svgRef       = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomBehRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const savedZoom    = useRef<d3.ZoomTransform>(d3.zoomIdentity)
  const didFit       = useRef(false)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip]     = useState<Tooltip>({ visible: false, x: 0, y: 0, member: null })

  const isLoading = treeLoading || famLoading

  // ── D3 drawing ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || isLoading) return

    const members: Member[]           = treeData?.members       ?? []
    const relationships: Relationship[] = treeData?.relationships ?? []
    const families: Family[]          = familiesRaw

    if (members.length === 0 && families.length === 0) return

    d3.select(svgRef.current).selectAll('*').remove()

    const width  = containerRef.current?.clientWidth  ?? 1000
    const height = containerRef.current?.clientHeight ?? 700

    // user_id → member_id lookup
    const userToMember = new Map<string, string>()
    members.forEach((m) => { if (m.user_id) userToMember.set(m.user_id, m.id) })

    // Group members by family_id (unknown family_id → virtual bucket)
    const membersByFamily = new Map<string, Member[]>()
    families.forEach((f) => membersByFamily.set(f.id, []))
    members.forEach((m) => {
      const fid = m.family_id ?? '__unassigned__'
      if (!membersByFamily.has(fid)) membersByFamily.set(fid, [])
      membersByFamily.get(fid)!.push(m)
    })

    // Add virtual family for members with no family assignment.
    const allFamilies: Family[] = [...families]
    if ((membersByFamily.get('__unassigned__')?.length ?? 0) > 0) {
      allFamilies.push({
        id: '__unassigned__',
        clan_id: clanId,
        name: 'Unassigned',
        created_by: '',
        created_at: '',
      })
    }

    // Layout each non-empty family side-by-side.
    let currentX  = 0
    const blocks: FamilyBlock[] = []
    allFamilies.forEach((family) => {
      const fMembers = membersByFamily.get(family.id) ?? []
      if (fMembers.length === 0) return
      const block = layoutFamily(family, fMembers, relationships, userToMember, currentX)
      blocks.push(block)
      currentX += block.boxWidth + FAM_GAP
    })

    if (blocks.length === 0) return

    const totalW = currentX - FAM_GAP

    // ── SVG + shared defs ─────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height)

    const defs = svg.append('defs')
    defs.append('pattern')
      .attr('id', 'dot-grid').attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 28).attr('height', 28)
      .append('circle').attr('cx', 14).attr('cy', 14).attr('r', 1.2).attr('fill', '#e5e7eb')

    svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#dot-grid)')

    const shadow = defs.append('filter').attr('id', 'node-shadow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%')
    shadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 3)
      .attr('flood-color', 'rgba(0,0,0,0.10)')

    // Clip-paths for profile photos
    members.forEach((m) => {
      defs.append('clipPath').attr('id', `clip-${m.id}`)
        .append('circle').attr('r', NODE_R - 2)
    })

    const g = svg.append('g')

    // ── Zoom behaviour ────────────────────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 3])
      .on('zoom', (ev) => {
        savedZoom.current = ev.transform
        g.attr('transform', ev.transform.toString())
      })
    svg.call(zoom)
    zoomBehRef.current = zoom

    // Fit to view on first load; restore saved transform on collapse toggles.
    if (!didFit.current) {
      const allX = blocks.flatMap((b) => Array.from(b.positions.values()).map((p) => p.x))
      const allY = blocks.flatMap((b) => Array.from(b.positions.values()).map((p) => p.y))
      const minX = Math.min(0, ...(allX.length ? allX : [0])) - FAM_H_PAD
      const maxX = Math.max(totalW, ...(allX.length ? allX : [totalW])) + FAM_H_PAD
      const minY = 0
      const maxY = Math.max(FIRST_GEN_Y, ...(allY.length ? allY : [FIRST_GEN_Y])) + NODE_R + FAM_V_PAD

      const tw = maxX - minX || 1
      const th = maxY - minY || 1
      const s  = Math.min(0.92, Math.min(width / tw, height / th) * 0.85)
      const tx = (width  - tw * s) / 2 - minX * s
      const ty = (height - th * s) / 2 - minY * s
      const t  = d3.zoomIdentity.translate(tx, ty).scale(s)
      zoom.transform(svg, t)
      savedZoom.current = t
      didFit.current = true
    } else {
      zoom.transform(svg, savedZoom.current)
    }

    // ── Clan badge ────────────────────────────────────────────────────────────
    const clanName   = clan?.name ?? 'Clan'
    const badgeCX    = totalW / 2
    const badgeW     = Math.max(clanName.length * 9, 80) + 44
    const badgeH     = 34
    const badgeR     = badgeH / 2

    const clanG = g.append('g').attr('class', 'clan-badge')

    clanG.append('rect')
      .attr('x', badgeCX - badgeW / 2).attr('y', CLAN_Y - badgeR)
      .attr('width', badgeW).attr('height', badgeH).attr('rx', badgeR)
      .attr('fill', '#fffbeb').attr('stroke', '#CDB53F').attr('stroke-width', 1.5)

    clanG.append('text')
      .attr('x', badgeCX).attr('y', CLAN_Y)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-family', 'Merriweather, serif').attr('font-size', '12px')
      .attr('font-weight', '700').attr('fill', '#92710a').attr('letter-spacing', '0.1em')
      .text(clanName.toUpperCase())

    // Subtle connector lines from clan badge down to each family box
    blocks.forEach((block) => {
      const famCX = block.boxX + block.boxWidth / 2
      g.append('line')
        .attr('x1', badgeCX).attr('y1', CLAN_Y + badgeR)
        .attr('x2', famCX).attr('y2', FAM_TOP)
        .attr('stroke', '#CDB53F').attr('stroke-width', 1).attr('opacity', 0.25)
        .attr('stroke-dasharray', '3,5')
    })

    // ── Draw families ─────────────────────────────────────────────────────────
    const collapsedBoxH = FAM_V_PAD + LABEL_H + FAM_V_PAD

    blocks.forEach((block) => {
      const isCollapsed = collapsed.has(block.family.id)
      const boxH = isCollapsed ? collapsedBoxH : block.boxHeightExpanded
      const famCX = block.boxX + block.boxWidth / 2
      const labelCY = FAM_TOP + FAM_V_PAD + LABEL_H / 2

      const famG = g.append('g').attr('class', `family family-${block.family.id}`)

      // Family background box
      famG.append('rect')
        .attr('x', block.boxX).attr('y', FAM_TOP)
        .attr('width', block.boxWidth).attr('height', boxH)
        .attr('rx', 14)
        .attr('fill', 'rgba(255,255,255,0.60)')
        .attr('stroke', '#e5e7eb').attr('stroke-width', 1.2)

      // Family label pill + chevron — clickable to collapse/expand
      const famName  = block.family.name
      const labelW   = Math.max(famName.length * 8.5, 60) + 40
      const chevron  = isCollapsed ? '▶' : '▼'

      const labelG = famG.append('g')
        .style('cursor', 'pointer')
        .attr('class', 'family-label')

      labelG.append('rect')
        .attr('x', famCX - labelW / 2).attr('y', labelCY - 14)
        .attr('width', labelW).attr('height', 28).attr('rx', 14)
        .attr('fill', '#CDB53F').attr('opacity', 0.88)

      labelG.append('text')
        .attr('x', famCX - 10).attr('y', labelCY)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('font-family', 'Merriweather, serif').attr('font-size', '11px')
        .attr('font-weight', '700').attr('fill', '#1a1a1a')
        .text(trunc(famName, 20))

      labelG.append('text')
        .attr('x', famCX + labelW / 2 - 14).attr('y', labelCY)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('font-size', '9px').attr('fill', '#1a1a1a').attr('opacity', 0.65)
        .text(chevron)

      labelG.on('click', () => {
        setCollapsed((prev) => {
          const next = new Set(prev)
          if (next.has(block.family.id)) next.delete(block.family.id)
          else next.add(block.family.id)
          return next
        })
      })

      if (isCollapsed) return  // skip nodes and edges when family is collapsed

      // ── Edges ──────────────────────────────────────────────────────────────
      const edgeG = famG.append('g').attr('class', 'edges')

      // Spouse: classic double-line connector
      block.spousePairs.forEach((pair) => {
        const [a, b] = pair.split('|')
        const posA = block.positions.get(a), posB = block.positions.get(b)
        if (!posA || !posB || Math.abs(posA.y - posB.y) > 5) return
        const x1 = Math.min(posA.x, posB.x) + NODE_R
        const x2 = Math.max(posA.x, posB.x) - NODE_R
        const y  = posA.y
        ;[y - 2, y + 2].forEach((ly) => {
          edgeG.append('line')
            .attr('x1', x1).attr('y1', ly).attr('x2', x2).attr('y2', ly)
            .attr('stroke', '#CDB53F').attr('stroke-width', 1.5)
        })
      })

      // Parent → child: orthogonal bracket connectors (inverted layout)
      // Parent (grandparent) is below; children are above.
      // Stem rises from parent's TOP edge up to midY, crossbar runs at midY,
      // then drops connect midY down to each child's BOTTOM edge.
      block.parentOf.forEach((children, parentId) => {
        if (children.size === 0) return
        const pp = block.positions.get(parentId)
        if (!pp) return
        const childIds  = Array.from(children).filter((c) => block.positions.has(c))
        if (!childIds.length) return
        const childPos  = childIds.map((c) => block.positions.get(c)!)
        const midY      = pp.y - V_GAP / 2   // halfway between parent (below) and child (above)

        // Stem: parent top edge → midY (going upward)
        edgeG.append('line')
          .attr('x1', pp.x).attr('y1', pp.y - NODE_R)
          .attr('x2', pp.x).attr('y2', midY)
          .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')

        // Horizontal crossbar at midY spanning all children + parent x
        if (childIds.length > 1) {
          const allX = [pp.x, ...childPos.map((p) => p.x)]
          edgeG.append('line')
            .attr('x1', Math.min(...allX)).attr('y1', midY)
            .attr('x2', Math.max(...allX)).attr('y2', midY)
            .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
        }

        // Drops: midY → each child's bottom edge (going downward to child bottom)
        childPos.forEach((cp) => {
          if (childIds.length === 1) {
            edgeG.append('path')
              .attr('d', `M ${pp.x} ${midY} L ${cp.x} ${midY} L ${cp.x} ${cp.y + NODE_R}`)
              .attr('fill', 'none').attr('stroke', '#9ca3af')
              .attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
          } else {
            edgeG.append('line')
              .attr('x1', cp.x).attr('y1', midY).attr('x2', cp.x).attr('y2', cp.y + NODE_R)
              .attr('stroke', '#9ca3af').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
          }
        })
      })

      // ── Nodes ──────────────────────────────────────────────────────────────
      const nodeG = famG.selectAll<SVGGElement, Member>('g.node')
        .data(block.members)
        .enter().append('g').attr('class', 'node')
        .attr('transform', (d) => {
          const p = block.positions.get(d.id)
          return `translate(${p?.x ?? 0},${p?.y ?? 0})`
        })
        .style('cursor', 'default')

      // Glow ring for current user
      nodeG.filter((d) => !!d.user_id && d.user_id === user?.id)
        .append('circle').attr('r', NODE_R + 6)
        .attr('fill', 'rgba(205,181,63,0.18)').attr('stroke', '#CDB53F')
        .attr('stroke-width', 1).attr('stroke-dasharray', '4,3')

      nodeG.append('circle').attr('r', NODE_R)
        .attr('fill', 'white')
        .attr('stroke', (d) => d.user_id ? '#CDB53F' : '#e5e7eb')
        .attr('stroke-width', (d) => d.user_id ? 2.5 : 1.5)
        .attr('filter', 'url(#node-shadow)')

      nodeG.each(function (d) {
        const el = d3.select(this)
        if (d.profile_picture_url) {
          el.append('image')
            .attr('href', d.profile_picture_url)
            .attr('width', (NODE_R - 2) * 2).attr('height', (NODE_R - 2) * 2)
            .attr('x', -(NODE_R - 2)).attr('y', -(NODE_R - 2))
            .attr('clip-path', `url(#clip-${d.id})`)
        } else {
          el.append('text')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('font-size', '14px').attr('font-weight', '700')
            .attr('fill', '#CDB53F').attr('font-family', 'Merriweather, serif')
            .text(getInitials(d.full_name))
        }
      })

      nodeG.append('text')
        .attr('y', NODE_R + 13).attr('text-anchor', 'middle')
        .attr('font-size', '11px').attr('font-weight', '600')
        .attr('fill', '#111827').attr('font-family', 'Merriweather, serif')
        .text((d) => trunc(d.full_name, 14))

      nodeG
        .on('mouseover', (event: MouseEvent, d: Member) => {
          setTooltip({ visible: true, x: event.pageX, y: event.pageY, member: d as TipMember })
        })
        .on('mouseout', () => setTooltip({ visible: false, x: 0, y: 0, member: null }))
    })

  }, [treeData, familiesRaw, collapsed, clan, user?.id, isLoading, clanId])

  // ── JSX ───────────────────────────────────────────────────────────────────
  if (!user) return <Spinner fullScreen />

  const hasContent = (treeData?.members?.length ?? 0) > 0

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

          {!isLoading && !hasContent && (
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

          {/* SVG always mounted so ref is available to D3 */}
          <svg ref={svgRef} className="w-full h-full" style={{ display: isLoading ? 'none' : 'block' }} />

          {/* Hover tooltip */}
          {tooltip.visible && tooltip.member && (
            <div
              style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 14, zIndex: 50 }}
              className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-sm font-merriweather pointer-events-none min-w-[140px]"
            >
              <p className="font-bold text-gray-900 mb-0.5">{tooltip.member.full_name}</p>
              {tooltip.member.email && (
                <p className="text-xs text-gray-400 truncate">{tooltip.member.email}</p>
              )}
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
            Scroll to zoom · Drag to pan · Click family name to collapse
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyTree
