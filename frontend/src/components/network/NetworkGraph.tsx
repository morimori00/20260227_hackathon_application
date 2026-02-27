import { useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';

interface Node {
  id: string;
  bank_name: string;
  entity_name?: string;
  total_amount: number;
  transaction_count: number;
  fraud_score: number;
  is_origin: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  amount: number;
  fraud_score: number;
  prediction: number;
}

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  highlightedTxnIds?: string[];
  width: number;
  height: number;
}

export default function NetworkGraph({ nodes, edges, highlightedTxnIds, width, height }: NetworkGraphProps) {
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);

  const graphData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    })),
  };

  const getNodeColor = (node: any) => {
    if (node.is_origin) return '#2f80ed';
    if (node.fraud_score > 0.7) return '#eb5757';
    if (node.fraud_score > 0.3) return '#f2994a';
    return '#9b9a97';
  };

  const getNodeSize = (node: any) => {
    const base = 4;
    const scale = Math.log10(Math.max(node.total_amount, 1)) * 1.5;
    return base + scale;
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = getNodeSize(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();
    if (node.is_origin) {
      ctx.strokeStyle = '#1a56db';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const linkColor = useCallback((link: any) => {
    if (highlightedTxnIds?.includes(link.id)) return '#9b51e0';
    return link.prediction === 1 ? '#eb5757' : '#e9e9e7';
  }, [highlightedTxnIds]);

  const linkWidth = useCallback((link: any) => {
    if (highlightedTxnIds?.includes(link.id)) return 3;
    return link.prediction === 1 ? 2 : 0.5;
  }, [highlightedTxnIds]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-100);
    }
  }, []);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width}
      height={height}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, getNodeSize(node) + 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkDirectionalArrowLength={4}
      linkDirectionalArrowRelPos={0.8}
      onNodeClick={(node: any) => navigate(`/accounts/${node.id}`)}
      onLinkClick={(link: any) => navigate(`/transactions/${link.id}`)}
      nodeLabel={(node: any) =>
        `${node.id}\n${node.bank_name}${node.entity_name ? '\n' + node.entity_name : ''}\nScore: ${(node.fraud_score * 100).toFixed(1)}%`
      }
      linkLabel={(link: any) => `Amount: ${link.amount?.toLocaleString()}\nScore: ${(link.fraud_score * 100).toFixed(1)}%`}
      cooldownTicks={100}
      backgroundColor="#ffffff"
    />
  );
}
