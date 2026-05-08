import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { MusicRelationshipPath } from '../../types/music';

interface Props {
  paths: MusicRelationshipPath[];
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  connections: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

/** Base radius for every node circle (px). */
const BASE_NODE_RADIUS = 5;
/** Maximum extra radius added based on connection count (px). */
const MAX_CONNECTION_BONUS = 8;

/** Compute the visual radius for a node based on its connections. */
const nodeRadius = (connections: number) =>
  BASE_NODE_RADIUS + Math.min(connections, MAX_CONNECTION_BONUS);

const TYPE_COLORS: Record<string, string> = {
  artist: '#7c3aed',
  recording: '#059669',
  release: '#2563eb',
  work: '#d97706',
  label: '#dc2626',
  area: '#0891b2',
  genre: '#db2777',
  group: '#7c3aed',
  person: '#7c3aed',
};

const getColor = (type: string): string =>
  TYPE_COLORS[type.toLowerCase()] ?? '#6b7280';

const MusicForceGraph: React.FC<Props> = ({ paths }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  // Measure container width and force a canvas resize after mount.
  // react-force-graph-2d uses direct DOM manipulation via react-kapsule,
  // which can fail to render the canvas properly under React 19's rendering
  // pipeline. Dispatching a resize event after mount forces the library to
  // recalculate canvas dimensions and redraw.
  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      if (w > 0) setContainerWidth(w);
    }

    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const graphData = useMemo(() => {
    console.debug('[MusicForceGraph] Building graph from paths:', paths);
    const nodeMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];
    const linkSet = new Set<string>();

    for (const path of paths) {
      console.debug('[MusicForceGraph] Processing path:', {
        nodeCount: path.nodes?.length ?? 0,
        edgeCount: path.edges?.length ?? 0,
        description: path.description,
      });

      if (!Array.isArray(path.nodes) || !Array.isArray(path.edges)) {
        console.warn('[MusicForceGraph] Skipping malformed path (missing nodes or edges array):', path);
        continue;
      }

      for (const node of path.nodes) {
        if (!node.id || !node.label) {
          console.warn('[MusicForceGraph] Skipping node with missing id or label:', node);
          continue;
        }
        if (!nodeMap.has(node.id)) {
          // Normalize type to lowercase for consistent color mapping
          nodeMap.set(node.id, { id: node.id, label: node.label, type: (node.type ?? 'unknown').toLowerCase(), connections: 0 });
        }
      }
      for (const edge of path.edges) {
        if (!edge.sourceId || !edge.targetId) {
          console.warn('[MusicForceGraph] Skipping edge with missing sourceId or targetId:', edge);
          continue;
        }
        const key = `${edge.sourceId}-${edge.type}-${edge.targetId}`;
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: edge.sourceId, target: edge.targetId, type: edge.type });
          const src = nodeMap.get(edge.sourceId);
          const tgt = nodeMap.get(edge.targetId);
          if (src) src.connections++;
          if (tgt) tgt.connections++;
        }
      }
    }

    const result = { nodes: Array.from(nodeMap.values()), links };
    console.debug('[MusicForceGraph] Final graph data:', { nodeCount: result.nodes.length, linkCount: result.links.length });
    if (result.nodes.length > 0) {
      console.debug('[MusicForceGraph] Sample node:', result.nodes[0]);
    }
    if (result.links.length > 0) {
      console.debug('[MusicForceGraph] Sample link:', result.links[0]);
    }
    return result;
  }, [paths]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = nodeRadius(node.connections);
      const color = getColor(node.type);
      const isHovered = hoveredNode?.id === node.id;

      // circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? color : color + 'cc';
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // label (only when zoomed in enough)
      if (globalScale > 1.2 || isHovered) {
        const fontSize = Math.max(11 / globalScale, 3);
        ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#111111';
        ctx.fillText(node.label, node.x!, node.y! + r + 2);
      }
    },
    [hoveredNode],
  );

  if (graphData.nodes.length === 0) {
    return <p className="music-rp-empty">No relationship data to visualize.</p>;
  }

  // Build a legend from the unique types present
  const uniqueTypes = Array.from(new Set(graphData.nodes.map((n) => n.type)));

  return (
    <div className="music-fg-root">
      {/* Legend */}
      <div className="music-fg-legend">
        {uniqueTypes.map((t) => (
          <span key={t} className="music-fg-legend-item">
            <span className="music-fg-legend-dot" style={{ background: getColor(t) }} />
            {t}
          </span>
        ))}
        <span className="music-fg-legend-hint">Scroll to zoom · Drag to pan · Hover for details</span>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div className="music-fg-tooltip">
          <strong>{hoveredNode.label}</strong>
          <span className="music-fg-tooltip-type">{hoveredNode.type}</span>
          <span className="music-fg-tooltip-conn">{hoveredNode.connections} connection{hoveredNode.connections !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div ref={containerRef} className="music-fg-canvas">
        <ForceGraph2D
          graphData={graphData as any}
          width={containerWidth}
          height={500}
          nodeCanvasObject={paintNode as any}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            const r = nodeRadius((node as GraphNode).connections);
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, r + 2, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={() => '#d1d5db'}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeHover={(node: any) => setHoveredNode(node as GraphNode | null)}
          cooldownTicks={80}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>
      {/* eslint-enable @typescript-eslint/no-explicit-any */}
    </div>
  );
};

export default MusicForceGraph;
