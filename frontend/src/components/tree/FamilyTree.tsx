import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/index'
import { useGetClanTree } from '@/hooks/useClan'
import Spinner from '@/components/ui/Spinner'
import Sidebar from '@/components/layout/Sidebar'
import type { Member } from '@/types/member'
import type { Relationship } from '@/types/relationship'
import type { RelationshipType } from '@/types/relationship'
import { getRelationshipLabel } from '@/utils/relationships'

// ── Types ────────────────────────────────────────────────────────────────────

type SimNode = Member & d3.SimulationNodeDatum

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  linkType: RelationshipType
  isInferred: boolean
}

type TooltipMember = Member & { birth_year?: number; gender?: string }

interface TooltipState {
  visible: boolean
  x: number
  y: number
  member: TooltipMember | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '…' : s

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyTree = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: treeData, isLoading } = useGetClanTree(user?.clan_id ?? '')

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    member: null,
  })

  useEffect(() => {
    const members = treeData?.members ?? []
    const relationships = treeData?.relationships ?? []
    if (!treeData || members.length === 0 || !svgRef.current) return

    // ── 1. Clear ──────────────────────────────────────────────────────────────
    d3.select(svgRef.current).selectAll('*').remove()

    // ── 2. Dimensions ─────────────────────────────────────────────────────────
    const width = containerRef.current?.clientWidth ?? 800
    const height = containerRef.current?.clientHeight ?? 600

    // ── 3. SVG + zoom ─────────────────────────────────────────────────────────
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)

    // ── 4. Nodes + links ──────────────────────────────────────────────────────
    const nodes: SimNode[] = members.map((m) => ({ ...m }))

    const activeRels: Relationship[] = relationships.filter(
      (r) => r.status === 'active',
    )

    const links: SimLink[] = activeRels.map((r) => ({
      source: r.from_user_id,
      target: r.to_member_id,
      linkType: r.relationship_type,
      isInferred: r.is_inferred,
    }))

    // ── 5. Force simulation ───────────────────────────────────────────────────
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>(60))
      .stop()

    simulation.tick(300)

    // ── 6. Draw links ─────────────────────────────────────────────────────────
    g.selectAll<SVGLineElement, SimLink>('line.edge')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('x1', (d) => (d.source as SimNode).x ?? 0)
      .attr('y1', (d) => (d.source as SimNode).y ?? 0)
      .attr('x2', (d) => (d.target as SimNode).x ?? 0)
      .attr('y2', (d) => (d.target as SimNode).y ?? 0)
      .attr('stroke', (d) => (d.isInferred ? '#A0522D' : '#CDB53F'))
      .attr('stroke-width', (d) => (d.isInferred ? 1.5 : 2))
      .attr('stroke-dasharray', (d) => (d.isInferred ? '6,4' : null))

    // Link labels
    g.selectAll<SVGTextElement, SimLink>('text.edge-label')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'edge-label')
      .attr(
        'x',
        (d) =>
          (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2,
      )
      .attr(
        'y',
        (d) =>
          (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2 - 5,
      )
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d) => getRelationshipLabel(d.linkType))

    // ── 7. Draw nodes ─────────────────────────────────────────────────────────
    const nodeG = g
      .selectAll<SVGGElement, SimNode>('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      .style('cursor', 'pointer')

    // Outer circle
    nodeG
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'white')
      .attr('stroke', '#CDB53F')
      .attr('stroke-width', 2.5)

    // Clip paths (one per node) for profile pictures
    const defs = svg.append('defs')
    nodes.forEach((node) => {
      defs
        .append('clipPath')
        .attr('id', `clip-${node.id}`)
        .append('circle')
        .attr('r', 26)
    })

    // Profile picture or initials
    nodeG.each(function (d) {
      const el = d3.select(this)
      if (d.profile_picture_url) {
        el.append('image')
          .attr('href', d.profile_picture_url)
          .attr('width', 52)
          .attr('height', 52)
          .attr('x', -26)
          .attr('y', -26)
          .attr('clip-path', `url(#clip-${d.id})`)
      } else {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 5)
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', '#CDB53F')
          .text(getInitials(d.full_name))
      }
    })

    // Name label below node
    nodeG
      .append('text')
      .attr('y', 38)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#1a1a1a')
      .attr('font-family', 'Merriweather, serif')
      .text((d) => truncate(d.full_name, 16))

    // Hover events
    nodeG
      .on('mouseover', (event: MouseEvent, d: SimNode) => {
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          member: d as TooltipMember,
        })
      })
      .on('mouseout', () => {
        setTooltip({ visible: false, x: 0, y: 0, member: null })
      })

    // ── 8. Initial zoom transform ─────────────────────────────────────────────
    zoom.transform(
      svg,
      d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8),
    )

    return () => {
      simulation.stop()
    }
  }, [treeData])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">

        <div
          ref={containerRef}
          className="relative w-full overflow-hidden bg-gray-50"
          style={{ height: 'calc(100vh)' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}

          {!isLoading && (!treeData || treeData.members.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-merriweather text-center px-8">
              No clan members yet. Your clan leader will add members to see the tree.
            </div>
          )}

          {!isLoading && treeData && treeData.members.length > 0 && (
            <svg ref={svgRef} className="w-full h-full" />
          )}

          {/* Tooltip */}
          {tooltip.visible && tooltip.member && (
            <div
              style={{
                position: 'fixed',
                left: tooltip.x + 12,
                top: tooltip.y - 12,
                zIndex: 50,
              }}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm font-merriweather pointer-events-none"
            >
              <p className="font-bold text-gray-900">{tooltip.member.full_name}</p>
              {tooltip.member.birth_year !== undefined && (
                <p className="text-gray-500">Born: {tooltip.member.birth_year}</p>
              )}
              {tooltip.member.gender !== undefined && (
                <p className="text-gray-500 capitalize">{tooltip.member.gender}</p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-72 bg-white rounded-lg shadow border border-gray-100 p-3 text-xs font-merriweather">
            <p className="font-semibold text-gray-700 mb-2">Legend</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 border-t-2 border-primary" />
              <span className="text-gray-600">Direct relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-secondary border-dashed" />
              <span className="text-gray-600">Inferred relationship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyTree
